import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@repo/db';
import * as schema from '@repo/db';
import { eq, and, count } from 'drizzle-orm';

function isTableMissingError(error: any): boolean {
  const msg = error?.message || error?.toString() || '';
  const code = error?.code || '';
  return code === '42P01' || msg.includes('does not exist') || msg.includes('undefined_table');
}

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
    if (isTableMissingError(error)) {
      return NextResponse.json({ count: 0, liked: false });
    }
    console.error('GET /api/posts/[id]/likes error:', error);
    return NextResponse.json({ error: 'Failed to get likes' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let visitorId = req.cookies.get('visitor_id')?.value;
    if (!visitorId) {
      visitorId = `v-${generateId()}`;
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
      id: generateId(),
      postId: id,
      visitorId,
      createdAt: new Date(),
    });

    // Get new count
    const [result] = await db
      .select({ count: count() })
      .from(schema.postLikes)
      .where(eq(schema.postLikes.postId, id));

    const response = NextResponse.json({ count: result?.count ?? 1, liked: true });
    if (!req.cookies.get('visitor_id')?.value) {
      response.cookies.set('visitor_id', visitorId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'strict',
      });
    }
    return response;
  } catch (error: any) {
    if (isTableMissingError(error)) {
      return NextResponse.json({ error: 'Likes not yet configured (DB table missing)' }, { status: 503 });
    }
    console.error('POST /api/posts/[id]/likes error:', error);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}
