import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@repo/db';
import * as schema from '@repo/db';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const items = await db
      .select()
      .from(schema.reviews)
      .where(eq(schema.reviews.collectionId, id))
      .orderBy(desc(schema.reviews.createdAt));

    return NextResponse.json(items.map(r => ({
      id: r.id,
      collection_id: r.collectionId,
      author_name: r.authorName,
      rating: r.rating,
      content: r.content,
      created_at: r.createdAt,
    })));
  } catch (error) {
    console.error('GET /api/collections/[id]/reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { authorName, rating, content } = await req.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    // Clamp rating to 1–5, default to 5
    const clampedRating = Math.min(5, Math.max(1, typeof rating === 'number' ? Math.round(rating) : 5));

    const now = new Date();
    const review = {
      id: generateId(),
      collectionId: id,
      authorName: authorName?.trim() || null,
      rating: clampedRating,
      content: content.trim(),
      createdAt: now,
    };

    await db.insert(schema.reviews).values(review);

    return NextResponse.json({
      id: review.id,
      collection_id: review.collectionId,
      author_name: review.authorName,
      rating: review.rating,
      content: review.content,
      created_at: now,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/collections/[id]/reviews error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
