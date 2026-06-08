import { Metadata } from 'next';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Blog from '@/components/blog';

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const tagsList = await db.select().from(schema.tags).where(eq(schema.tags.slug, params.slug)).limit(1);
  const tag = tagsList[0];

  if (!tag) {
    return {};
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bromance.blog';

  return {
    title: tag.name,
    description: `Browse posts tagged with ${tag.name}.`,
    alternates: {
      canonical: `${baseUrl}/tag/${tag.slug}`,
    },
    openGraph: {
      title: tag.name,
      description: `Browse posts tagged with ${tag.name}.`,
      url: `${baseUrl}/tag/${tag.slug}`,
      type: 'website',
    },
  };
}

export default async function TagPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const tagsList = await db.select().from(schema.tags).where(eq(schema.tags.slug, params.slug)).limit(1);
  const tag = tagsList[0];

  if (!tag) {
    notFound();
  }

  return (
    <Blog initialTag={tag.slug} />
  );
}
