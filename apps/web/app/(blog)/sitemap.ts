import type { MetadataRoute } from 'next';
import {
  getAllPublishedSlugs,
  getCategories,
  getAuthor,
  getSiteSettings,
  getNovelChapters,
} from '@/lib/blog-data';

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, categories, author, settings, novelChapters] = await Promise.all([
    getAllPublishedSlugs(),
    getCategories(),
    getAuthor(),
    getSiteSettings(),
    getNovelChapters(),
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

  // Novel chapters are plain posts served at /novels/<slug>.
  const novelRoutes: MetadataRoute.Sitemap = novelChapters.map((ch) => ({
    url: `${base}/novels/${ch.slug}`,
    lastModified: ch.publishedAt ? new Date(ch.publishedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...novelRoutes];
}
