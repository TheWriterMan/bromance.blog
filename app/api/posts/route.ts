import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, and, sql, desc, inArray, ilike, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function generateUniqueSlug(title: string, currentPosts: { slug: string; id: string }[], excludeId?: string): string {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .trim()
    .replace(/\s+/g, '-'); // replace spaces with dashes
    
  if (!baseSlug) {
    baseSlug = 'untitled-post';
  }

  let slug = baseSlug;
  let matches = currentPosts.filter(p => p.slug === slug && p.id !== excludeId);
  let counter = 1;

  while (matches.length > 0) {
    slug = `${baseSlug}-${counter}`;
    matches = currentPosts.filter(p => p.slug === slug && p.id !== excludeId);
    counter++;
  }

  return slug;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // draft | published | scheduled | all
    const categoryId = searchParams.get('category_id');
    const search = searchParams.get('search');
    const tagSlug = searchParams.get('tag');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const excludeContent = searchParams.get('excludeContent') === 'true';

    const conditions = [];

    // Filter by status
    if (status && status !== 'all') {
      conditions.push(eq(schema.posts.status, status));
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

    // Fetch database layers using limit and offset and total count in parallel
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
        content: excludeContent ? schema.posts.summary : schema.posts.content, // Fallback sumary instead of content to save memory
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
    
    // Fetch related categories and tags in parallel
    const [categoriesList, postTagsListResult] = await Promise.all([
      activeCategoryIds.length > 0 
        ? db.select().from(schema.categories).where(inArray(schema.categories.id, activeCategoryIds)) 
        : Promise.resolve([]),
      postIds.length > 0
        ? db.select().from(schema.postTags).where(inArray(schema.postTags.postId, postIds))
        : Promise.resolve([])
    ]);

    let tagsList: any[] = [];
    if (postTagsListResult.length > 0) {
       const tagIds = postTagsListResult.map(pt => pt.tagId);
       if (tagIds.length > 0) {
         tagsList = await db.select().from(schema.tags).where(inArray(schema.tags.id, tagIds));
       }
    }
    
    const postTagsList = postTagsListResult;

    // Map database structures to API output structures
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

    const postTags = postTagsList.map(pt => ({
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
      published_at: p.publishedAt,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
      category_id: p.categoryId,
      featured_image: p.featuredImage,
      meta_title: p.metaTitle,
      meta_description: p.metaDescription,
      canonical_url: p.canonicalUrl,
      noindex: p.noindex,
      ogImage: p.ogImage,
      views: p.views
    }));

    // Enrich posts with category info & tag arrays
    const enriched = posts.map(post => {
      const category = categories.find(c => c.id === post.category_id);
      const taggedIds = postTags
        .filter(pt => pt.post_id === post.id)
        .map(pt => pt.tag_id);
      const postTagsArray = tags.filter(t => taggedIds.includes(t.id));

      return {
        ...post,
        category,
        tags: postTagsArray
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
  } catch (error) {
    console.error('Fetch posts error:', error);
    return NextResponse.json({ error: 'Failed to retrieve posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
      tagIds, 
      published_at 
    } = data;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Fetch lists for unique slug checking
    const postsList = await db.select().from(schema.posts);
    const categoriesList = await db.select().from(schema.categories);
    const tagsList = await db.select().from(schema.tags);

    const newId = `post-${Date.now()}`;
    const calculatedSlug = generateUniqueSlug(title, postsList);

    let pubDate: string | null = null;
    if (status === 'published') {
      pubDate = published_at || new Date().toISOString();
    } else if (status === 'scheduled') {
      pubDate = published_at || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // Default 2 days forward
    }

    // Default category ID if none is supplied
    const fallbackCategory = categoriesList[0]?.id || '';
    const activeCategory = category_id || fallbackCategory;

    const newPost = {
      id: newId,
      title,
      slug: calculatedSlug,
      content: content || '',
      summary: summary || '',
      status: (status || 'draft') as 'draft' | 'published' | 'scheduled',
      publishedAt: pubDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      categoryId: activeCategory,
      featuredImage: featured_image || 'samples/typography_banner',
      metaTitle: meta_title || title,
      metaDescription: meta_description || summary || '',
      canonicalUrl: canonical_url || '',
      noindex: noindex || 0,
      ogImage: og_image || '',
      views: 0
    };

    // Insert post
    await db.insert(schema.posts).values(newPost);

    // Save linked tags
    if (tagIds && Array.isArray(tagIds)) {
      for (const tagId of tagIds) {
        await db.insert(schema.postTags).values({
          postId: newId,
          tagId: tagId
        });
      }
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
      published_at: newPost.publishedAt,
      created_at: newPost.createdAt,
      updated_at: newPost.updatedAt,
      category_id: newPost.categoryId,
      featured_image: newPost.featuredImage,
      meta_title: newPost.metaTitle,
      meta_description: newPost.metaDescription,
      canonical_url: newPost.canonicalUrl,
      noindex: newPost.noindex,
      ogImage: newPost.ogImage,
      views: newPost.views,
      category: matchedCategory,
      tags: matchedTags
    }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
