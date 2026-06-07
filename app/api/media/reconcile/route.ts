import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import cloudinary from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

/**
 * Scans all published post content for Cloudinary URLs that are not
 * yet registered in the media_items table, fetches their metadata
 * from Cloudinary, and inserts them.
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

    // Fetch all posts with content
    const posts = await db
      .select({ id: schema.posts.id, content: schema.posts.content })
      .from(schema.posts);

    // Regex to extract Cloudinary public IDs from URLs in post content
    // Matches: https://res.cloudinary.com/{cloud}/image/upload/{transforms}/{public_id}.{ext}
    const urlPattern = new RegExp(
      `https://res\\.cloudinary\\.com/${cloudName}/image/upload/[^/]+/([^"'\\s]+)`,
      'g'
    );

    const foundPublicIds = new Set<string>();

    for (const post of posts) {
      if (!post.content) continue;
      let match;
      while ((match = urlPattern.exec(post.content)) !== null) {
        // match[1] is the public_id with extension (e.g. bromance/abc123.jpg)
        // Strip the file extension to get the actual public_id
        let publicId = match[1];
        // Remove extension if present
        publicId = publicId.replace(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i, '');
        foundPublicIds.add(publicId);
      }
    }

    if (foundPublicIds.size === 0) {
      return NextResponse.json({ reconciled: 0, message: 'No Cloudinary URLs found in post content' });
    }

    // Check which are already in media_items
    const existingItems = await db
      .select({ cloudinaryId: schema.mediaItems.cloudinaryId })
      .from(schema.mediaItems);

    const existingIds = new Set(existingItems.map(i => i.cloudinaryId));
    const missingIds = [...foundPublicIds].filter(id => !existingIds.has(id));

    if (missingIds.length === 0) {
      return NextResponse.json({ reconciled: 0, message: 'All images already registered' });
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
        errors.push(`${publicId}: ${err.message || 'unknown error'}`);
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
