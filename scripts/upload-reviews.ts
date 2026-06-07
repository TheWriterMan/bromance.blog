import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../lib/schema';
import { sql } from 'drizzle-orm';

const DATABASE_URL = 'postgresql://neondb_owner:npg_UqiSo0RFnB2f@ep-young-dew-aprss0dh.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function uploadReviews() {
  console.log('Connecting to Neon database at:', DATABASE_URL);
  const db = drizzle(neon(DATABASE_URL), { schema });

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

  // We need a category ID to assign. Let's fetch one or define one.
  // "Everything Reviews" -> maybe create or use "reviews" category
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
    
    // Remove duplicated titles and subtitles
    $content('.graf--title').remove();
    $content('.graf--subtitle').remove();
    
    // Remove unnecessary section dividers
    $content('.section-divider').remove();
    
    // Make images responsive
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
      slug: postSlug + '-' + postId, // ensure unique
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
}

uploadReviews().catch(err => {
  console.error('Failed to upload reviews:', err);
  process.exit(1);
});
