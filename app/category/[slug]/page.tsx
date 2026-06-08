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
  const categoriesList = await db.select().from(schema.categories).where(eq(schema.categories.slug, params.slug)).limit(1);
  const category = categoriesList[0];

  if (!category) {
    return {};
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bromance.blog';

  return {
    title: category.name,
    description: category.description || `Browse posts in the ${category.name} category.`,
    alternates: {
      canonical: `${baseUrl}/category/${category.slug}`,
    },
    openGraph: {
      title: category.name,
      description: category.description || `Browse posts in the ${category.name} category.`,
      url: `${baseUrl}/category/${category.slug}`,
      type: 'website',
    },
  };
}

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const categoriesList = await db.select().from(schema.categories).where(eq(schema.categories.slug, params.slug)).limit(1);
  const category = categoriesList[0];

  if (!category) {
    notFound();
  }

  return (
    <Blog initialCategory={category.id} />
  );
}
