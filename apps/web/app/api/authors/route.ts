import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@repo/db';
import * as schema from '@repo/db';
import { eq } from 'drizzle-orm';

function isTableMissingError(error: any): boolean {
  const msg = error?.message || error?.toString() || '';
  const code = error?.code || '';
  return code === '42P01' || msg.includes('does not exist') || msg.includes('undefined_table');
}

const DEFAULT_AUTHOR = {
  id: 'author-1',
  display_name: 'Amy97',
  slug: 'amy97',
  bio: null,
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export async function GET() {
  try {
    const rows = await db.select().from(schema.authors).limit(1);

    if (rows.length === 0) {
      return NextResponse.json(DEFAULT_AUTHOR);
    }

    const a = rows[0];
    return NextResponse.json({
      id: a.id,
      display_name: a.displayName,
      slug: a.slug,
      bio: a.bio,
      avatar_url: a.avatarUrl,
      created_at: a.createdAt.toISOString(),
      updated_at: a.updatedAt.toISOString(),
    });
  } catch (error: any) {
    if (isTableMissingError(error)) {
      return NextResponse.json(DEFAULT_AUTHOR);
    }
    console.error('GET /api/authors error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to fetch author' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { requireAuth } = await import('@/lib/auth');
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const data = await req.json();
    const { display_name, slug, bio, avatar_url } = data;

    if (!display_name || !slug) {
      return NextResponse.json({ error: 'Display name and slug are required' }, { status: 400 });
    }

    const now = new Date();

    // Check if author row exists
    const existing = await db.select().from(schema.authors).limit(1);

    if (existing.length === 0) {
      const newAuthor = {
        id: generateId(),
        displayName: display_name.trim(),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
        bio: bio?.trim() || null,
        avatarUrl: avatar_url || null,
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(schema.authors).values(newAuthor);

      return NextResponse.json({
        id: newAuthor.id,
        display_name: newAuthor.displayName,
        slug: newAuthor.slug,
        bio: newAuthor.bio,
        avatar_url: newAuthor.avatarUrl,
        created_at: newAuthor.createdAt.toISOString(),
        updated_at: newAuthor.updatedAt.toISOString(),
      });
    }

    // Update existing row
    const authorId = existing[0].id;
    const updatePayload = {
      displayName: display_name.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
      bio: bio?.trim() || null,
      avatarUrl: avatar_url !== undefined ? avatar_url : existing[0].avatarUrl,
      updatedAt: now,
    };

    await db.update(schema.authors).set(updatePayload).where(eq(schema.authors.id, authorId));

    return NextResponse.json({
      id: authorId,
      display_name: updatePayload.displayName,
      slug: updatePayload.slug,
      bio: updatePayload.bio,
      avatar_url: updatePayload.avatarUrl,
      created_at: existing[0].createdAt.toISOString(),
      updated_at: updatePayload.updatedAt.toISOString(),
    });
  } catch (error: any) {
    if (isTableMissingError(error)) {
      return NextResponse.json({ error: 'Authors table not yet configured (DB table missing)' }, { status: 503 });
    }
    console.error('PUT /api/authors error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to update author' }, { status: 500 });
  }
}
