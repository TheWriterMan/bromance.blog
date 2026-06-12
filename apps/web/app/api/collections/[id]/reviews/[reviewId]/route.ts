import { NextRequest, NextResponse } from 'next/server';
import { db } from '@repo/db';
import * as schema from '@repo/db';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  try {
    const { id, reviewId } = await params;

    const existing = await db
      .select({ id: schema.reviews.id })
      .from(schema.reviews)
      .where(and(eq(schema.reviews.id, reviewId), eq(schema.reviews.collectionId, id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    await db.delete(schema.reviews).where(eq(schema.reviews.id, reviewId));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/collections/[id]/reviews/[reviewId] error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
