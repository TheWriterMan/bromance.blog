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
    const { name, slug, description, parent_id } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Prevent self-referencing parent
    if (parent_id === id) {
      return NextResponse.json({ error: 'Category cannot be its own parent' }, { status: 400 });
    }

    await db
      .update(schema.categories)
      .set({
        name,
        slug,
        description: description || '',
        parentId: parent_id !== undefined ? (parent_id || null) : existing[0].parentId,
      })
      .where(eq(schema.categories.id, id));

    const updated = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);

    const c = updated[0];
    return NextResponse.json({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      parent_id: c.parentId,
    });
  } catch (error) {
    console.error('Category update error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
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
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get('permanent') === 'true';

    const existing = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (permanent) {
      await db.delete(schema.categories).where(eq(schema.categories.id, id));
    } else {
      await db
        .update(schema.categories)
        .set({ deletedAt: new Date() })
        .where(eq(schema.categories.id, id));
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Category delete error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
