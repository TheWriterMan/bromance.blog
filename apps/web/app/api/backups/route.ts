import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@repo/db';
import * as schema from '@repo/db';
import { desc, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import cloudinary, { CLOUDINARY_FOLDER } from '@/lib/cloudinary';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for backup operations

const execAsync = promisify(exec);

/**
 * GET /api/backups — List all backups, newest first.
 */
export async function GET(req: NextRequest) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const list = await db
      .select()
      .from(schema.backups)
      .orderBy(desc(schema.backups.createdAt));

    const mapped = list.map((b) => ({
      id: b.id,
      cloudinary_id: b.cloudinaryId,
      filename: b.filename,
      bytes: b.bytes,
      post_count: b.postCount,
      category_count: b.categoryCount,
      tag_count: b.tagCount,
      media_count: b.mediaCount,
      created_at: b.createdAt.toISOString(),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Failed to fetch backups:', error);
    return NextResponse.json({ error: 'Failed to fetch backups' }, { status: 500 });
  }
}

/**
 * POST /api/backups — Create a manual backup (same logic as the GH Actions workflow).
 * This uses pg_dump via shell since supabase CLI may not be available on Vercel.
 * Falls back to a SQL-based data export if pg_dump is unavailable.
 */
export async function POST(req: NextRequest) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json(
        { error: 'Database connection string not configured for backups' },
        { status: 500 }
      );
    }

    // Get table counts
    const counts = await db.execute(sql`
      SELECT
        (SELECT count(*)::int FROM posts WHERE deleted_at IS NULL) as post_count,
        (SELECT count(*)::int FROM categories WHERE deleted_at IS NULL) as category_count,
        (SELECT count(*)::int FROM tags) as tag_count,
        (SELECT count(*)::int FROM media_items) as media_count
    `);

    const row = counts[0] as { post_count: number; category_count: number; tag_count: number; media_count: number };

    // Create SQL data dump by exporting each table as INSERT statements
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql.gz`;

    // Use pg_dump if available, otherwise fall back to SQL export
    const tmpFile = join(tmpdir(), `bromance-backup-${Date.now()}.sql`);
    const tmpGz = `${tmpFile}.gz`;

    let dumpSuccess = false;

    try {
      await execAsync(`pg_dump "${dbUrl}" --data-only --no-owner --no-acls -f "${tmpFile}"`, {
        timeout: 45000,
      });
      await execAsync(`gzip "${tmpFile}"`);
      dumpSuccess = true;
    } catch {
      // pg_dump not available (expected on Vercel) — fall back to SQL export
      const tables = ['categories', 'tags', 'posts', 'post_tags', 'media_items', 'authors',
        'post_revisions', 'redirects', 'post_likes', 'comments', 'settings', 'backups'];

      let dumpContent = `-- Bromance Blog Backup\n-- Created: ${new Date().toISOString()}\n-- Tables: ${tables.join(', ')}\n\n`;

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

      await writeFile(tmpFile, dumpContent, 'utf-8');
      await execAsync(`gzip "${tmpFile}"`);
      dumpSuccess = true;
    }

    if (!dumpSuccess) {
      return NextResponse.json({ error: 'Failed to create database dump' }, { status: 500 });
    }

    // Read the gzipped file
    const fileBuffer = await readFile(tmpGz);
    const bytes = fileBuffer.length;

    // Upload to Cloudinary as raw file
    const publicId = `${CLOUDINARY_FOLDER}/backups/backup-${timestamp}`;
    const uploadResult = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: publicId,
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { public_id: string; secure_url: string });
        }
      );
      uploadStream.end(fileBuffer);
    });

    // Clean up temp file
    try { await unlink(tmpGz); } catch { /* ignore */ }

    // Record in database
    const backupId = generateId();
    await db.insert(schema.backups).values({
      id: backupId,
      cloudinaryId: uploadResult.public_id,
      filename,
      bytes,
      postCount: row.post_count,
      categoryCount: row.category_count,
      tagCount: row.tag_count,
      mediaCount: row.media_count,
    });

    return NextResponse.json({
      id: backupId,
      cloudinary_id: uploadResult.public_id,
      filename,
      bytes,
      post_count: row.post_count,
      category_count: row.category_count,
      tag_count: row.tag_count,
      media_count: row.media_count,
      created_at: new Date().toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Backup creation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Backup creation failed' },
      { status: 500 }
    );
  }
}
