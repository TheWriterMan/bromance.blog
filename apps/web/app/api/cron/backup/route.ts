import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@repo/db';
import * as schema from '@repo/db';
import { desc, sql } from 'drizzle-orm';
import cloudinary, { CLOUDINARY_FOLDER } from '@/lib/cloudinary';
import { gzipSync } from 'zlib';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function verifyCron(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

function serializeSqlValue(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

/**
 * GET /api/cron/backup — Scheduled backup (Vercel Cron).
 *
 * Skips if no changes since the last backup. Otherwise creates a full
 * data export, uploads to Cloudinary, and records metadata.
 */
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get current counts
    const counts = await db.execute(sql`
      SELECT
        (SELECT count(*)::int FROM posts WHERE deleted_at IS NULL) as post_count,
        (SELECT count(*)::int FROM categories WHERE deleted_at IS NULL) as category_count,
        (SELECT count(*)::int FROM tags) as tag_count,
        (SELECT count(*)::int FROM media_items) as media_count
    `);
    const row = counts[0] as { post_count: number; category_count: number; tag_count: number; media_count: number };

    // Check if anything changed since last backup
    const [lastBackup] = await db
      .select()
      .from(schema.backups)
      .orderBy(desc(schema.backups.createdAt))
      .limit(1);

    if (lastBackup) {
      // Compare counts
      const countsMatch =
        lastBackup.postCount === row.post_count &&
        lastBackup.categoryCount === row.category_count &&
        lastBackup.tagCount === row.tag_count &&
        lastBackup.mediaCount === row.media_count;

      if (countsMatch) {
        // Check if any content was modified after the last backup
        const activity = await db.execute(sql`
          SELECT CASE WHEN
            COALESCE((SELECT MAX(updated_at) FROM posts), '1970-01-01'::timestamptz) > ${lastBackup.createdAt}::timestamptz OR
            COALESCE((SELECT MAX(created_at) FROM comments), '1970-01-01'::timestamptz) > ${lastBackup.createdAt}::timestamptz OR
            COALESCE((SELECT MAX(created_at) FROM post_likes), '1970-01-01'::timestamptz) > ${lastBackup.createdAt}::timestamptz
          THEN true ELSE false END as has_changes
        `);

        const hasChanges = (activity[0] as { has_changes: boolean }).has_changes;
        if (!hasChanges) {
          return NextResponse.json({ ok: true, skipped: true, reason: 'No changes since last backup' });
        }
      }
    }

    // Create the backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql.gz`;

    const tables = ['categories', 'tags', 'posts', 'post_tags', 'media_items', 'authors',
      'post_revisions', 'redirects', 'post_likes', 'comments', 'settings', 'backups'];

    let dumpContent = `-- Bromance Blog Backup\n-- Created: ${new Date().toISOString()}\n-- Tables: ${tables.join(', ')}\n\n`;

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

    const fileBuffer = gzipSync(Buffer.from(dumpContent, 'utf-8'));
    const bytes = fileBuffer.length;

    // Upload to Cloudinary
    const publicId = `${CLOUDINARY_FOLDER}/backups/backup-${timestamp}`;
    const uploadResult = await new Promise<{ public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'raw', public_id: publicId, overwrite: true },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { public_id: string });
        }
      );
      uploadStream.end(fileBuffer);
    });

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

    // Cleanup old backups (30+ days)
    const oldBackups = await db.execute(sql`
      SELECT id, cloudinary_id FROM backups
      WHERE created_at < NOW() - INTERVAL '30 days'
    `);

    for (const old of oldBackups as unknown as { id: string; cloudinary_id: string }[]) {
      try {
        await cloudinary.uploader.destroy(old.cloudinary_id, { resource_type: 'raw' });
        await db.execute(sql`DELETE FROM backups WHERE id = ${old.id}`);
      } catch (e) {
        console.error(`Failed to clean up old backup ${old.id}:`, e);
      }
    }

    return NextResponse.json({ ok: true, skipped: false, backupId, filename, bytes });
  } catch (error) {
    console.error('Cron backup failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Backup failed' },
      { status: 500 }
    );
  }
}
