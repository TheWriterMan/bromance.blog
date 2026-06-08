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

    const revData = await db.execute(sql`SELECT id, post_id, title, created_at FROM post_revisions ORDER BY created_at DESC LIMIT 20`);
    const redirData = await db.execute(sql`SELECT source, destination, created_at FROM redirects ORDER BY created_at DESC LIMIT 20`);

    // Get Cloudinary info from env
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'unknown';
    const cloudKey = process.env.CLOUDINARY_API_KEY || '';
    const cloudFolder = process.env.CLOUDINARY_FOLDER || '';

    // Search Cloudinary for raw/backup files
    let cloudinaryBackups: any[] = [];
    if (cloudKey && cloudName !== 'unknown') {
      try {
        const cloudSecret = process.env.CLOUDINARY_API_SECRET || '';
        const authStr = Buffer.from(`${cloudKey}:${cloudSecret}`).toString('base64');
        
        // Search for raw files (JSON backups)
        const searchRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/resources/raw?max_results=30`,
          { headers: { 'Authorization': `Basic ${authStr}` } }
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          cloudinaryBackups = (searchData.resources || []).map((r: any) => ({
            public_id: r.public_id,
            format: r.format,
            created_at: r.created_at,
            url: r.secure_url,
            bytes: r.bytes,
          }));
        }
      } catch (e: any) {
        cloudinaryBackups = [{ error: e.message }];
      }
    }

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
      cloudinary: {
        cloud_name: cloudName,
        has_key: !!cloudKey,
        folder: cloudFolder,
        raw_files: cloudinaryBackups,
      },
      revisions: revData,
      redirects: redirData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 });
  }
}

// POST: Fix the cascade constraint and restore from Cloudinary backup if found
export async function POST() {
  try {
    // Fix the FK constraint: change CASCADE to SET NULL
    await db.execute(sql`
      ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_id_categories_id_fk
    `);
    await db.execute(sql`
      ALTER TABLE posts ADD CONSTRAINT posts_category_id_categories_id_fk
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    `);

    return NextResponse.json({ success: true, message: 'FK constraint changed to SET NULL' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 });
  }
}
