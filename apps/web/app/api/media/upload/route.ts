import { NextRequest, NextResponse } from 'next/server';
import cloudinary, { CLOUDINARY_FOLDER } from '@/lib/cloudinary';
import { db, generateId } from '@repo/db';
import * as schema from '@repo/db';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are accepted' }, { status: 400 });
    }

    // Convert file to base64 data URI for Cloudinary upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64DataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64DataUri, {
      folder: CLOUDINARY_FOLDER,
      resource_type: 'image',
    });

    // Store in database
    const id = generateId();
    const now = new Date();
    const newMediaItem = {
      id,
      cloudinaryId: result.public_id,
      filename: file.name || `image-${id}.${result.format}`,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      createdAt: now,
    };

    await db.insert(schema.mediaItems).values(newMediaItem);

    return NextResponse.json({
      id: newMediaItem.id,
      cloudinary_id: result.public_id,
      url: result.secure_url,
      filename: newMediaItem.filename,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      created_at: now.toISOString(),
    }, { status: 201 });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
