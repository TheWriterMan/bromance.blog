import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await db.select().from(schema.tags);
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const { name, slug } = await req.json();
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const formattedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // Check unique slug
    const existing = await db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.slug, formattedSlug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Tag slug already exists' }, { status: 400 });
    }

    const id = `tag-${Date.now()}`;
    const newTag = {
      id,
      name,
      slug: formattedSlug
    };

    await db.insert(schema.tags).values(newTag);

    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error('Tag creation error:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}
