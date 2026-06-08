import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Configure cloudinary from env
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const [posts, revisions, categories, tags, postTags, media, redirects] = await Promise.all([
      db.execute(sql`SELECT count(*) as c FROM posts`),
      db.execute(sql`SELECT count(*) as c FROM post_revisions`),
      db.execute(sql`SELECT count(*) as c FROM categories`),
      db.execute(sql`SELECT count(*) as c FROM tags`),
      db.execute(sql`SELECT count(*) as c FROM post_tags`),
      db.execute(sql`SELECT count(*) as c FROM media_items`),
      db.execute(sql`SELECT count(*) as c FROM redirects`),
    ]);

    const redirData = await db.execute(sql`SELECT source, destination, created_at FROM redirects ORDER BY created_at DESC LIMIT 20`);

    // Search Cloudinary for backup files in multiple possible locations
    let backupFiles: any[] = [];
    try {
      // Search in bromance/backups/ folder
      const r1 = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'raw',
        prefix: 'bromance/backups/',
        max_results: 20,
      });
      backupFiles.push(...(r1.resources || []).map((r: any) => ({
        public_id: r.public_id, created_at: r.created_at, bytes: r.bytes, url: r.secure_url
      })));
    } catch (e: any) {
      backupFiles.push({ search_error_1: e.message });
    }

    try {
      // Search in bromance-blog/backups/ folder
      const r2 = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'raw',
        prefix: 'bromance-blog/backups/',
        max_results: 20,
      });
      backupFiles.push(...(r2.resources || []).map((r: any) => ({
        public_id: r.public_id, created_at: r.created_at, bytes: r.bytes, url: r.secure_url
      })));
    } catch (e: any) {
      backupFiles.push({ search_error_2: e.message });
    }

    try {
      // Search ALL raw files
      const r3 = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'raw',
        max_results: 50,
      });
      backupFiles.push(...(r3.resources || []).map((r: any) => ({
        public_id: r.public_id, created_at: r.created_at, bytes: r.bytes, url: r.secure_url
      })));
    } catch (e: any) {
      backupFiles.push({ search_error_3: e.message });
    }

    // Deduplicate
    const seen = new Set();
    backupFiles = backupFiles.filter(f => {
      if (f.search_error_1 || f.search_error_2 || f.search_error_3) return true;
      if (seen.has(f.public_id)) return false;
      seen.add(f.public_id);
      return true;
    });

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
      cloudinary_config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        has_key: !!process.env.CLOUDINARY_API_KEY,
        has_secret: !!process.env.CLOUDINARY_API_SECRET,
        folder: process.env.CLOUDINARY_FOLDER,
      },
      backup_files: backupFiles,
      redirects: redirData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 });
  }
}

// POST: Fix the cascade FK constraint
export async function POST() {
  try {
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
