import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@repo/db';
import * as schema from '@repo/db';
import { eq, isNull, sql, and, inArray } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get('type');

    const condition = typeFilter
      ? and(isNull(schema.collections.deletedAt), eq(schema.collections.typeKey, typeFilter))
      : isNull(schema.collections.deletedAt);

    const list = await db.select().from(schema.collections).where(condition);

    if (list.length === 0) {
      return NextResponse.json([]);
    }

    const ids = list.map(c => c.id);

    // Chapter counts + views per collection
    const chapterStats = await db
      .select({
        collectionId: schema.posts.collectionId,
        chapterCount: sql<number>`cast(count(*) as integer)`,
        views: sql<number>`cast(coalesce(sum(${schema.posts.views}), 0) as integer)`,
      })
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.status, 'published'),
          isNull(schema.posts.deletedAt),
          inArray(schema.posts.collectionId, ids)
        )
      )
      .groupBy(schema.posts.collectionId);

    // Review stats per collection
    const reviewStats = await db
      .select({
        collectionId: schema.reviews.collectionId,
        reviewsCount: sql<number>`cast(count(*) as integer)`,
        avgRating: sql<number>`round(avg(${schema.reviews.rating})::numeric, 1)`,
      })
      .from(schema.reviews)
      .where(inArray(schema.reviews.collectionId, ids))
      .groupBy(schema.reviews.collectionId);

    const chapterMap = new Map(chapterStats.map(s => [s.collectionId, s]));
    const reviewMap = new Map(reviewStats.map(s => [s.collectionId, s]));

    return NextResponse.json(list.map(c => {
      const ch = chapterMap.get(c.id);
      const rv = reviewMap.get(c.id);
      return {
        id: c.id,
        type_key: c.typeKey,
        name: c.name,
        slug: c.slug,
        description: c.description,
        cover_image: c.coverImage,
        status: c.status,
        sort_order: c.sortOrder,
        metadata: c.metadata,
        created_at: c.createdAt,
        updated_at: c.updatedAt,
        deleted_at: c.deletedAt,
        chapterCount: ch?.chapterCount ?? 0,
        views: ch?.views ?? 0,
        rating: rv ? Number(rv.avgRating) : 0,
        reviewsCount: rv?.reviewsCount ?? 0,
      };
    }));
  } catch (error) {
    console.error('GET /api/collections error:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const { name, typeKey, slug, description, coverImage, status, sortOrder, metadata } = await req.json();

    if (!name || !typeKey) {
      return NextResponse.json({ error: 'name and typeKey are required' }, { status: 400 });
    }

    // Validate typeKey references a content type with hasCollections=true
    const [ct] = await db
      .select({ id: schema.contentTypes.id, hasCollections: schema.contentTypes.hasCollections })
      .from(schema.contentTypes)
      .where(eq(schema.contentTypes.key, typeKey))
      .limit(1);

    if (!ct) {
      return NextResponse.json({ error: `Content type '${typeKey}' not found` }, { status: 400 });
    }
    if (!ct.hasCollections) {
      return NextResponse.json({ error: `Content type '${typeKey}' does not support collections` }, { status: 400 });
    }

    // Auto-generate slug if not provided
    const finalSlug = slug
      ? slug
      : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check slug uniqueness
    const [existing] = await db
      .select({ id: schema.collections.id })
      .from(schema.collections)
      .where(eq(schema.collections.slug, finalSlug))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: 'Collection slug already exists' }, { status: 400 });
    }

    const id = generateId();
    const now = new Date();

    await db.insert(schema.collections).values({
      id,
      typeKey,
      name,
      slug: finalSlug,
      description: description || '',
      coverImage: coverImage || '',
      status: status || 'ongoing',
      sortOrder: sortOrder ?? 0,
      metadata: metadata || {},
      createdAt: now,
      updatedAt: now,
    });

    const [row] = await db
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.id, id))
      .limit(1);

    return NextResponse.json({
      id: row.id,
      type_key: row.typeKey,
      name: row.name,
      slug: row.slug,
      description: row.description,
      cover_image: row.coverImage,
      status: row.status,
      sort_order: row.sortOrder,
      metadata: row.metadata,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
      deleted_at: row.deletedAt,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/collections error:', error);
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }
}
