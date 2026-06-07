import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, slug, description } = await req.json();

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

    await db
      .update(schema.categories)
      .set({ name, slug, description: description || '' })
      .where(eq(schema.categories.id, id));

    const updated = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Category update error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    await db.delete(schema.categories).where(eq(schema.categories.id, id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Category delete error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
