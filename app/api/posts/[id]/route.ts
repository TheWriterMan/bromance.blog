import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, or, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const id = params.id;
    const { searchParams } = new URL(req.url);
    const incrementView = searchParams.get('inc_view') === 'true';

    // Query post by database id or slug URL parameter
    const matchedPosts = await db
      .select()
      .from(schema.posts)
      .where(or(eq(schema.posts.id, id), eq(schema.posts.slug, id)))
      .limit(1);

    if (matchedPosts.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = matchedPosts[0];

    // Fire category, tags queries in parallel (not sequentially)
    const [categoriesList, joinedTags] = await Promise.all([
      db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.id, post.categoryId || '')),
      db
        .select({
          id: schema.tags.id,
          name: schema.tags.name,
          slug: schema.tags.slug
        })
        .from(schema.postTags)
        .innerJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id))
        .where(eq(schema.postTags.postId, post.id)),
    ]);

    // Increment view count in background (don't await — fire and forget)
    if (incrementView) {
      db.update(schema.posts)
        .set({ views: (post.views || 0) + 1 })
        .where(eq(schema.posts.id, post.id))
        .then(() => {})
        .catch((e) => console.error('View increment failed:', e));
      post.views = (post.views || 0) + 1;
    }

    const category = categoriesList[0] || null;

    return NextResponse.json({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      summary: post.summary,
      status: post.status,
      published_at: post.publishedAt,
      created_at: post.createdAt,
      updated_at: post.updatedAt,
      category_id: post.categoryId,
      featured_image: post.featuredImage,
      meta_title: post.metaTitle,
      meta_description: post.metaDescription,
      canonical_url: post.canonicalUrl,
      noindex: post.noindex,
      ogImage: post.ogImage,
      views: post.views,
      category,
      tags: joinedTags
    });
  } catch (error) {
    console.error('Fetch post detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const id = params.id;
    const data = await req.json();
    const {
      title,
      slug,
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

    // Find existing post
    const matchedPosts = await db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.id, id))
      .limit(1);

    if (matchedPosts.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const oldPost = matchedPosts[0];

    // Handle Checkpoint creations/manual saving revision snapshots
    const { createCheckpoint, checkpointNote } = data;
    
    if (createCheckpoint) {
      const newRevision = {
        id: `rev-${Date.now()}`,
        postId: oldPost.id,
        title: oldPost.title || title || 'Untitled Checkpoint',
        content: oldPost.content || content || '',
        updatedBy: checkpointNote || 'Manual snapshot checkpoint',
        createdAt: new Date().toISOString()
      };
      
      await db.insert(schema.postRevisions).values(newRevision);
      
      // Limit to 20 snapshots maximum
      const postRevs = await db
        .select()
        .from(schema.postRevisions)
        .where(eq(schema.postRevisions.postId, oldPost.id));
      
      if (postRevs.length > 20) {
        postRevs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const toDeleteId = postRevs[0].id;
        await db.delete(schema.postRevisions).where(eq(schema.postRevisions.id, toDeleteId));
      }
    }

    let pubDate = oldPost.publishedAt;
    if (status !== undefined) {
      if (status === 'published') {
        pubDate = published_at || oldPost.publishedAt || new Date().toISOString();
      } else if (status === 'scheduled') {
        pubDate = published_at || oldPost.publishedAt || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        pubDate = null;
      }
    }

    // Determine unique slug (targeted query instead of fetching all posts)
    let finalSlug = oldPost.slug;
    let oldSlug = null;
    if (title && title !== oldPost.title) {
      oldSlug = finalSlug;
      const candidateSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-') || 'untitled-post';
      // Check if candidate slug is taken by another post
      const conflicts = await db
        .select({ slug: schema.posts.slug })
        .from(schema.posts)
        .where(and(eq(schema.posts.slug, candidateSlug), sql`${schema.posts.id} != ${oldPost.id}`))
        .limit(1);
      finalSlug = conflicts.length > 0 ? `${candidateSlug}-${Date.now()}` : candidateSlug;
    } else if (slug && slug !== oldPost.slug) {
      oldSlug = finalSlug;
      const conflicts = await db
        .select({ slug: schema.posts.slug })
        .from(schema.posts)
        .where(and(eq(schema.posts.slug, slug), sql`${schema.posts.id} != ${oldPost.id}`))
        .limit(1);
      finalSlug = conflicts.length > 0 ? `${slug}-${Date.now()}` : slug;
    }
    
    if (oldSlug && oldSlug !== finalSlug) {
      // Upsert: update destination if a redirect from this source already exists
      await db.insert(schema.redirects).values({
        id: `redir-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        source: oldSlug,
        destination: finalSlug,
        permanent: 1,
        createdAt: new Date().toISOString()
      }).onConflictDoUpdate({
        target: schema.redirects.source,
        set: { destination: finalSlug, createdAt: new Date().toISOString() },
      });
    }

    // Update in database
    const updatePayload = {
      title: title !== undefined ? title : oldPost.title,
      slug: finalSlug,
      content: content !== undefined ? content : oldPost.content,
      summary: summary !== undefined ? summary : oldPost.summary,
      status: (status !== undefined ? status : oldPost.status) as 'draft' | 'published' | 'scheduled',
      publishedAt: pubDate,
      categoryId: category_id !== undefined ? category_id : oldPost.categoryId,
      featuredImage: featured_image !== undefined ? featured_image : oldPost.featuredImage,
      metaTitle: meta_title !== undefined ? meta_title : oldPost.metaTitle,
      metaDescription: meta_description !== undefined ? meta_description : oldPost.metaDescription,
      canonicalUrl: canonical_url !== undefined ? canonical_url : oldPost.canonicalUrl,
      noindex: noindex !== undefined ? noindex : oldPost.noindex,
      ogImage: og_image !== undefined ? og_image : oldPost.ogImage,
      updatedAt: new Date().toISOString()
    };

    await db
      .update(schema.posts)
      .set(updatePayload)
      .where(eq(schema.posts.id, id));

    // Sync Tag association link table (batch insert instead of sequential)
    if (tagIds && Array.isArray(tagIds)) {
      await db.delete(schema.postTags).where(eq(schema.postTags.postId, oldPost.id));
      if (tagIds.length > 0) {
        await db.insert(schema.postTags).values(
          tagIds.map((tagId: string) => ({ postId: oldPost.id, tagId }))
        );
      }
    }

    // Fetch the updated result
    const updatedCategories = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, updatePayload.categoryId || ''));
    const category = updatedCategories[0] || null;

    const updatedTags = await db
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
        slug: schema.tags.slug
      })
      .from(schema.postTags)
      .innerJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id))
      .where(eq(schema.postTags.postId, oldPost.id));

    return NextResponse.json({
      id: oldPost.id,
      title: updatePayload.title,
      slug: updatePayload.slug,
      content: updatePayload.content,
      summary: updatePayload.summary,
      status: updatePayload.status,
      published_at: updatePayload.publishedAt,
      created_at: oldPost.createdAt,
      updated_at: updatePayload.updatedAt,
      category_id: updatePayload.categoryId,
      featured_image: updatePayload.featuredImage,
      meta_title: updatePayload.metaTitle,
      meta_description: updatePayload.metaDescription,
      canonical_url: updatePayload.canonicalUrl,
      noindex: updatePayload.noindex,
      ogImage: updatePayload.ogImage,
      views: oldPost.views,
      category,
      tags: updatedTags
    });
  } catch (error: any) {
    console.error('Update post error:', error?.message || error, error?.code || '', error?.detail || '');
    return NextResponse.json({ error: 'Failed to update post', detail: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const id = params.id;
    
    // In database, cascade deletes are mapped or we can delete references explicitly to be 100% safe
    await db.delete(schema.postRevisions).where(eq(schema.postRevisions.postId, id));
    await db.delete(schema.postTags).where(eq(schema.postTags.postId, id));
    await db.delete(schema.posts).where(eq(schema.posts.id, id));

    return NextResponse.json({ success: true, message: 'Post successfully deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
