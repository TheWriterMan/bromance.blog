import { NextRequest, NextResponse } from 'next/server';
import { db } from '@repo/db';
import * as schema from '@repo/db';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await db
      .select()
      .from(schema.mediaItems)
      .orderBy(desc(schema.mediaItems.createdAt));
    
    const mapped = list.map(m => ({
      id: m.id,
      cloudinary_id: m.cloudinaryId,
      filename: m.filename,
      width: m.width,
      height: m.height,
      format: m.format,
      bytes: m.bytes,
      created_at: m.createdAt.toISOString(),
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
