import { notFound, permanentRedirect } from 'next/navigation';
import { db } from '@repo/db';
import * as schema from '@repo/db';
import { eq } from 'drizzle-orm';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Universal legacy resolver.
// Redirects /<slug> → /articles/<slug> or /novels/<slug> based on post type.
// permanentRedirect must NOT be inside try/catch (it throws a Next.js signal).

function destinationFor(type: string, slug: string): string {
  return type === 'novels' ? `/novels/${slug}` : `/articles/${slug}`;
}

export default async function LegacySlugResolver({ params }: PageProps) {
  const { slug } = await params;

  // 1. Look up the post by slug (any type, published).
  const rows = await db
    .select({ type: schema.posts.type, slug: schema.posts.slug })
    .from(schema.posts)
    .where(eq(schema.posts.slug, slug))
    .limit(1);

  const post = rows[0] ?? null;
  if (post) {
    permanentRedirect(destinationFor(post.type, post.slug));
  }

  // 2. Consult the redirects table (slug-change redirects).
  const redirectRows = await db
    .select({ destination: schema.redirects.destination })
    .from(schema.redirects)
    .where(eq(schema.redirects.source, slug))
    .limit(1);

  const destination = redirectRows[0]?.destination ?? null;
  if (destination) {
    const destRows = await db
      .select({ type: schema.posts.type, slug: schema.posts.slug })
      .from(schema.posts)
      .where(eq(schema.posts.slug, destination))
      .limit(1);

    const destPost = destRows[0] ?? null;
    if (destPost) {
      permanentRedirect(destinationFor(destPost.type, destPost.slug));
    }
  }

  notFound();
}
