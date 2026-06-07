import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { inArray } from 'drizzle-orm';
import cloudinary from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    // Fetch cloudinary IDs before deleting from DB
    const items = await db
      .select({ cloudinaryId: schema.mediaItems.cloudinaryId })
      .from(schema.mediaItems)
      .where(inArray(schema.mediaItems.id, ids));

    const cloudinaryIds = items
      .map(i => i.cloudinaryId)
      .filter((id): id is string => !!id);

    // Delete from Cloudinary (batch)
    if (cloudinaryIds.length > 0) {
      try {
        await cloudinary.api.delete_resources(cloudinaryIds);
      } catch (err) {
        console.error('Cloudinary bulk delete failed (continuing with DB delete):', err);
      }
    }

    // Delete from database
    await db.delete(schema.mediaItems).where(inArray(schema.mediaItems.id, ids));
    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to bulk delete media' }, { status: 500 });
  }
}
