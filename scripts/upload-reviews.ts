import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../lib/schema';

const DATABASE_URL = process.env.DATABASE_URL || '';

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function uploadReviews() {
  console.log('Connecting to database...');
  const sql = postgres(DATABASE_URL, { prepare: false, max: 1 });
  const db = drizzle(sql, { schema });

  const listHtml = fs.readFileSync(path.join(process.cwd(), 'lists', 'Everything-Reviews-6445f1eb0446.html'), 'utf-8');
  const $list = cheerio.load(listHtml);
  
  const postIds: string[] = [];
  $list('li[data-field="post"] a').each((_, el) => {
    const href = $list(el).attr('href');
    if (href) {
      const parts = href.split('/');
      postIds.push(parts[parts.length - 1]);
    }
  });

  console.log('Found post IDs in list:', postIds);

  const postsDir = path.join(process.cwd(), 'posts');
  const allPostFiles = fs.readdirSync(postsDir);

  const matchedFiles = postIds.map(id => {
    return allPostFiles.find(file => file.includes(id));
  }).filter(Boolean) as string[];

  console.log(`Found ${matchedFiles.length} matching HTML files.`);

  let categoryId = 'reviews-cat';
  await db.insert(schema.categories).values({
    id: categoryId,
    name: 'Reviews',
    slug: 'reviews',
    description: 'Everything Reviews Category'
  }).onConflictDoNothing();

  console.log('Replacing existing posts in database...');
  await db.delete(schema.postRevisions);
  await db.delete(schema.postTags);
  await db.delete(schema.posts);

  let insertedCount = 0;

  for (const file of matchedFiles) {
    const postHtml = fs.readFileSync(path.join(postsDir, file), 'utf-8');
    const $ = cheerio.load(postHtml);

    const title = $('.p-name').first().text().trim() || 'Untitled';
    const postSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let summary = $('.p-summary').first().text().trim();
    if (!summary) summary = 'A review post.';

    const originalPublishedAt = $('time.dt-published').attr('datetime');

    const rawContent = $('.e-content').html() || '';
    const $content = cheerio.load(rawContent, null, false);
    
    $content('.graf--title').remove();
    $content('.graf--subtitle').remove();
    $content('.section-divider').remove();
    
    $content('img').each((_, img) => {
      $content(img).addClass('w-full h-auto rounded-lg my-6');
      $content(img).removeAttr('width');
      $content(img).removeAttr('height');
      $content(img).removeAttr('data-width');
      $content(img).removeAttr('data-height');
    });

    const contentHtml = $content.html() || '';
    
    let featuredImg = '';
    const firstImgUrl = $('.e-content img').first().attr('src');
    if (firstImgUrl) {
      featuredImg = firstImgUrl;
    } else {
      featuredImg = 'https://picsum.photos/seed/review/800/600';
    }

    const postId = file.split('.html')[0].slice(-12);

    await db.insert(schema.posts).values({
      id: postId,
      title: title,
      slug: postSlug + '-' + postId,
      content: contentHtml,
      summary: summary,
      status: 'published',
      publishedAt: originalPublishedAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      categoryId: categoryId,
      featuredImage: featuredImg,
      metaTitle: title,
      metaDescription: summary.substring(0, 150),
      canonicalUrl: `/post/${postSlug}-${postId}`,
      views: 0
    });
    
    insertedCount++;
    console.log(`Inserted post: ${title}`);
  }

  console.log(`Successfully uploaded ${insertedCount} posts.`);
  await sql.end();
}

uploadReviews().catch(err => {
  console.error('Failed to upload reviews:', err);
  process.exit(1);
});
