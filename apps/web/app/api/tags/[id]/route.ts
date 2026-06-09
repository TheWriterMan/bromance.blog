import { NextRequest, NextResponse } from 'next/server';
import { db } from '@repo/db';
import * as schema from '@repo/db';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const { id } = await params;
    const { name, slug } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    const formattedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    await db
      .update(schema.tags)
      .set({ name, slug: formattedSlug })
      .where(eq(schema.tags.id, id));

    return NextResponse.json({ id, name, slug: formattedSlug });
  } catch (error) {
    console.error('Tag update error:', error);
    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const { id } = await params;

    const existing = await db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    await db.delete(schema.tags).where(eq(schema.tags.id, id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Tag delete error:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
