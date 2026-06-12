import type { MetadataRoute } from 'next';
import {
  getAllPublishedSlugs,
  getCategories,
  getAuthor,
  getSiteSettings,
  getCollections,
  getCollectionBySlug,
} from '@/lib/blog-data';

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, categories, author, settings, works] = await Promise.all([
    getAllPublishedSlugs(),
    getCategories(),
    getAuthor(),
    getSiteSettings(),
    getCollections('novels'),
  ]);
  const base = settings.siteUrl.replace(/\/$/, '');

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/novels`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/author/${author.slug}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ];

  const postRoutes: MetadataRoute.Sitemap = slugs.map((p) => ({
    url: `${base}/articles/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Novel routes: /novels/<workSlug> + /novels/<workSlug>/<chapterSlug>
  const novelRoutes: MetadataRoute.Sitemap = [];
  for (const work of works) {
    novelRoutes.push({
      url: `${base}/novels/${work.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    });

    const workData = await getCollectionBySlug(work.slug);
    if (workData) {
      for (const ch of workData.chapters) {
        novelRoutes.push({
          url: `${base}/novels/${work.slug}/${ch.slug}`,
          lastModified: ch.publishedAt ? new Date(ch.publishedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }
  }

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...novelRoutes];
}
