import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [posts, revisions, categories, tags, postTags, media, redirects] = await Promise.all([
      db.execute(sql`SELECT count(*) as c FROM posts`),
      db.execute(sql`SELECT count(*) as c FROM post_revisions`),
      db.execute(sql`SELECT count(*) as c FROM categories`),
      db.execute(sql`SELECT count(*) as c FROM tags`),
      db.execute(sql`SELECT count(*) as c FROM post_tags`),
      db.execute(sql`SELECT count(*) as c FROM media_items`),
      db.execute(sql`SELECT count(*) as c FROM redirects`),
    ]);

    // Get any surviving revision data
    const revData = await db.execute(sql`SELECT id, post_id, title, created_at FROM post_revisions ORDER BY created_at DESC LIMIT 20`);

    // Check redirects for evidence of old post slugs
    const redirData = await db.execute(sql`SELECT source, destination, created_at FROM redirects ORDER BY created_at DESC LIMIT 20`);

    return NextResponse.json({
      counts: {
        posts: posts[0]?.c,
        post_revisions: revisions[0]?.c,
        categories: categories[0]?.c,
        tags: tags[0]?.c,
        post_tags: postTags[0]?.c,
        media_items: media[0]?.c,
        redirects: redirects[0]?.c,
      },
      revisions: revData,
      redirects: redirData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 });
  }
}
