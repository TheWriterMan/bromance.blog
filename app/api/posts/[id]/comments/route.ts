import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

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

    const items = await db
      .select()
      .from(schema.comments)
      .where(eq(schema.comments.postId, id))
      .orderBy(desc(schema.comments.createdAt));

    return NextResponse.json(items.map(c => ({
      id: c.id,
      author_name: c.authorName || 'Anonymous',
      content: c.content,
      created_at: c.createdAt,
    })));
  } catch (error: any) {
    if (isTableMissingError(error)) {
      return NextResponse.json([]);
    }
    console.error('GET /api/posts/[id]/comments error:', error);
    return NextResponse.json({ error: 'Failed to get comments' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { authorName, content } = await req.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.trim().length > 2000) {
      return NextResponse.json({ error: 'Comment too long (max 2000 characters)' }, { status: 400 });
    }

    const comment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      postId: id,
      authorName: authorName?.trim() || null,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    await db.insert(schema.comments).values(comment);

    return NextResponse.json({
      id: comment.id,
      author_name: comment.authorName || 'Anonymous',
      content: comment.content,
      created_at: comment.createdAt,
    }, { status: 201 });
  } catch (error: any) {
    if (isTableMissingError(error)) {
      return NextResponse.json({ error: 'Comments not yet configured (DB table missing)' }, { status: 503 });
    }
    console.error('POST /api/posts/[id]/comments error:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      // Delete ALL comments for this post
      await db.delete(schema.comments).where(eq(schema.comments.postId, id));
      return NextResponse.json({ success: true, message: 'All comments deleted' });
    }

    // Delete single comment
    await db.delete(schema.comments).where(eq(schema.comments.id, commentId));
    return NextResponse.json({ success: true, message: 'Comment deleted' });
  } catch (error: any) {
    if (isTableMissingError(error)) {
      return NextResponse.json({ error: 'Comments table missing' }, { status: 503 });
    }
    console.error('DELETE /api/posts/[id]/comments error:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
