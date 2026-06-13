import { NextRequest, NextResponse } from 'next/server';
import { db } from '@repo/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Verify the request comes from Vercel Cron.
 * Vercel sends the CRON_SECRET as an Authorization bearer token.
 */
function verifyCron(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/cron — Runs scheduled maintenance tasks.
 *
 * 1. Publish scheduled posts (status='scheduled' with published_at <= now)
 * 2. Purge trash (posts/categories deleted 30+ days ago)
 *
 * Triggered by Vercel Cron Jobs daily.
 */
export async function GET(req: NextRequest) {
  if (!verifyCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { published: number; purgedPosts: number; purgedCategories: number } = {
    published: 0,
    purgedPosts: 0,
    purgedCategories: 0,
  };

  // 1. Publish scheduled posts
  const published = await db.execute(sql`
    UPDATE posts
    SET status = 'published', updated_at = NOW()
    WHERE status = 'scheduled'
      AND published_at <= NOW()
      AND deleted_at IS NULL
    RETURNING id
  `);
  results.published = published.length;

  // 2. Purge posts trashed 30+ days ago
  const trashedPosts = await db.execute(sql`
    SELECT id FROM posts
    WHERE deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days'
  `);

  if (trashedPosts.length > 0) {
    const postIds = trashedPosts.map((p: any) => p.id);

    await db.execute(sql`DELETE FROM post_revisions WHERE post_id = ANY(${postIds})`);
    await db.execute(sql`DELETE FROM post_tags WHERE post_id = ANY(${postIds})`);
    await db.execute(sql`DELETE FROM post_likes WHERE post_id = ANY(${postIds})`);
    await db.execute(sql`DELETE FROM comments WHERE post_id = ANY(${postIds})`);
    await db.execute(sql`DELETE FROM posts WHERE id = ANY(${postIds})`);

    results.purgedPosts = trashedPosts.length;
  }

  // 3. Purge categories trashed 30+ days ago
  const trashedCategories = await db.execute(sql`
    SELECT id FROM categories
    WHERE deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days'
  `);

  if (trashedCategories.length > 0) {
    const catIds = trashedCategories.map((c: any) => c.id);
    await db.execute(sql`DELETE FROM categories WHERE id = ANY(${catIds})`);
    results.purgedCategories = trashedCategories.length;
  }

  console.log(`Cron complete: published=${results.published}, purgedPosts=${results.purgedPosts}, purgedCategories=${results.purgedCategories}`);

  return NextResponse.json({ ok: true, ...results });
}
