import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import cloudinary from '@/lib/cloudinary';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the record to get cloudinary_id before deleting
    const [item] = await db
      .select({ cloudinaryId: schema.mediaItems.cloudinaryId })
      .from(schema.mediaItems)
      .where(eq(schema.mediaItems.id, id));

    if (!item) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 });
    }

    // Delete from Cloudinary
    if (item.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(item.cloudinaryId);
      } catch (err) {
        console.error('Cloudinary delete failed (continuing with DB delete):', err);
      }
    }

    // Delete from database
    await db.delete(schema.mediaItems).where(eq(schema.mediaItems.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete media item' }, { status: 500 });
  }
}
