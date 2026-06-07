import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import cloudinary from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

/**
 * Scans all post content AND featured_image for Cloudinary URLs that are not
 * yet registered in the media_items table, fetches their metadata from
 * Cloudinary, and inserts them.
 *
 * This does NOT download/re-upload external images — that's the job of the
 * local migration script (scripts/migrate-medium-to-cloudinary.ts).
 * This only registers images that are ALREADY in Cloudinary but missing from media_items.
 *
 * Protected: requires cms_logged_in cookie.
 * Idempotent: safe to run multiple times.
 */
export async function POST(req: NextRequest) {
  // Auth check
  const cookie = req.cookies.get('cms_logged_in')?.value;
  if (cookie !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
    if (!cloudName) {
      return NextResponse.json({ error: 'CLOUDINARY_CLOUD_NAME not configured' }, { status: 500 });
    }

    // Fetch all posts
    const posts = await db
      .select({ id: schema.posts.id, content: schema.posts.content, featuredImage: schema.posts.featuredImage, ogImage: schema.posts.ogImage })
      .from(schema.posts);

    // Regex to extract Cloudinary public IDs from URLs in post content.
    // Handles arbitrary transform chains, version numbers, and nested folders.
    // Pattern: https://res.cloudinary.com/{cloud}/image/upload/[...transforms/][v123/]{public_id}[.ext]
    // Strategy: match the full URL, then parse public_id by stripping known prefixes.
    const urlPattern = new RegExp(
      `https://res\\.cloudinary\\.com/${escapeRegex(cloudName)}/image/upload/([^"'\\s]+)`,
      'g'
    );

    const foundPublicIds = new Set<string>();

    for (const post of posts) {
      // Scan content
      if (post.content) {
        let match;
        urlPattern.lastIndex = 0;
        while ((match = urlPattern.exec(post.content)) !== null) {
          const publicId = extractPublicId(match[1]);
          if (publicId) foundPublicIds.add(publicId);
        }
      }

      // Scan featured_image — could be a bare public_id or a full URL
      if (post.featuredImage) {
        if (post.featuredImage.includes('res.cloudinary.com')) {
          // Full URL — extract public_id
          const m = urlPattern.exec(post.featuredImage);
          urlPattern.lastIndex = 0;
          if (m) {
            const publicId = extractPublicId(m[1]);
            if (publicId) foundPublicIds.add(publicId);
          }
        } else if (!post.featuredImage.startsWith('http') && !post.featuredImage.startsWith('data:')) {
          // Bare public_id
          foundPublicIds.add(post.featuredImage);
        }
      }

      // Scan og_image
      if (post.ogImage && post.ogImage.includes('res.cloudinary.com')) {
        urlPattern.lastIndex = 0;
        const m = urlPattern.exec(post.ogImage);
        if (m) {
          const publicId = extractPublicId(m[1]);
          if (publicId) foundPublicIds.add(publicId);
        }
      }
    }

    if (foundPublicIds.size === 0) {
      return NextResponse.json({ reconciled: 0, message: 'No Cloudinary images found in posts' });
    }

    // Check which are already in media_items
    const existingItems = await db
      .select({ cloudinaryId: schema.mediaItems.cloudinaryId })
      .from(schema.mediaItems);

    const existingIds = new Set(existingItems.map(i => i.cloudinaryId));
    const missingIds = [...foundPublicIds].filter(id => !existingIds.has(id));

    if (missingIds.length === 0) {
      return NextResponse.json({ reconciled: 0, message: 'All Cloudinary images already registered', total_found: foundPublicIds.size });
    }

    let reconciled = 0;
    const errors: string[] = [];

    for (const publicId of missingIds) {
      try {
        const resource = await cloudinary.api.resource(publicId);

        await db.insert(schema.mediaItems).values({
          id: `med-recon-${Date.now()}-${reconciled}`,
          cloudinaryId: publicId,
          filename: resource.original_filename
            ? `${resource.original_filename}.${resource.format}`
            : `${publicId.split('/').pop()}.${resource.format}`,
          width: resource.width,
          height: resource.height,
          format: resource.format,
          bytes: resource.bytes,
          createdAt: resource.created_at || new Date().toISOString(),
        });

        reconciled++;
      } catch (err: any) {
        // If resource not found in Cloudinary, skip it
        if (err?.error?.http_code === 404) {
          errors.push(`${publicId}: not found in Cloudinary`);
        } else {
          errors.push(`${publicId}: ${err.message || 'unknown error'}`);
        }
      }
    }

    return NextResponse.json({
      reconciled,
      total_found: foundPublicIds.size,
      already_registered: existingIds.size,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Reconcile error:', error);
    return NextResponse.json({ error: error.message || 'Reconciliation failed' }, { status: 500 });
  }
}

/**
 * Extract a Cloudinary public_id from the path portion after /upload/.
 * Handles:
 *   - Transform chains: q_auto,f_auto/w_800/v1234/folder/file
 *   - Version numbers: v1234567890/folder/file
 *   - Direct: folder/file
 *   - File extensions: strips .jpg, .png, etc.
 *
 * Strategy: split by '/', remove segments that look like transforms or version numbers,
 * the remainder is the public_id.
 */
function extractPublicId(pathAfterUpload: string): string | null {
  if (!pathAfterUpload) return null;

  const segments = pathAfterUpload.split('/');
  const publicIdParts: string[] = [];
  let foundNonTransform = false;

  for (const segment of segments) {
    if (!foundNonTransform) {
      // Skip transform segments (contain _ with known prefixes, or comma-separated params)
      if (isTransformSegment(segment)) continue;
      // Skip version numbers
      if (/^v\d+$/.test(segment)) continue;
      foundNonTransform = true;
    }
    publicIdParts.push(segment);
  }

  if (publicIdParts.length === 0) return null;

  let publicId = publicIdParts.join('/');
  // Strip file extension
  publicId = publicId.replace(/\.(jpg|jpeg|png|gif|webp|avif|svg|bmp|tiff)$/i, '');

  return publicId || null;
}

/**
 * Detect if a URL path segment is a Cloudinary transformation.
 * Transforms contain parameters like w_800, h_600, q_auto, f_auto, c_fill, etc.
 */
function isTransformSegment(segment: string): boolean {
  // Cloudinary transforms are comma-separated key_value pairs
  // Common prefixes: w_, h_, c_, q_, f_, g_, e_, r_, x_, y_, l_, o_, fl_, dpr_, ar_
  if (/^[a-z]{1,3}_/.test(segment)) return true;
  // Multiple transforms in one segment separated by commas
  if (segment.includes(',') && /[a-z]_/.test(segment)) return true;
  return false;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
