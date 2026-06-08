/**
 * Migration script: Download external images (Medium CDN, etc.) from posts,
 * upload to Cloudinary, update post content/featured_image, register in media_items.
 *
 * Run with: npx tsx scripts/migrate-medium-to-cloudinary.ts
 * Dry run:  DRY_RUN=1 npx tsx scripts/migrate-medium-to-cloudinary.ts
 *
 * All credentials are hardcoded — no .env needed.
 */

import { v2 as cloudinary } from 'cloudinary';
import postgres from 'postgres';
import crypto from 'crypto';

// --- HARDCODED CREDENTIALS ---
const CLOUD_NAME = 'dtperak4e';
const API_KEY = '436427533766122';
const API_SECRET = 'CCf-JYwGF-SGn4P6jnvfXoOC-CE';
const FOLDER = 'bromance';
const DATABASE_URL = 'postgres://postgres.whlhkshlhantpsbqohaz:FalnVKSVAkCUtw2s@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
});

const DRY_RUN = process.env.DRY_RUN === '1';

// Need the actual DB password — script will check connection on start
const dbUrl = process.env.DATABASE_URL || DATABASE_URL;
const sql = postgres(dbUrl, { prepare: false, max: 1, ssl: 'require' });

// In-memory dedup map: source URL → result
const migrated = new Map<string, { public_id: string; secure_url: string; width: number; height: number; format: string; bytes: number }>();

function isExternalImageUrl(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  if (url.includes('res.cloudinary.com')) return false;
  if (url.includes('picsum.photos')) return false;
  return true;
}

function deterministicId(sourceUrl: string): string {
  const hash = crypto.createHash('sha256').update(sourceUrl).digest('hex').slice(0, 12);
  return `medium-${hash}`;
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
    if (!contentType.startsWith('image/') && !contentType.includes('octet-stream')) {
      console.warn(`    ⚠ Not an image (${contentType}): ${url}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 100) {
      console.warn(`    ⚠ Image too small (${buffer.length} bytes): ${url}`);
      return null;
    }
    return buffer;
  } catch (err: any) {
    console.warn(`    ⚠ Download error: ${err.message}`);
    return null;
  }
}

async function uploadToCloudinary(buffer: Buffer, sourceUrl: string): Promise<{ public_id: string; secure_url: string; width: number; height: number; format: string; bytes: number } | null> {
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
      console.log(`    ↩ Already exists: ${existing.public_id}`);
      return result;
    }
  } catch {
    // Not found — proceed with upload
  }

  try {
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
  if (migrated.has(url)) return migrated.get(url)!;

  console.log(`    → Downloading: ${url.slice(0, 80)}…`);
  const buffer = await downloadImage(url);
  if (!buffer) return null;

  console.log(`    → Uploading (${(buffer.length / 1024).toFixed(0)} KB)…`);
  return await uploadToCloudinary(buffer, url);
}

async function registerInMediaItems(result: { public_id: string; secure_url: string; width: number; height: number; format: string; bytes: number }, sourceUrl: string) {
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

async function main() {
  console.log('=== Medium → Cloudinary Migration ===');
  console.log(`Cloud: ${CLOUD_NAME}`);
  console.log(`Folder: ${FOLDER}`);
  console.log(`Dry run: ${DRY_RUN ? 'YES' : 'NO'}`);
  console.log('');

  // Test DB connection
  try {
    const [{ now }] = await sql`SELECT now()`;
    console.log(`DB connected: ${now}`);
  } catch (err: any) {
    console.error(`DB connection failed: ${err.message}`);
    console.error('Set DATABASE_URL env var with the full Supabase connection string (including password).');
    process.exit(1);
  }

  if (!DRY_RUN) {
    console.log('\n⚠️  Will modify data. Ctrl+C within 3s to abort.');
    await new Promise(r => setTimeout(r, 3000));
  }

  const posts = await sql`SELECT id, title, content, featured_image, og_image FROM posts`;
  console.log(`\nFound ${posts.length} posts to scan\n`);

  const imgSrcRegex = /src="(https?:\/\/[^"]+)"/g;
  let totalMigrated = 0;
  let totalFailed = 0;

  for (const post of posts) {
    const title = (post.title as string).slice(0, 50);
    console.log(`\n📄 "${title}" (${post.id})`);

    let contentUpdated = false;
    let content = post.content as string;

    // --- Inline images in content ---
    const matches: string[] = [];
    let match;
    imgSrcRegex.lastIndex = 0;
    while ((match = imgSrcRegex.exec(content)) !== null) {
      if (isExternalImageUrl(match[1])) {
        matches.push(match[1]);
      }
    }

    if (matches.length > 0) {
      console.log(`  ${matches.length} external image(s) in content`);
    }

    for (const imgUrl of matches) {
      const result = await processUrl(imgUrl);
      if (result) {
        // In HTML content, use the full secure_url (rendered via dangerouslySetInnerHTML)
        content = content.split(imgUrl).join(result.secure_url);
        contentUpdated = true;
        if (!DRY_RUN) await registerInMediaItems(result, imgUrl);
        totalMigrated++;
        console.log(`    ✓ → ${result.public_id}`);
      } else {
        totalFailed++;
      }
    }

    // --- Featured image ---
    let featuredImage = post.featured_image as string;
    if (isExternalImageUrl(featuredImage)) {
      console.log(`  Featured image is external`);
      const result = await processUrl(featuredImage);
      if (result) {
        // featured_image stores public_id (getCloudinaryUrl builds full URL from it)
        featuredImage = result.public_id;
        if (!DRY_RUN) await registerInMediaItems(result, post.featured_image as string);
        totalMigrated++;
        console.log(`    ✓ Featured → ${result.public_id}`);
      } else {
        totalFailed++;
      }
    }

    // --- OG image ---
    let ogImage = (post.og_image as string) || '';
    if (isExternalImageUrl(ogImage)) {
      console.log(`  OG image is external`);
      const result = await processUrl(ogImage);
      if (result) {
        ogImage = result.secure_url;
        totalMigrated++;
        console.log(`    ✓ OG → ${result.public_id}`);
      } else {
        totalFailed++;
      }
    }

    // --- Update DB ---
    if (!DRY_RUN && (contentUpdated || featuredImage !== post.featured_image || ogImage !== (post.og_image || ''))) {
      await sql`
        UPDATE posts
        SET content = ${content},
            featured_image = ${featuredImage},
            og_image = ${ogImage || null}
        WHERE id = ${post.id}
      `;
      console.log(`  💾 Updated`);
    } else if (DRY_RUN && (contentUpdated || featuredImage !== post.featured_image)) {
      console.log(`  [DRY RUN] Would update`);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n=== Done ===`);
  console.log(`Migrated: ${totalMigrated}`);
  console.log(`Failed: ${totalFailed}`);
  await sql.end();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
