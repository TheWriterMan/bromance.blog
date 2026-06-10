import { NextRequest, NextResponse } from 'next/server';
import { db, generateId, sql as pgClient } from '@repo/db';
import * as schema from '@repo/db';
import { eq, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import cloudinary, { CLOUDINARY_FOLDER } from '@/lib/cloudinary';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Restore can take longer

const execAsync = promisify(exec);

/**
 * POST /api/backups/restore — Restore from a specific backup.
 * Body: { backup_id: string }
 *
 * Safety:
 * 1. Creates a pre-restore safety backup first
 * 2. Downloads the target backup from Cloudinary
 * 3. For plain SQL (INSERT-based) backups: executes in-process via postgres client
 *    inside a transaction — no psql required, works on Vercel.
 * 4. For binary pg_dump format: falls back to pg_restore CLI.
 */
export async function POST(req: NextRequest) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const backupId = body.backup_id;

    if (!backupId || typeof backupId !== 'string') {
      return NextResponse.json({ error: 'backup_id is required' }, { status: 400 });
    }

    // Find the backup record
    const [backup] = await db
      .select()
      .from(schema.backups)
      .where(eq(schema.backups.id, backupId));

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json(
        { error: 'Database connection string not configured for restore' },
        { status: 500 }
      );
    }

    // Step 1: Create a pre-restore safety backup
    const safetyTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safetyFilename = `pre-restore-${safetyTimestamp}.sql.gz`;
    const safetyTmpFile = join(tmpdir(), `bromance-pre-restore-${Date.now()}.sql`);
    const safetyTmpGz = `${safetyTmpFile}.gz`;

    try {
      // Try pg_dump first (available in GH Actions, not on Vercel)
      await execAsync(`pg_dump "${dbUrl}" --data-only --no-owner --no-acls -f "${safetyTmpFile}"`, {
        timeout: 45000,
      });
      await execAsync(`gzip "${safetyTmpFile}"`);
    } catch {
      // pg_dump not available — create SQL INSERT export via db client
      const tables = ['categories', 'tags', 'posts', 'post_tags', 'media_items', 'authors',
        'post_revisions', 'redirects', 'post_likes', 'comments', 'settings', 'backups'];
      let dumpContent = `-- Pre-restore safety backup\n-- Created: ${new Date().toISOString()}\n\n`;
      for (const table of tables) {
        const rows = await db.execute(sql.raw(`SELECT * FROM ${table}`));
        if (rows.length === 0) continue;
        dumpContent += `-- Table: ${table}\n`;
        for (const r of rows) {
          const cols = Object.keys(r as object);
          const vals = cols.map((c) => {
            const v = (r as Record<string, unknown>)[c];
            if (v === null) return 'NULL';
            if (typeof v === 'number' || typeof v === 'boolean') return String(v);
            return `'${String(v).replace(/'/g, "''")}'`;
          });
          dumpContent += `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
        }
        dumpContent += '\n';
      }
      await writeFile(safetyTmpFile, dumpContent, 'utf-8');
      await execAsync(`gzip "${safetyTmpFile}"`);
    }

    // Upload safety backup to Cloudinary
    const safetyBuffer = await readFile(safetyTmpGz);
    const safetyPublicId = `${CLOUDINARY_FOLDER}/backups/pre-restore-${safetyTimestamp}`;

    await new Promise<void>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'raw', public_id: safetyPublicId, overwrite: true },
        (error) => { if (error) reject(error); else resolve(); }
      );
      stream.end(safetyBuffer);
    });

    // Record safety backup in DB
    const counts = await db.execute(sql`
      SELECT
        (SELECT count(*)::int FROM posts WHERE deleted_at IS NULL) as post_count,
        (SELECT count(*)::int FROM categories WHERE deleted_at IS NULL) as category_count,
        (SELECT count(*)::int FROM tags) as tag_count,
        (SELECT count(*)::int FROM media_items) as media_count
    `);
    const countRow = counts[0] as { post_count: number; category_count: number; tag_count: number; media_count: number };

    await db.insert(schema.backups).values({
      id: generateId(),
      cloudinaryId: safetyPublicId,
      filename: safetyFilename,
      bytes: safetyBuffer.length,
      postCount: countRow.post_count,
      categoryCount: countRow.category_count,
      tagCount: countRow.tag_count,
      mediaCount: countRow.media_count,
    });

    try { await unlink(safetyTmpGz); } catch { /* ignore */ }

    // Step 2: Download the target backup from Cloudinary
    const downloadUrl = cloudinary.url(backup.cloudinaryId, {
      resource_type: 'raw',
      type: 'upload',
      secure: true,
    });

    const response = await fetch(downloadUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to download backup from Cloudinary: HTTP ${response.status}` },
        { status: 500 }
      );
    }

    const backupBuffer = Buffer.from(await response.arrayBuffer());
    const restoreTmpGz = join(tmpdir(), `bromance-restore-${Date.now()}.sql.gz`);
    const restoreTmpFile = restoreTmpGz.replace('.gz', '');

    await writeFile(restoreTmpGz, backupBuffer);
    await execAsync(`gunzip -f "${restoreTmpGz}"`);

    // Step 3: Restore
    const fileContent = await readFile(restoreTmpFile, 'utf-8');

    if (fileContent.startsWith('--') || fileContent.includes('INSERT INTO')) {
      // Plain SQL file (produced by our INSERT-based fallback exporter).
      // Execute entirely in-process via postgres.js — no psql required.
      // pgSql is the raw postgres client from @repo/db, which supports
      // multi-statement execution and transactions natively.
      try {
        await pgClient.begin(async (tx) => {
          // Clear all data tables in dependency order
          await tx`TRUNCATE post_tags, post_likes, comments, post_revisions CASCADE`;
          await tx`TRUNCATE posts CASCADE`;
          await tx`TRUNCATE categories, tags, media_items, authors, redirects, settings CASCADE`;

          // Split the dump into individual INSERT statements and execute each
          const statements = fileContent
            .split('\n')
            .filter((line) => line.trim().startsWith('INSERT INTO'))
            .map((line) => line.trim().replace(/;$/, ''));

          for (const stmt of statements) {
            await tx.unsafe(stmt);
          }
        });
      } catch (restoreError) {
        // Transaction rolled back by postgres.js — nothing changed
        return NextResponse.json(
          { error: 'Restore failed (rolled back, no data changed)', details: String(restoreError) },
          { status: 500 }
        );
      }
    } else {
      // Binary/custom pg_dump format — requires pg_restore CLI.
      // This path is only hit when restoring a backup created by supabase db dump
      // (from the GH Actions workflow). In that case psql/pg_restore should be available.
      try {
        await execAsync(
          `pg_restore --single-transaction --clean --if-exists --no-owner --no-acls -d "${dbUrl}" "${restoreTmpFile}"`,
          { timeout: 90000 }
        );
      } catch (restoreError) {
        return NextResponse.json(
          { error: 'Restore failed (rolled back, no data changed)', details: String(restoreError) },
          { status: 500 }
        );
      }
    }

    // Cleanup
    try { await unlink(restoreTmpFile); } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      message: `Restored from backup ${backup.filename}. A safety backup was created before restore.`,
      safety_backup_id: safetyPublicId,
    });
  } catch (error) {
    console.error('Restore failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Restore failed' },
      { status: 500 }
    );
  }
}
