import { NextRequest, NextResponse } from 'next/server';
import cloudinary, { CLOUDINARY_FOLDER } from '@/lib/cloudinary';
import { db } from '@repo/db';
import * as schema from '@repo/db';
import { eq } from 'drizzle-orm';

function isTableMissingError(error: any): boolean {
  const msg = error?.message || error?.toString() || '';
  const code = error?.code || '';
  return code === '42P01' || msg.includes('does not exist') || msg.includes('undefined_table');
}

export async function POST(req: NextRequest) {
  // Auth check
  const { requireAuth } = await import('@/lib/auth');
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert to buffer for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: CLOUDINARY_FOLDER,
          public_id: 'author-avatar',
          overwrite: true,
          resource_type: 'image',
          transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    const avatarUrl = result.secure_url;

    // Update author record if table exists
    try {
      const existing = await db.select().from(schema.authors).limit(1);
      if (existing.length > 0) {
        await db.update(schema.authors)
          .set({ avatarUrl, updatedAt: new Date() })
          .where(eq(schema.authors.id, existing[0].id));
      } else {
        // Create author row with avatar
        await db.insert(schema.authors).values({
          id: 'author-1',
          displayName: 'Amy97',
          slug: 'amy97',
          bio: null,
          avatarUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (dbError: any) {
      if (!isTableMissingError(dbError)) {
        console.error('Avatar DB update failed:', dbError?.message);
      }
      // Still return the URL even if DB update fails
    }

    return NextResponse.json({
      avatar_url: avatarUrl,
      public_id: result.public_id,
    });
  } catch (error: any) {
    console.error('POST /api/authors/avatar error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}
