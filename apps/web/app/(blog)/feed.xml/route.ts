import { NextResponse } from 'next/server';

// TODO: Will expand when blog frontend is built
export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Bromance</title>
    <link>https://bromance.blog</link>
    <description>Coming soon</description>
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
