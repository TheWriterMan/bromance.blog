import { NextRequest, NextResponse } from 'next/server';
import { db, generateId, sql as pgClient } from '@repo/db';
import * as schema from '@repo/db';
import { eq, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import cloudinary, { CLOUDINARY_FOLDER } from '@/lib/cloudinary';
import { gzipSync, gunzipSync } from 'zlib';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // Restore can take longer

/**
 * Serialize a JS value (as returned by the postgres client) into a SQL literal.
 * Critically, jsonb/json columns come back as objects/arrays — String(obj)
 * would produce "[object Object]", which is invalid JSON and breaks restore.
 * Objects and arrays are JSON-stringified; Dates use ISO format.
 */
function serializeSqlValue(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

/**
 * Split a plain-SQL dump into individual INSERT statements.
 *
 * A naive split on newlines or ";" is incorrect because string/JSON values can
 * contain literal newlines and semicolons. This scanner walks the text
 * character by character, tracking single-quoted string state (with '' as an
 * escaped quote) and skipping SQL line comments (-- to end of line) when
 * outside a string. Statements are split on top-level ";" and only those
 * starting with INSERT INTO are returned, with the trailing semicolon stripped.
 */
function parseSqlInserts(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let i = 0;

  while (i < sql.length) {
    const ch = sql[i];

    if (inString) {
      current += ch;
      if (ch === "'") {
        if (sql[i + 1] === "'") {
          // Escaped quote — keep both characters, stay in string.
          current += "'";
          i += 2;
          continue;
        }
        inString = false;
      }
      i++;
      continue;
    }

    // Outside a string literal.
    if (ch === "'") {
      inString = true;
      current += ch;
      i++;
      continue;
    }

    if (ch === '-' && sql[i + 1] === '-') {
      // Line comment — skip to end of line.
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }

    if (ch === ';') {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = '';
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);

  return statements.filter((s) => s.toUpperCase().startsWith('INSERT INTO'));
}

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

    // Step 1: Create a pre-restore safety backup (in-memory SQL export + zlib gzip).
    const safetyTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safetyFilename = `pre-restore-${safetyTimestamp}.sql.gz`;

    const tables = ['categories', 'tags', 'posts', 'post_tags', 'media_items', 'authors',
      'post_revisions', 'redirects', 'post_likes', 'comments', 'settings', 'backups'];
    let dumpContent = `-- Pre-restore safety backup\n-- Created: ${new Date().toISOString()}\n\n`;
    for (const table of tables) {
      const rows = await db.execute(sql.raw(`SELECT * FROM ${table}`));
      if (rows.length === 0) continue;
      dumpContent += `-- Table: ${table}\n`;
      for (const r of rows) {
        const cols = Object.keys(r as object);
        const vals = cols.map((c) => serializeSqlValue((r as Record<string, unknown>)[c]));
        dumpContent += `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
      }
      dumpContent += '\n';
    }
    const safetyBuffer = gzipSync(Buffer.from(dumpContent, 'utf-8'));

    // Upload safety backup to Cloudinary
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

    // Decompress in-process with zlib — no gunzip binary on Vercel.
    const fileContent = gunzipSync(backupBuffer).toString('utf-8');

    // Step 3: Restore
    if (fileContent.startsWith('--') || fileContent.includes('INSERT INTO')) {
      // Plain SQL file (produced by our INSERT-based exporter).
      // Execute entirely in-process via postgres.js — no psql required.
      // pgClient is the raw postgres client from @repo/db, which supports
      // multi-statement execution and transactions natively.
      try {
        await pgClient.begin(async (tx) => {
          // Clear all data tables, children before parents to satisfy FKs.
          await tx`TRUNCATE post_tags, post_likes, comments, post_revisions CASCADE`;
          await tx`TRUNCATE posts CASCADE`;
          await tx`TRUNCATE categories, tags, media_items, authors, redirects, settings CASCADE`;
          // Truncate backups separately — we'll re-insert the safety backup after restoring.
          await tx`TRUNCATE backups CASCADE`;

          // Parse the dump into individual INSERT statements. We can't split on
          // newlines or on ";" naively because string/JSON values may contain
          // either character. This scanner respects single-quoted string
          // literals ('' escaping) and SQL line comments, so values are
          // reconstructed correctly. Statements run in dump order, which lists
          // parent tables before dependents to satisfy foreign keys.
          const statements = parseSqlInserts(fileContent);

          for (const stmt of statements) {
            await tx.unsafe(stmt);
          }

          // Re-insert the safety backup record so it's visible on the backups
          // page after restore. The file already exists on Cloudinary — this
          // ensures the DB knows about it regardless of what the restored dump
          // contained.
          await tx`
            INSERT INTO backups (id, cloudinary_id, filename, bytes, post_count, category_count, tag_count, media_count, created_at)
            VALUES (${generateId()}, ${safetyPublicId}, ${safetyFilename}, ${safetyBuffer.length}, ${countRow.post_count}, ${countRow.category_count}, ${countRow.tag_count}, ${countRow.media_count}, NOW())
            ON CONFLICT DO NOTHING
          `;
        });
      } catch (restoreError) {
        // Transaction rolled back by postgres.js — nothing changed
        return NextResponse.json(
          { error: 'Restore failed (rolled back, no data changed)', details: String(restoreError) },
          { status: 500 }
        );
      }
    } else {
      // Non-INSERT format (e.g. a custom/binary pg_dump or COPY-based dump).
      // pg_restore/psql are not available on the Vercel serverless runtime,
      // so these backups can only be restored from an environment that has the
      // Postgres client tools (e.g. locally or via GitHub Actions).
      return NextResponse.json(
        {
          error:
            'This backup is not in the in-process INSERT format and cannot be restored on the serverless runtime. ' +
            'Restore it using the Postgres client tools (psql/pg_restore) instead.',
        },
        { status: 422 }
      );
    }

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
