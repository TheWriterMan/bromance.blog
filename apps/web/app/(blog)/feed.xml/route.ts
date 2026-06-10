import { NextResponse } from 'next/server';
import { getPublishedPosts, getSiteSettings } from '@/lib/blog-data';
import { extractPlainText } from '@/lib/tiptap-html';

export const revalidate = 600;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const [{ posts }, settings] = await Promise.all([
    getPublishedPosts({ limit: 50 }),
    getSiteSettings(),
  ]);
  const base = settings.siteUrl.replace(/\/$/, '');

  const items = posts
    .map((p) => {
      const link = `${base}/${p.slug}`;
      const description = p.summary || extractPlainText(p.content, 200);
      const pubDate = p.publishedAt ? new Date(p.publishedAt).toUTCString() : '';
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(description)}</description>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
      ${p.category ? `<category>${escapeXml(p.category.name)}</category>` : ''}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(settings.siteName)}</title>
    <link>${escapeXml(base)}</link>
    <description>${escapeXml(settings.description)}</description>
    <language>en</language>
    <atom:link href="${escapeXml(base)}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  });
}
