import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  const postsList = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.status, 'published'));

  const categoriesList = await db.select().from(schema.categories);
  const tagsList = await db.select().from(schema.tags);

  const posts = postsList
    .filter((post) => post.noindex !== 1)
    .map((post) => ({
      url: `${baseUrl}/${post.slug}`,
      lastModified: new Date(post.updatedAt).toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  const categories = categoriesList.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const tags = tagsList.map((tag) => ({
    url: `${baseUrl}/tag/${tag.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...posts,
    ...categories,
    ...tags,
  ];
}
