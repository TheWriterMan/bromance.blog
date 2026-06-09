import type { MetadataRoute } from 'next';

// TODO: Will expand when blog frontend is built
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/cms/',
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bromance.blog'}/sitemap.xml`,
  };
}
