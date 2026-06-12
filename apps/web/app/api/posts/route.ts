import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@repo/db';
import * as schema from '@repo/db';
import { eq, and, sql, desc, inArray, ilike, or, isNull } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // draft | published | scheduled | all
    const categoryId = searchParams.get('category_id');
    const search = searchParams.get('search');
    const tagSlug = searchParams.get('tag');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const excludeContent = searchParams.get('excludeContent') === 'true';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const conditions = [];

    // Exclude soft-deleted posts by default
    if (!includeDeleted) {
      conditions.push(isNull(schema.posts.deletedAt));
    }

    // Filter by status
    if (status && status !== 'all') {
      conditions.push(eq(schema.posts.status, status));
    }

    // Filter by content type
    if (type) {
      conditions.push(eq(schema.posts.type, type));
    }

    // Filter by collection
    const collection_id = searchParams.get('collection_id');
    if (collection_id) {
      conditions.push(eq(schema.posts.collectionId, collection_id));
    }

    // Filter by Category
    if (categoryId) {
      conditions.push(eq(schema.posts.categoryId, categoryId));
    }

    // Filter by search string
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          ilike(schema.posts.title, searchPattern),
          ilike(schema.posts.summary, searchPattern),
          ilike(schema.posts.content, searchPattern)
        )
      );
    }

    // Filter by tag slug
    if (tagSlug) {
       const tagRecord = await db.select().from(schema.tags).where(eq(schema.tags.slug, tagSlug)).limit(1);
       if (tagRecord.length > 0) {
         const postTagsRecords = await db.select({ postId: schema.postTags.postId }).from(schema.postTags).where(eq(schema.postTags.tagId, tagRecord[0].id));
         const postIds = postTagsRecords.map(pt => pt.postId);
         if (postIds.length > 0) {
           conditions.push(inArray(schema.posts.id, postIds));
         } else {
           conditions.push(eq(schema.posts.id, 'NO_MATCH'));
         }
       } else {
         conditions.push(eq(schema.posts.id, 'NO_MATCH'));
       }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Paginate
    const offset = (page - 1) * limit;

    const [totalQuery, postsList] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(schema.posts).where(whereClause),
      db.select({
        id: schema.posts.id,
        title: schema.posts.title,
        slug: schema.posts.slug,
        summary: schema.posts.summary,
        status: schema.posts.status,
        publishedAt: schema.posts.publishedAt,
        createdAt: schema.posts.createdAt,
        updatedAt: schema.posts.updatedAt,
        categoryId: schema.posts.categoryId,
        featuredImage: schema.posts.featuredImage,
        views: schema.posts.views,
        metaTitle: schema.posts.metaTitle,
        metaDescription: schema.posts.metaDescription,
        canonicalUrl: schema.posts.canonicalUrl,
        noindex: schema.posts.noindex,
        ogImage: schema.posts.ogImage,
        discussionOpen: schema.posts.discussionOpen,
        type: schema.posts.type,
        meta: schema.posts.meta,
        // Chapter meta keys: chapterNumber (number), locked (boolean)
        collectionId: schema.posts.collectionId,
        deletedAt: schema.posts.deletedAt,
        content: excludeContent ? schema.posts.summary : schema.posts.content,
      })
      .from(schema.posts)
      .where(whereClause)
      .orderBy(desc(schema.posts.createdAt))
      .limit(limit)
      .offset(offset)
    ]);

    const total = totalQuery[0].count;

    const postIds = postsList.map(p => p.id);
    const activeCategoryIds = postsList.map(p => p.categoryId).filter(Boolean) as string[];
    
    const [categoriesList, postTagsListResult, tagsList] = await Promise.all([
      activeCategoryIds.length > 0 
        ? db.select().from(schema.categories).where(inArray(schema.categories.id, activeCategoryIds)) 
        : Promise.resolve([]),
      postIds.length > 0
        ? db.select().from(schema.postTags).where(inArray(schema.postTags.postId, postIds))
        : Promise.resolve([]),
      db.select().from(schema.tags)
    ]);

    const categories = categoriesList.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description
    }));

    const tags = tagsList.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug
    }));

    const postTags = postTagsListResult.map(pt => ({
      post_id: pt.postId,
      tag_id: pt.tagId
    }));

    const posts = postsList.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      content: p.content,
      summary: p.summary,
      status: p.status as 'draft' | 'published' | 'scheduled',
      published_at: p.publishedAt?.toISOString() ?? null,
      created_at: p.createdAt.toISOString(),
      updated_at: p.updatedAt.toISOString(),
      category_id: p.categoryId,
      featured_image: p.featuredImage,
      meta_title: p.metaTitle,
      meta_description: p.metaDescription,
      canonical_url: p.canonicalUrl,
      noindex: p.noindex,
      ogImage: p.ogImage,
      discussion_open: p.discussionOpen,
      type: p.type,
      meta: p.meta,
      collection_id: p.collectionId ?? null,
      deleted_at: p.deletedAt?.toISOString() ?? null,
      views: p.views,
    }));

    // Enrich posts with category info, tag arrays, and computed fields
    const enriched = posts.map(post => {
      const category = categories.find(c => c.id === post.category_id);
      const taggedIds = postTags
        .filter(pt => pt.post_id === post.id)
        .map(pt => pt.tag_id);
      const postTagsArray = tags.filter(t => taggedIds.includes(t.id));

      // Compute read time from content word count (handles both JSON and HTML)
      let wordCount = 0;
      if (post.content) {
        try {
          const doc = JSON.parse(post.content);
          // TipTap JSON: extract text from all text nodes recursively
          const extractText = (node: any): string => {
            if (node.text) return node.text;
            if (node.content) return node.content.map(extractText).join(' ');
            return '';
          };
          wordCount = extractText(doc).split(/\s+/).filter(Boolean).length;
        } catch {
          // Fallback: treat as HTML
          wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
        }
      }
      const readTime = Math.max(1, Math.ceil(wordCount / 200));

      return {
        ...post,
        category,
        tags: postTagsArray,
        read_time: readTime,
      };
    });

    return NextResponse.json({
      items: enriched,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Fetch posts error:', error);
    return NextResponse.json({ error: 'Failed to retrieve posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = requireAuth(req);
  if (denied) return denied;

  try {
    const data = await req.json();
    const { 
      title, 
      content, 
      summary, 
      status, 
      category_id, 
      featured_image, 
      meta_title, 
      meta_description, 
      canonical_url,
      noindex,
      og_image,
      discussion_open,
      type,
      meta,
      collection_id,
      tagIds, 
      published_at 
    } = data;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Fetch categories and tags in parallel (needed for response enrichment)
    const [categoriesList, tagsList] = await Promise.all([
      db.select().from(schema.categories),
      db.select().from(schema.tags),
    ]);

    const newId = generateId();
    
    // Generate slug with targeted conflict check
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-') || 'untitled-post';
    
    const conflicts = await db
      .select({ slug: schema.posts.slug })
      .from(schema.posts)
      .where(eq(schema.posts.slug, baseSlug))
      .limit(1);
    const calculatedSlug = conflicts.length > 0 ? `${baseSlug}-${generateId()}` : baseSlug;

    const now = new Date();
    let pubDate: Date | null = null;
    if (status === 'published') {
      pubDate = published_at ? new Date(published_at) : now;
    } else if (status === 'scheduled') {
      pubDate = published_at ? new Date(published_at) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    }

    // Default category ID if none is supplied
    const fallbackCategory = categoriesList[0]?.id || null;
    const activeCategory = category_id || fallbackCategory;

    const newPost = {
      id: newId,
      title,
      slug: calculatedSlug,
      content: content || '',
      summary: summary || '',
      status: (status || 'draft') as 'draft' | 'published' | 'scheduled',
      publishedAt: pubDate,
      createdAt: now,
      updatedAt: now,
      categoryId: activeCategory,
      featuredImage: featured_image || '',
      metaTitle: meta_title || title,
      metaDescription: meta_description || summary || '',
      canonicalUrl: canonical_url || '',
      noindex: noindex ?? false,
      ogImage: og_image || null,
      discussionOpen: discussion_open ?? true,
      type: type || 'article',
      meta: meta || {},
      collectionId: collection_id || null,
      views: 0,
    };

    await db.insert(schema.posts).values(newPost);

    // Save linked tags (batch insert)
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await db.insert(schema.postTags).values(
        tagIds.map((tagId: string) => ({ postId: newId, tagId }))
      );
    }

    const matchedCategory = categoriesList.find(c => c.id === activeCategory);
    const matchedTags = tagsList.filter(t => (tagIds || []).includes(t.id));

    return NextResponse.json({
      id: newId,
      title: newPost.title,
      slug: newPost.slug,
      content: newPost.content,
      summary: newPost.summary,
      status: newPost.status,
      published_at: newPost.publishedAt?.toISOString() ?? null,
      created_at: newPost.createdAt.toISOString(),
      updated_at: newPost.updatedAt.toISOString(),
      category_id: newPost.categoryId,
      featured_image: newPost.featuredImage,
      meta_title: newPost.metaTitle,
      meta_description: newPost.metaDescription,
      canonical_url: newPost.canonicalUrl,
      noindex: newPost.noindex,
      ogImage: newPost.ogImage,
      discussion_open: newPost.discussionOpen,
      type: newPost.type,
      meta: newPost.meta,
      collection_id: newPost.collectionId ?? null,
      views: newPost.views,
      category: matchedCategory,
      tags: matchedTags
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create post error:', error?.message || error, error?.code || '', error?.detail || '');
    return NextResponse.json({ error: 'Failed to create post', detail: error?.message || 'Unknown error' }, { status: 500 });
  }
}
