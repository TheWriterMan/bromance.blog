import { NextRequest, NextResponse } from 'next/server';
import { db } from '@repo/db';
import * as schema from '@repo/db';
import { eq, ne, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// URL prefixes that cannot be used for new content types as they shadow existing routes
const RESERVED_PREFIXES = new Set([
  'category', 'tag', 'author', 'feed.xml', 'sitemap', 'robots',
  'my-work', 'cms', 'api', 'articles', 'novels',
]);

function toKebab(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, url_prefix, description, icon, sort_order } = body;

    const existing = await db
      .select()
      .from(schema.contentTypes)
      .where(eq(schema.contentTypes.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Content type not found' }, { status: 404 });
    }

    const updates: Partial<typeof schema.contentTypes.$inferInsert> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon || null;
    if (sort_order !== undefined) updates.sortOrder = sort_order;
    if (url_prefix !== undefined) {
      const prefix = toKebab(url_prefix);
      if (RESERVED_PREFIXES.has(prefix)) {
        return NextResponse.json(
          { error: `URL prefix "${prefix}" is reserved` },
          { status: 400 }
        );
      }
      // Check uniqueness against other rows
      const clash = await db
        .select({ id: schema.contentTypes.id })
        .from(schema.contentTypes)
        .where(and(eq(schema.contentTypes.urlPrefix, prefix), ne(schema.contentTypes.id, id)))
        .limit(1);
      if (clash.length > 0) {
        return NextResponse.json({ error: `URL prefix "${prefix}" already exists` }, { status: 400 });
      }
      updates.urlPrefix = prefix;
    }

    updates.updatedAt = new Date();
    await db.update(schema.contentTypes).set(updates).where(eq(schema.contentTypes.id, id));

    const updated = await db
      .select()
      .from(schema.contentTypes)
      .where(eq(schema.contentTypes.id, id))
      .limit(1);

    const ct = updated[0];
    return NextResponse.json({
      id: ct.id,
      name: ct.name,
      key: ct.key,
      url_prefix: ct.urlPrefix,
      description: ct.description,
      icon: ct.icon,
      sort_order: ct.sortOrder,
    });
  } catch (error) {
    console.error('Content type update error:', error);
    return NextResponse.json({ error: 'Failed to update content type' }, { status: 500 });
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
      .from(schema.contentTypes)
      .where(eq(schema.contentTypes.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Content type not found' }, { status: 404 });
    }

    // Protect the base article type
    if (existing[0].key === 'article') {
      return NextResponse.json(
        { error: 'The base "article" content type cannot be deleted' },
        { status: 409 }
      );
    }

    // Block delete if posts reference this type
    const postCount = await db
      .select({ id: schema.posts.id })
      .from(schema.posts)
      .where(eq(schema.posts.type, existing[0].key))
      .limit(1);

    if (postCount.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete: posts exist with type "${existing[0].key}"` },
        { status: 409 }
      );
    }

    await db.delete(schema.contentTypes).where(eq(schema.contentTypes.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Content type delete error:', error);
    return NextResponse.json({ error: 'Failed to delete content type' }, { status: 500 });
  }
}
