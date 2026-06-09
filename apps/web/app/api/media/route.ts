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
    
    // Format to match old interfaces (convert snake_case to match type if necessary)
    // Note: in schema, it's defined as camelCase but let's transform to camelCase which maps exactly to old camelCase or snake_case as expected
    const mapped = list.map(m => ({
      id: m.id,
      cloudinary_id: m.cloudinaryId,
      filename: m.filename,
      width: m.width,
      height: m.height,
      format: m.format,
      bytes: m.bytes,
      created_at: m.createdAt
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch media library' }, { status: 500 });
  }
}

/**
 * @deprecated Use POST /api/media/upload with multipart/form-data instead.
 * This endpoint is kept for backward compatibility but should not be used for new uploads.
 */
export async function POST(req: NextRequest) {
  // Redirect to the new upload endpoint guidance
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use POST /api/media/upload with multipart/form-data.' },
    { status: 410 }
  );
}
