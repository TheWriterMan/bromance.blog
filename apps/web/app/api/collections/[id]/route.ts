import { NextRequest, NextResponse } from 'next/server';
import { db } from '@repo/db';
import * as schema from '@repo/db';
import { eq, isNull, and } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [collection] = await db
      .select()
      .from(schema.collections)
      .where(and(eq(schema.collections.id, id), isNull(schema.collections.deletedAt)))
      .limit(1);

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Fetch published chapters for this collection
    const chapters = await db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        slug: schema.posts.slug,
        meta: schema.posts.meta,
        publishedAt: schema.posts.publishedAt,
      })
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.collectionId, id),
          eq(schema.posts.status, 'published'),
          isNull(schema.posts.deletedAt)
        )
      );

    // Sort by meta.chapterNumber ascending in JS (null/missing → Infinity)
    const sortedChapters = chapters
      .map(ch => {
        const meta = (ch.meta ?? {}) as Record<string, unknown>;
        const chapterNumber = typeof meta.chapterNumber === 'number' ? meta.chapterNumber : Infinity;
        return { ...ch, chapterNumber };
      })
      .sort((a, b) => a.chapterNumber - b.chapterNumber)
      .map(ch => ({
        id: ch.id,
        title: ch.title,
        slug: ch.slug,
        chapterNumber: ch.chapterNumber === Infinity ? null : ch.chapterNumber,
        locked: (ch.meta as Record<string, unknown>)?.locked === true,
        publishedAt: ch.publishedAt,
      }));

    return NextResponse.json({
      collection: {
        id: collection.id,
        type_key: collection.typeKey,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        cover_image: collection.coverImage,
        status: collection.status,
        sort_order: collection.sortOrder,
        metadata: collection.metadata,
        created_at: collection.createdAt,
        updated_at: collection.updatedAt,
        deleted_at: collection.deletedAt,
      },
      chapters: sortedChapters,
    });
  } catch (error) {
    console.error('GET /api/collections/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(schema.collections)
      .where(and(eq(schema.collections.id, id), isNull(schema.collections.deletedAt)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const { name, slug, description, coverImage, status, sortOrder, metadata } = await req.json();

    await db
      .update(schema.collections)
      .set({
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
        ...(status !== undefined && { status }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(metadata !== undefined && { metadata }),
        updatedAt: new Date(),
      })
      .where(eq(schema.collections.id, id));

    const [updated] = await db
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.id, id))
      .limit(1);

    return NextResponse.json({
      id: updated.id,
      type_key: updated.typeKey,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      cover_image: updated.coverImage,
      status: updated.status,
      sort_order: updated.sortOrder,
      metadata: updated.metadata,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
      deleted_at: updated.deletedAt,
    });
  } catch (error) {
    console.error('PUT /api/collections/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 });
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

    const [existing] = await db
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.id, id))
      .limit(1);

    if (!existing || existing.deletedAt !== null) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    await db
      .update(schema.collections)
      .set({ deletedAt: new Date() })
      .where(eq(schema.collections.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/collections/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 });
  }
}
