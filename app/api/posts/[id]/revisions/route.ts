import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, desc, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const id = params.id;
    const list = await db
      .select()
      .from(schema.postRevisions)
      .where(eq(schema.postRevisions.postId, id))
      .orderBy(desc(schema.postRevisions.createdAt));

    const mapped = list.map(r => ({
      id: r.id,
      post_id: r.postId,
      title: r.title,
      content: r.content,
      updated_by: r.updatedBy,
      created_at: r.createdAt
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Fetch revisions error:', error);
    return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
  }
}

// POST to /api/posts/[id]/revisions restores the revision
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const id = params.id;
    const { revisionId } = await req.json();

    if (!revisionId) {
      return NextResponse.json({ error: 'Revision ID is required' }, { status: 400 });
    }

    // Get current post
    const matchedPosts = await db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.id, id))
      .limit(1);

    if (matchedPosts.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const currentPost = matchedPosts[0];

    // Get revision
    const matchedRevisions = await db
      .select()
      .from(schema.postRevisions)
      .where(and(eq(schema.postRevisions.id, revisionId), eq(schema.postRevisions.postId, id)))
      .limit(1);

    if (matchedRevisions.length === 0) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }

    const revision = matchedRevisions[0];

    // Capture current state as a new revision before restoring, so work is never lost!
    await db.insert(schema.postRevisions).values({
      id: `rev-${Date.now()}`,
      postId: currentPost.id,
      title: currentPost.title,
      content: currentPost.content,
      updatedBy: 'amy97',
      createdAt: new Date().toISOString()
    });

    // Restore
    const updatePayload = {
      title: revision.title,
      content: revision.content,
      updatedAt: new Date().toISOString()
    };

    await db
      .update(schema.posts)
      .set(updatePayload)
      .where(eq(schema.posts.id, id));

    return NextResponse.json({
      ...currentPost,
      title: updatePayload.title,
      content: updatePayload.content,
      updated_at: updatePayload.updatedAt
    });
  } catch (error) {
    console.error('Restore revision error:', error);
    return NextResponse.json({ error: 'Failed to restore revision' }, { status: 500 });
  }
}
