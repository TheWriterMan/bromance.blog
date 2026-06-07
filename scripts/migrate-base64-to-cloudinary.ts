/**
 * Migration script: scan media_items and posts.content for base64 data URIs,
 * upload each to Cloudinary, and replace with real public_id / URL.
 *
 * Run with: npx tsx scripts/migrate-base64-to-cloudinary.ts
 *
 * Requires env vars: DATABASE_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
 * CLOUDINARY_API_SECRET, CLOUDINARY_FOLDER
 */

import { v2 as cloudinary } from 'cloudinary';
import postgres from 'postgres';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FOLDER = process.env.CLOUDINARY_FOLDER || 'bromance';
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

async function uploadBase64(dataUri: string): Promise<{ public_id: string; secure_url: string; width: number; height: number; format: string; bytes: number } | null> {
  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: FOLDER,
      resource_type: 'image',
    });
    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (err) {
    console.error('Upload failed:', err);
    return null;
  }
}

async function migrateMediaItems() {
  console.log('\n--- Migrating media_items with base64 cloudinary_id ---');

  const rows = await sql`
    SELECT id, cloudinary_id, filename FROM media_items
    WHERE cloudinary_id LIKE 'data:image/%'
  `;

  console.log(`Found ${rows.length} media_items with base64 data`);

  for (const row of rows) {
    console.log(`  Uploading ${row.id} (${row.filename})…`);
    const result = await uploadBase64(row.cloudinary_id);
    if (result) {
      await sql`
        UPDATE media_items
        SET cloudinary_id = ${result.public_id},
            width = ${result.width},
            height = ${result.height},
            format = ${result.format},
            bytes = ${result.bytes}
        WHERE id = ${row.id}
      `;
      console.log(`    ✓ Migrated → ${result.public_id}`);
    } else {
      console.log(`    ✗ Failed, skipping`);
    }
  }
}

async function migratePostContent() {
  console.log('\n--- Migrating inline base64 images in posts.content ---');

  const rows = await sql`
    SELECT id, title, content FROM posts
    WHERE content LIKE '%data:image/%'
  `;

  console.log(`Found ${rows.length} posts with inline base64 images`);

  const base64Regex = /src="(data:image\/[^"]+)"/g;

  for (const row of rows) {
    console.log(`  Processing post "${row.title}" (${row.id})…`);
    let updatedContent = row.content as string;
    let match;
    let count = 0;

    // Reset regex
    base64Regex.lastIndex = 0;
    const matches: string[] = [];
    while ((match = base64Regex.exec(row.content as string)) !== null) {
      matches.push(match[1]);
    }

    for (const dataUri of matches) {
      const result = await uploadBase64(dataUri);
      if (result) {
        updatedContent = updatedContent.replace(dataUri, result.secure_url);
        count++;
      }
    }

    if (count > 0) {
      await sql`
        UPDATE posts SET content = ${updatedContent} WHERE id = ${row.id}
      `;
      console.log(`    ✓ Replaced ${count} inline images`);
    }
  }
}

async function migrateFeaturedImages() {
  console.log('\n--- Migrating posts.featured_image with base64 ---');

  const rows = await sql`
    SELECT id, title, featured_image FROM posts
    WHERE featured_image LIKE 'data:image/%'
  `;

  console.log(`Found ${rows.length} posts with base64 featured images`);

  for (const row of rows) {
    console.log(`  Uploading featured image for "${row.title}"…`);
    const result = await uploadBase64(row.featured_image as string);
    if (result) {
      await sql`
        UPDATE posts SET featured_image = ${result.public_id} WHERE id = ${row.id}
      `;
      console.log(`    ✓ Migrated → ${result.public_id}`);
    } else {
      console.log(`    ✗ Failed, skipping`);
    }
  }
}

async function main() {
  console.log('=== Base64 to Cloudinary Migration ===');
  console.log(`Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`Folder: ${FOLDER}`);

  await migrateMediaItems();
  await migratePostContent();
  await migrateFeaturedImages();

  console.log('\n=== Migration complete ===');
  await sql.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
