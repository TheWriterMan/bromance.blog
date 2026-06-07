import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
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

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { filename, format, width, height, bytes, base64 } = data;

    // Generate simulated Cloudinary public ID or use provided base64
    const randomHex = Math.random().toString(36).substring(2, 10);
    const generatedCloudinaryId = base64 || `blog/uploads/${randomHex}`;

    const id = `med-${Date.now()}`;
    const newMediaItem = {
      id,
      cloudinaryId: generatedCloudinaryId,
      filename: filename || `uploaded-image-${randomHex}.jpg`,
      width: width || 1200,
      height: height || 800,
      format: format || 'jpg',
      bytes: bytes || Math.floor(Math.random() * 200000) + 50000,
      createdAt: new Date().toISOString()
    };

    await db.insert(schema.mediaItems).values(newMediaItem);

    // Return mapped to match the exact same API signature (camel to snake)
    return NextResponse.json({
      id: newMediaItem.id,
      cloudinary_id: newMediaItem.cloudinaryId,
      filename: newMediaItem.filename,
      width: newMediaItem.width,
      height: newMediaItem.height,
      format: newMediaItem.format,
      bytes: newMediaItem.bytes,
      created_at: newMediaItem.createdAt
    }, { status: 201 });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json({ error: 'Failed to upload/register media' }, { status: 500 });
  }
}
