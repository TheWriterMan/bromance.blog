import { notFound, permanentRedirect } from 'next/navigation';
import { db } from '@repo/db';
import * as schema from '@repo/db';
import { eq } from 'drizzle-orm';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// This page is a universal legacy resolver.
// It redirects /<slug> → /articles/<slug> or /novels/<workSlug>/<chapterSlug>.
// permanentRedirect must NOT be inside try/catch (it throws a special Next.js signal).

export default async function LegacySlugResolver({ params }: PageProps) {
  const { slug } = await params;

  // 1. Look up the post by slug (any type, published, not deleted).
  const rows = await db
    .select({
      id: schema.posts.id,
      type: schema.posts.type,
      slug: schema.posts.slug,
      collectionId: schema.posts.collectionId,
    })
    .from(schema.posts)
    .where(eq(schema.posts.slug, slug))
    .limit(1);

  const post = rows[0] ?? null;

  if (post) {
    if (post.type === 'article') {
      permanentRedirect(`/articles/${post.slug}`);
    }

    if (post.type === 'novels') {
      // Resolve the work slug from the collection.
      if (post.collectionId) {
        const collRows = await db
          .select({ slug: schema.collections.slug })
          .from(schema.collections)
          .where(eq(schema.collections.id, post.collectionId))
          .limit(1);
        const workSlug = collRows[0]?.slug;
        if (workSlug) {
          permanentRedirect(`/novels/${workSlug}/${post.slug}`);
        }
      }
      // Collection not found — fall through to redirects table check below.
    }
  }

  // 2. Consult the redirects table (slug-change redirects).
  const redirectRows = await db
    .select({ destination: schema.redirects.destination })
    .from(schema.redirects)
    .where(eq(schema.redirects.source, slug))
    .limit(1);

  const destination = redirectRows[0]?.destination ?? null;

  if (destination) {
    // destination is a slug — look it up to determine the typed URL.
    const destRows = await db
      .select({
        id: schema.posts.id,
        type: schema.posts.type,
        slug: schema.posts.slug,
        collectionId: schema.posts.collectionId,
      })
      .from(schema.posts)
      .where(eq(schema.posts.slug, destination))
      .limit(1);

    const destPost = destRows[0] ?? null;

    if (destPost) {
      if (destPost.type === 'article') {
        permanentRedirect(`/articles/${destPost.slug}`);
      }
      if (destPost.type === 'novels') {
        if (destPost.collectionId) {
          const collRows = await db
            .select({ slug: schema.collections.slug })
            .from(schema.collections)
            .where(eq(schema.collections.id, destPost.collectionId))
            .limit(1);
          const workSlug = collRows[0]?.slug;
          if (workSlug) {
            permanentRedirect(`/novels/${workSlug}/${destPost.slug}`);
          }
        }
      }
      // Unknown type — redirect to the articles prefix as a best-effort.
      permanentRedirect(`/articles/${destPost.slug}`);
    }
  }

  notFound();
}
