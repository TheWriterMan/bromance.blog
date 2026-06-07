import { Metadata } from 'next';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect, permanentRedirect } from 'next/navigation';
import PostPageWrapper from './PostPageWrapper';
import { cache } from 'react';

const getPostBySlug = cache(async (slug: string) => {
  const posts = await db.select().from(schema.posts).where(eq(schema.posts.slug, slug)).limit(1);
  return posts[0];
});

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {};
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bromance.blog';
  const url = `${baseUrl}/${post.slug}`;

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.summary,
    alternates: {
      canonical: post.canonicalUrl || url,
    },
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.summary,
      url,
      type: 'article',
      images: post.ogImage || post.featuredImage ? [{ url: post.ogImage || post.featuredImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.summary,
      images: post.ogImage || post.featuredImage ? [post.ogImage || post.featuredImage] : [],
    },
    robots: {
      index: post.noindex !== 1,
      follow: post.noindex !== 1,
      nocache: post.noindex === 1,
    },
  };
}

export default async function PostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  
  const post = await getPostBySlug(params.slug);

  if (!post || post.status !== 'published') {
    const redirection = await db.select().from(schema.redirects).where(eq(schema.redirects.source, params.slug)).limit(1);
    const redir = redirection[0];
    if (redir) {
      if (redir.permanent === 1) permanentRedirect(`/${redir.destination}`);
      else redirect(`/${redir.destination}`);
    }
    notFound();
  }

  // Load category, tags, and author in parallel
  let authorData = { displayName: 'Amy97', slug: 'amy97' };
  const [categoriesList, joinedTags] = await Promise.all([
    db.select().from(schema.categories).where(eq(schema.categories.id, post.categoryId || '')),
    db.select({
      id: schema.tags.id,
      name: schema.tags.name,
      slug: schema.tags.slug,
    })
    .from(schema.postTags)
    .innerJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id))
    .where(eq(schema.postTags.postId, post.id))
  ]);

  // Fetch author (non-blocking — fallback to default if table missing)
  try {
    const authorRows = await db.select().from(schema.authors).limit(1);
    if (authorRows[0]) {
      authorData = { displayName: authorRows[0].displayName, slug: authorRows[0].slug };
    }
  } catch {}
  
  const category = categoriesList[0] || null;

  const frontendPost = {
    ...post,
    published_at: post.publishedAt,
    featured_image: post.featuredImage,
    category,
    tags: joinedTags,
    author: authorData,
  };

  const jsonLd: any[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.metaTitle || post.title,
      description: post.metaDescription || post.summary,
      image: post.ogImage || post.featuredImage || '',
      author: {
        '@type': 'Person',
        name: authorData.displayName,
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/author/${authorData.slug}`
      },
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${process.env.NEXT_PUBLIC_SITE_URL}/${post.slug}`
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: process.env.NEXT_PUBLIC_SITE_URL
        },
        category ? {
          '@type': 'ListItem',
          position: 2,
          name: category.name,
          item: `${process.env.NEXT_PUBLIC_SITE_URL}/category/${category.slug}`
        } : null,
        {
          '@type': 'ListItem',
          position: category ? 3 : 2,
          name: post.title,
          item: `${process.env.NEXT_PUBLIC_SITE_URL}/${post.slug}`
        }
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostPageWrapper post={frontendPost} />
    </>
  );
}
