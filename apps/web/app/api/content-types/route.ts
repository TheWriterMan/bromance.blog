import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@repo/db';
import * as schema from '@repo/db';
import { eq, asc } from 'drizzle-orm';
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

function toRow(ct: typeof schema.contentTypes.$inferSelect) {
  return {
    id: ct.id,
    name: ct.name,
    key: ct.key,
    url_prefix: ct.urlPrefix,
    description: ct.description,
    icon: ct.icon,
    sort_order: ct.sortOrder,
  };
}

export async function GET() {
  try {
    const list = await db
      .select()
      .from(schema.contentTypes)
      .orderBy(asc(schema.contentTypes.sortOrder));
    return NextResponse.json(list.map(toRow));
  } catch {
    return NextResponse.json({ error: 'Failed to fetch content types' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { name, url_prefix, description, icon, sort_order } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const key = toKebab(name);
    const prefix = url_prefix ? toKebab(url_prefix) : key;

    if (RESERVED_PREFIXES.has(prefix)) {
      return NextResponse.json(
        { error: `URL prefix "${prefix}" is reserved and cannot be used` },
        { status: 400 }
      );
    }

    // Check key uniqueness
    const existingKey = await db
      .select({ id: schema.contentTypes.id })
      .from(schema.contentTypes)
      .where(eq(schema.contentTypes.key, key))
      .limit(1);

    const finalKey = existingKey.length > 0 ? `${key}-${generateId().slice(0, 6)}` : key;

    // Check url_prefix uniqueness
    const existingPrefix = await db
      .select({ id: schema.contentTypes.id })
      .from(schema.contentTypes)
      .where(eq(schema.contentTypes.urlPrefix, prefix))
      .limit(1);

    if (existingPrefix.length > 0) {
      return NextResponse.json({ error: `URL prefix "${prefix}" already exists` }, { status: 400 });
    }

    const id = generateId();
    await db.insert(schema.contentTypes).values({
      id,
      name,
      key: finalKey,
      urlPrefix: prefix,
      description: description || '',
      icon: icon || null,
      sortOrder: sort_order ?? 0,
    });

    const created = await db
      .select()
      .from(schema.contentTypes)
      .where(eq(schema.contentTypes.id, id))
      .limit(1);

    return NextResponse.json(toRow(created[0]), { status: 201 });
  } catch (error) {
    console.error('Content type creation error:', error);
    return NextResponse.json({ error: 'Failed to create content type' }, { status: 500 });
  }
}
