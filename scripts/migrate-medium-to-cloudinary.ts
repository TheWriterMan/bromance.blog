/**
 * Migration script: Download external images (Medium CDN, etc.) from posts,
 * upload to Cloudinary, update post content/featured_image, register in media_items.
 *
 * Run with: npx tsx scripts/migrate-medium-to-cloudinary.ts
 *
 * Requires env vars: DATABASE_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
 * CLOUDINARY_API_SECRET, CLOUDINARY_FOLDER
 *
 * Features:
 * - Deduplication: tracks source_url → cloudinary public_id so re-runs don't create duplicates
 * - Resume-safe: processes one post at a time, commits each update individually
 * - Dry-run mode: set DRY_RUN=1 to preview without modifying anything
 * - Handles: featured_image, og_image, inline <img src="..."> in content
 */

import { v2 as cloudinary } from 'cloudinary';
import postgres from 'postgres';
import crypto from 'crypto';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const FOLDER = process.env.CLOUDINARY_FOLDER || 'bromance';
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
const DRY_RUN = process.env.DRY_RUN === '1';
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

if (!CLOUD_NAME) {
  console.error('CLOUDINARY_CLOUD_NAME is not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false, max: 1 });

// In-memory dedup map: source URL → { public_id, secure_url }
const migrated = new Map<string, { public_id: string; secure_url: string; width: number; height: number; format: string; bytes: number }>();

// Domains we consider "external" (not Cloudinary)
function isExternalImageUrl(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  if (url.includes('res.cloudinary.com')) return false;
  if (url.includes('picsum.photos')) return false;
  return true;
}

// Generate a deterministic public_id from source URL (for dedup across runs)
function deterministicId(sourceUrl: string): string {
  const hash = crypto.createHash('sha256').update(sourceUrl).digest('hex').slice(0, 12);
  return `migrated-${hash}`;
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; blog-migrator/1.0)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.warn(`    ⚠ Download failed (${response.status}): ${url}`);
      return null;
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      console.warn(`    ⚠ Not an image (${contentType}): ${url}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 100) {
      console.warn(`    ⚠ Image too small (${buffer.length} bytes), likely broken: ${url}`);
      return null;
    }
    return buffer;
  } catch (err: any) {
    console.warn(`    ⚠ Download error: ${err.message} — ${url}`);
    return null;
  }
}

async function uploadToCloudinary(buffer: Buffer, sourceUrl: string): Promise<{ public_id: string; secure_url: string; width: number; height: number; format: string; bytes: number } | null> {
  // Check dedup map first
  if (migrated.has(sourceUrl)) {
    return migrated.get(sourceUrl)!;
  }

  const publicId = deterministicId(sourceUrl);

  // Check if already exists in Cloudinary (resume-safe)
  try {
    const existing = await cloudinary.api.resource(`${FOLDER}/${publicId}`);
    if (existing) {
      const result = {
        public_id: existing.public_id,
        secure_url: existing.secure_url,
        width: existing.width,
        height: existing.height,
        format: existing.format,
        bytes: existing.bytes,
      };
      migrated.set(sourceUrl, result);
      console.log(`    ↩ Already in Cloudinary: ${existing.public_id}`);
      return result;
    }
  } catch {
    // Not found — proceed with upload
  }

  try {
    // Detect mime from buffer magic bytes
    let mimeType = 'image/jpeg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50) mimeType = 'image/png';
    else if (buffer[0] === 0x47 && buffer[1] === 0x49) mimeType = 'image/gif';
    else if (buffer[0] === 0x52 && buffer[1] === 0x49) mimeType = 'image/webp';

    const base64 = buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      folder: FOLDER,
      resource_type: 'image',
      unique_filename: false,
      overwrite: false,
    });

    const mapped = {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
    migrated.set(sourceUrl, mapped);
    return mapped;
  } catch (err: any) {
    console.error(`    ✗ Upload failed: ${err.message}`);
    return null;
  }
}

async function processUrl(url: string): Promise<{ public_id: string; secure_url: string; width: number; height: number; format: string; bytes: number } | null> {
  if (!isExternalImageUrl(url)) return null;

  // Check dedup
  if (migrated.has(url)) {
    return migrated.get(url)!;
  }

  console.log(`    → Downloading: ${url.slice(0, 80)}…`);
  const buffer = await downloadImage(url);
  if (!buffer) return null;

  console.log(`    → Uploading to Cloudinary (${(buffer.length / 1024).toFixed(0)} KB)…`);
  return await uploadToCloudinary(buffer, url);
}

async function registerInMediaItems(result: { public_id: string; secure_url: string; width: number; height: number; format: string; bytes: number }, sourceUrl: string) {
  // Check if already registered
  const existing = await sql`
    SELECT id FROM media_items WHERE cloudinary_id = ${result.public_id} LIMIT 1
  `;
  if (existing.length > 0) return;

  const id = `med-mig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const filename = sourceUrl.split('/').pop()?.split('?')[0] || `image.${result.format}`;

  await sql`
    INSERT INTO media_items (id, cloudinary_id, filename, width, height, format, bytes, created_at)
    VALUES (${id}, ${result.public_id}, ${filename}, ${result.width}, ${result.height}, ${result.format}, ${result.bytes}, ${new Date().toISOString()})
    ON CONFLICT DO NOTHING
  `;
}

async function migratePostContent() {
  console.log('\n=== Migrating post content ===');

  const posts = await sql`
    SELECT id, title, content, featured_image, og_image FROM posts
  `;

  console.log(`Found ${posts.length} posts to scan\n`);

  const imgSrcRegex = /src="(https?:\/\/[^"]+)"/g;
  let totalMigrated = 0;
  let totalFailed = 0;

  for (const post of posts) {
    const title = (post.title as string).slice(0, 50);
    console.log(`\n📄 Post: "${title}" (${post.id})`);

    let contentUpdated = false;
    let content = post.content as string;

    // --- Migrate inline images in content ---
    const matches: string[] = [];
    let match;
    imgSrcRegex.lastIndex = 0;
    while ((match = imgSrcRegex.exec(content)) !== null) {
      if (isExternalImageUrl(match[1])) {
        matches.push(match[1]);
      }
    }

    if (matches.length > 0) {
      console.log(`  Found ${matches.length} external image(s) in content`);
    }

    for (const imgUrl of matches) {
      const result = await processUrl(imgUrl);
      if (result) {
        // In content HTML, replace with full Cloudinary secure_url
        content = content.split(imgUrl).join(result.secure_url);
        contentUpdated = true;
        await registerInMediaItems(result, imgUrl);
        totalMigrated++;
        console.log(`    ✓ Migrated → ${result.public_id}`);
      } else {
        totalFailed++;
      }
    }

    // --- Migrate featured_image ---
    let featuredImage = post.featured_image as string;
    if (isExternalImageUrl(featuredImage)) {
      console.log(`  Featured image is external: ${featuredImage.slice(0, 60)}…`);
      const result = await processUrl(featuredImage);
      if (result) {
        // featured_image stores public_id (getCloudinaryUrl builds the full URL)
        featuredImage = result.public_id;
        await registerInMediaItems(result, post.featured_image as string);
        totalMigrated++;
        console.log(`    ✓ Featured → ${result.public_id}`);
      } else {
        totalFailed++;
      }
    }

    // --- Migrate og_image ---
    let ogImage = (post.og_image as string) || '';
    if (isExternalImageUrl(ogImage)) {
      console.log(`  OG image is external: ${ogImage.slice(0, 60)}…`);
      const result = await processUrl(ogImage);
      if (result) {
        // og_image can store the full URL since it's used directly in meta tags
        ogImage = result.secure_url;
        totalMigrated++;
        console.log(`    ✓ OG → ${result.public_id}`);
      } else {
        totalFailed++;
      }
    }

    // --- Update post if anything changed ---
    if (!DRY_RUN && (contentUpdated || featuredImage !== post.featured_image || ogImage !== (post.og_image || ''))) {
      await sql`
        UPDATE posts
        SET content = ${content},
            featured_image = ${featuredImage},
            og_image = ${ogImage || null}
        WHERE id = ${post.id}
      `;
      console.log(`  💾 Post updated in database`);
    } else if (DRY_RUN && (contentUpdated || featuredImage !== post.featured_image)) {
      console.log(`  [DRY RUN] Would update this post`);
    }

    // Small delay to be nice to APIs
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n=== Migration complete ===`);
  console.log(`  Migrated: ${totalMigrated}`);
  console.log(`  Failed: ${totalFailed}`);
  console.log(`  Dedup cache size: ${migrated.size}`);
}

async function main() {
  console.log('=== Medium → Cloudinary Migration ===');
  console.log(`Cloud: ${CLOUD_NAME}`);
  console.log(`Folder: ${FOLDER}`);
  console.log(`Dry run: ${DRY_RUN ? 'YES (no writes)' : 'NO (will modify data)'}`);
  console.log('');

  if (!DRY_RUN) {
    console.log('⚠️  This will modify post data. Press Ctrl+C within 3 seconds to abort.');
    await new Promise(r => setTimeout(r, 3000));
  }

  await migratePostContent();
  await sql.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
