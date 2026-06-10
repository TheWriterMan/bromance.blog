import { NextRequest, NextResponse } from 'next/server';
import { db } from '@repo/db';
import * as schema from '@repo/db';
import { desc, isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [list, posts] = await Promise.all([
      db.select().from(schema.mediaItems).orderBy(desc(schema.mediaItems.createdAt)),
      db
        .select({ content: schema.posts.content, featuredImage: schema.posts.featuredImage })
        .from(schema.posts)
        .where(isNull(schema.posts.deletedAt)),
    ]);

    // Compute usedIn: count how many posts reference each media item's cloudinary_id
    const usageMap = new Map<string, number>();
    for (const media of list) {
      let count = 0;
      for (const post of posts) {
        if (post.featuredImage === media.cloudinaryId) {
          count++;
        } else if (post.content.includes(media.cloudinaryId)) {
          count++;
        }
      }
      usageMap.set(media.id, count);
    }

    const mapped = list.map(m => ({
      id: m.id,
      cloudinary_id: m.cloudinaryId,
      filename: m.filename,
      width: m.width,
      height: m.height,
      format: m.format,
      bytes: m.bytes,
      created_at: m.createdAt.toISOString(),
      used_in: usageMap.get(m.id) ?? 0,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch media library' }, { status: 500 });
  }
}

/**
 * @deprecated Use POST /api/media/upload with multipart/form-data instead.
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use POST /api/media/upload with multipart/form-data.' },
    { status: 410 }
  );
}
