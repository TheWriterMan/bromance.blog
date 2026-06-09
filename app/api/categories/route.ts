import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await db.select().from(schema.categories);
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const { name, slug, description } = await req.json();
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

    const id = `cat-${Date.now()}`;
    const newCategory = {
      id,
      name,
      slug,
      description: description || ''
    };

    await db.insert(schema.categories).values(newCategory);

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Category creation error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
