import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@repo/db';
import * as schema from '@repo/db';
import { eq, isNull, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const conditions = includeDeleted ? undefined : isNull(schema.categories.deletedAt);
    const list = await db.select().from(schema.categories).where(conditions);

    // Compute post counts per category (only non-deleted posts)
    const postCounts = await db
      .select({
        categoryId: schema.posts.categoryId,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(schema.posts)
      .where(isNull(schema.posts.deletedAt))
      .groupBy(schema.posts.categoryId);

    const countMap = new Map(postCounts.map(pc => [pc.categoryId, pc.count]));

    return NextResponse.json(list.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      parent_id: c.parentId,
      post_count: countMap.get(c.id) ?? 0,
    })));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const { name, slug, description, parent_id } = await req.json();
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check unique slug
    const existing = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Category slug already exists' }, { status: 400 });
    }

    // Validate parent_id if provided
    if (parent_id) {
      const parentExists = await db
        .select({ id: schema.categories.id })
        .from(schema.categories)
        .where(eq(schema.categories.id, parent_id))
        .limit(1);
      if (parentExists.length === 0) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 400 });
      }
    }

    const id = generateId();
    const newCategory = {
      id,
      name,
      slug,
      description: description || '',
      parentId: parent_id || null,
    };

    await db.insert(schema.categories).values(newCategory);

    return NextResponse.json({
      id,
      name: newCategory.name,
      slug: newCategory.slug,
      description: newCategory.description,
      parent_id: newCategory.parentId,
    }, { status: 201 });
  } catch (error) {
    console.error('Category creation error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
