import { NextRequest, NextResponse } from 'next/server';
import { db, generateId } from '@repo/db';
import * as schema from '@repo/db';
import { eq, or, and, sql, isNull } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

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
      .where(and(
        or(eq(schema.posts.id, id), eq(schema.posts.slug, id)),
        isNull(schema.posts.deletedAt)
      ))
      .limit(1);

    if (matchedPosts.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = matchedPosts[0];

    // Fire category, tags queries in parallel
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

    // Increment view count in background (fire and forget)
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
      published_at: post.publishedAt?.toISOString() ?? null,
      created_at: post.createdAt.toISOString(),
      updated_at: post.updatedAt.toISOString(),
      category_id: post.categoryId,
      featured_image: post.featuredImage,
      meta_title: post.metaTitle,
      meta_description: post.metaDescription,
      canonical_url: post.canonicalUrl,
      noindex: post.noindex,
      ogImage: post.ogImage,
      discussion_open: post.discussionOpen,
      type: post.type,
      meta: post.meta,
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
  const denied = requireAuth(req);
  if (denied) return denied;

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
      discussion_open,
      type,
      meta,
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

    // Handle checkpoint/revision snapshots
    const { createCheckpoint, checkpointNote } = data;
    
    if (createCheckpoint) {
      const newRevision = {
        id: generateId(),
        postId: oldPost.id,
        title: oldPost.title || title || 'Untitled Checkpoint',
        content: oldPost.content || content || '',
        updatedBy: checkpointNote || 'Manual snapshot checkpoint',
        createdAt: new Date(),
      };
      
      await db.insert(schema.postRevisions).values(newRevision);
      
      // Limit to 20 snapshots maximum
      const postRevs = await db
        .select()
        .from(schema.postRevisions)
        .where(eq(schema.postRevisions.postId, oldPost.id));
      
      if (postRevs.length > 20) {
        postRevs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const toDeleteId = postRevs[0].id;
        await db.delete(schema.postRevisions).where(eq(schema.postRevisions.id, toDeleteId));
      }
    }

    const now = new Date();
    let pubDate = oldPost.publishedAt;
    if (status !== undefined) {
      if (status === 'published') {
        pubDate = published_at ? new Date(published_at) : oldPost.publishedAt || now;
      } else if (status === 'scheduled') {
        pubDate = published_at ? new Date(published_at) : oldPost.publishedAt || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      } else {
        // Draft: preserve any date the user already picked (for future scheduling)
        pubDate = published_at ? new Date(published_at) : oldPost.publishedAt || null;
      }
    }

    // Determine unique slug
    let finalSlug = oldPost.slug;
    let oldSlug: string | null = null;
    if (title && title !== oldPost.title) {
      oldSlug = finalSlug;
      const candidateSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-') || 'untitled-post';
      const conflicts = await db
        .select({ slug: schema.posts.slug })
        .from(schema.posts)
        .where(and(eq(schema.posts.slug, candidateSlug), sql`${schema.posts.id} != ${oldPost.id}`))
        .limit(1);
      finalSlug = conflicts.length > 0 ? `${candidateSlug}-${generateId()}` : candidateSlug;
    } else if (slug && slug !== oldPost.slug) {
      oldSlug = finalSlug;
      const conflicts = await db
        .select({ slug: schema.posts.slug })
        .from(schema.posts)
        .where(and(eq(schema.posts.slug, slug), sql`${schema.posts.id} != ${oldPost.id}`))
        .limit(1);
      finalSlug = conflicts.length > 0 ? `${slug}-${generateId()}` : slug;
    }
    
    if (oldSlug && oldSlug !== finalSlug) {
      await db.insert(schema.redirects).values({
        id: generateId(),
        source: oldSlug,
        destination: finalSlug,
        permanent: true,
        createdAt: now,
      }).onConflictDoUpdate({
        target: schema.redirects.source,
        set: { destination: finalSlug, createdAt: now },
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
      categoryId: category_id !== undefined ? (category_id || null) : oldPost.categoryId,
      featuredImage: featured_image !== undefined ? featured_image : oldPost.featuredImage,
      metaTitle: meta_title !== undefined ? meta_title : oldPost.metaTitle,
      metaDescription: meta_description !== undefined ? meta_description : oldPost.metaDescription,
      canonicalUrl: canonical_url !== undefined ? canonical_url : oldPost.canonicalUrl,
      noindex: noindex !== undefined ? noindex : oldPost.noindex,
      ogImage: og_image !== undefined ? og_image : oldPost.ogImage,
      discussionOpen: discussion_open !== undefined ? discussion_open : oldPost.discussionOpen,
      type: type !== undefined ? type : oldPost.type,
      meta: meta !== undefined ? meta : oldPost.meta,
      updatedAt: now,
    };

    await db
      .update(schema.posts)
      .set(updatePayload)
      .where(eq(schema.posts.id, id));

    // Sync Tag association link table
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
      published_at: updatePayload.publishedAt?.toISOString() ?? null,
      created_at: oldPost.createdAt.toISOString(),
      updated_at: updatePayload.updatedAt.toISOString(),
      category_id: updatePayload.categoryId,
      featured_image: updatePayload.featuredImage,
      meta_title: updatePayload.metaTitle,
      meta_description: updatePayload.metaDescription,
      canonical_url: updatePayload.canonicalUrl,
      noindex: updatePayload.noindex,
      ogImage: updatePayload.ogImage,
      discussion_open: updatePayload.discussionOpen,
      type: updatePayload.type,
      meta: updatePayload.meta,
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
  const denied = requireAuth(req);
  if (denied) return denied;

  const params = await props.params;
  try {
    const id = params.id;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      // Hard delete — actually remove from database
      await db.delete(schema.postRevisions).where(eq(schema.postRevisions.postId, id));
      await db.delete(schema.postTags).where(eq(schema.postTags.postId, id));
      await db.delete(schema.postLikes).where(eq(schema.postLikes.postId, id));
      await db.delete(schema.comments).where(eq(schema.comments.postId, id));
      await db.delete(schema.posts).where(eq(schema.posts.id, id));
    } else {
      // Soft delete — set deleted_at timestamp
      await db
        .update(schema.posts)
        .set({ deletedAt: new Date() })
        .where(eq(schema.posts.id, id));
    }

    return NextResponse.json({ success: true, message: permanent ? 'Post permanently deleted' : 'Post moved to trash' });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
