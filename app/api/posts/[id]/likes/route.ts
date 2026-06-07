import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, and, count } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [result] = await db
      .select({ count: count() })
      .from(schema.postLikes)
      .where(eq(schema.postLikes.postId, id));

    // Check if current visitor already liked
    const visitorId = req.cookies.get('visitor_id')?.value || '';
    let liked = false;
    if (visitorId) {
      const [existing] = await db
        .select({ id: schema.postLikes.id })
        .from(schema.postLikes)
        .where(and(
          eq(schema.postLikes.postId, id),
          eq(schema.postLikes.visitorId, visitorId)
        ));
      liked = !!existing;
    }

    return NextResponse.json({ count: result?.count ?? 0, liked });
  } catch (error: any) {
    // Table may not exist yet
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return NextResponse.json({ count: 0, liked: false });
    }
    return NextResponse.json({ error: 'Failed to get likes' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get or create visitor ID from cookie
    let visitorId = req.cookies.get('visitor_id')?.value;
    if (!visitorId) {
      visitorId = `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    // Check if already liked
    const [existing] = await db
      .select({ id: schema.postLikes.id })
      .from(schema.postLikes)
      .where(and(
        eq(schema.postLikes.postId, id),
        eq(schema.postLikes.visitorId, visitorId)
      ));

    if (existing) {
      return NextResponse.json({ error: 'Already liked' }, { status: 409 });
    }

    await db.insert(schema.postLikes).values({
      id: `like-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      postId: id,
      visitorId,
      createdAt: new Date().toISOString(),
    });

    // Get new count
    const [result] = await db
      .select({ count: count() })
      .from(schema.postLikes)
      .where(eq(schema.postLikes.postId, id));

    const response = NextResponse.json({ count: result?.count ?? 1, liked: true });
    // Set visitor cookie if new
    if (!req.cookies.get('visitor_id')?.value) {
      response.cookies.set('visitor_id', visitorId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'strict',
      });
    }
    return response;
  } catch (error: any) {
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      return NextResponse.json({ error: 'Likes not yet configured (DB table missing)' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}
