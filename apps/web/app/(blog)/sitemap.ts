import type { MetadataRoute } from 'next';

// TODO: Will expand when blog frontend is built
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://bromance.blog',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];
}
