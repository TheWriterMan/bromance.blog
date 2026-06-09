import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@repo/db';
import * as schema from '@repo/db';
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
      created_at: r.createdAt.toISOString(),
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Fetch revisions error:', error);
    return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 });
  }
}

// POST to /api/posts/[id]/revisions restores a revision
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

    // Capture current state as a new revision before restoring
    await db.insert(schema.postRevisions).values({
      id: generateId(),
      postId: currentPost.id,
      title: currentPost.title,
      content: currentPost.content,
      updatedBy: 'auto-snapshot-before-restore',
      createdAt: new Date(),
    });

    // Restore
    const now = new Date();
    await db
      .update(schema.posts)
      .set({
        title: revision.title,
        content: revision.content,
        updatedAt: now,
      })
      .where(eq(schema.posts.id, id));

    return NextResponse.json({
      id: currentPost.id,
      title: revision.title,
      slug: currentPost.slug,
      content: revision.content,
      summary: currentPost.summary,
      status: currentPost.status,
      published_at: currentPost.publishedAt?.toISOString() ?? null,
      created_at: currentPost.createdAt.toISOString(),
      updated_at: now.toISOString(),
      category_id: currentPost.categoryId,
      featured_image: currentPost.featuredImage,
      views: currentPost.views,
    });
  } catch (error) {
    console.error('Restore revision error:', error);
    return NextResponse.json({ error: 'Failed to restore revision' }, { status: 500 });
  }
}
