import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
    const postsList = await db.select().from(schema.posts).where(eq(schema.posts.status, 'published')).orderBy(desc(schema.posts.publishedAt)).limit(20);

    const rssItems = postsList.map((post) => `
      <item>
        <title><![CDATA[${post.title}]]></title>
        <link>${baseUrl}/${post.slug}</link>
        <guid isPermaLink="true">${baseUrl}/${post.slug}</guid>
        <pubDate>${new Date(post.publishedAt || post.createdAt).toUTCString()}</pubDate>
        <description><![CDATA[${post.summary || post.metaDescription}]]></description>
      </item>
    `).join('');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
        <channel>
          <title>Clean Blog CMS</title>
          <link>${baseUrl}</link>
          <description>An elegant, performance-tuned web blog</description>
          <language>en</language>
          <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
          ${rssItems}
        </channel>
      </rss>`;

    return new NextResponse(rssFeed, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate feed' }, { status: 500 });
  }
}
