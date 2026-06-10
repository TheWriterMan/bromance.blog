/**
 * Import script: Markdown/Everything-Reviews → Supabase
 *
 * Creates: 1 author, 1 category, 5 tags, 36 media_items, 7 posts + post_tags
 *
 * Run: cd apps/web && DATABASE_URL="..." npx tsx ../../scripts/import-reviews.ts
 */

import postgres from 'postgres';
import { marked } from 'marked';
import { customAlphabet } from 'nanoid';
import * as fs from 'fs';
import * as path from 'path';

// ─── Config ──────────────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres.whlhkshlhantpsbqohaz:FalnVKSVAkCUtw2s@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '436427533766122';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'CCf-JYwGF-SGn4P6jnvfXoOC-CE';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dtperak4e';

const REVIEWS_DIR = path.resolve(__dirname, '../Markdown/Everything-Reviews');

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);
function generateId(): string { return nanoid(); }

// ─── DB Connection ───────────────────────────────────────────────────────────

const sql = postgres(DATABASE_URL, { prepare: false, ssl: 'require', max: 5 });

// ─── Frontmatter Parser ──────────────────────────────────────────────────────

interface Frontmatter {
  title: string;
  slug: string;
  date: string;
  updated: string;
  author: string;
  category: string;
  tags: string[];
  summary: string;
  featured_image: string;
  og_image: string;
  canonical_url: string;
  status: string;
}

function parseFrontmatter(raw: string): { frontmatter: Frontmatter; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('No frontmatter found');

  const fm: any = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Parse arrays
    if (value.startsWith('[')) {
      fm[key] = value.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, ''));
    } else {
      fm[key] = value;
    }
  }

  return { frontmatter: fm as Frontmatter, body: match[2] };
}

// ─── Extract public_id from Cloudinary URL ───────────────────────────────────

function extractPublicId(url: string): string {
  // URL format: https://res.cloudinary.com/dtperak4e/image/upload/bromance-blog/medium-xxx
  const match = url.match(/\/upload\/(.+?)(?:\.\w+)?$/);
  if (match) return match[1];
  // Already a bare public_id
  if (url.startsWith('bromance-blog/')) return url;
  return url;
}

// ─── Markdown → TipTap JSON ──────────────────────────────────────────────────

function markdownToTipTapJSON(md: string): object {
  const tokens = marked.lexer(md);
  const content = tokensToNodes(tokens);
  return { type: 'doc', content };
}

function tokensToNodes(tokens: marked.Token[]): any[] {
  const nodes: any[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'heading':
        nodes.push({
          type: 'heading',
          attrs: { level: token.depth },
          content: inlineToMarks(token.tokens || []),
        });
        break;

      case 'paragraph': {
        const inlineContent = inlineToMarks(token.tokens || []);
        // Check if paragraph contains only an image
        if (inlineContent.length === 1 && inlineContent[0].type === 'image') {
          nodes.push(inlineContent[0]);
        } else if (inlineContent.length > 0) {
          nodes.push({ type: 'paragraph', content: inlineContent });
        } else {
          nodes.push({ type: 'paragraph' });
        }
        break;
      }

      case 'blockquote':
        nodes.push({
          type: 'blockquote',
          content: tokensToNodes(token.tokens || []),
        });
        break;

      case 'list': {
        const listType = token.ordered ? 'orderedList' : 'bulletList';
        const items = (token.items || []).map((item: any) => ({
          type: 'listItem',
          content: tokensToNodes(item.tokens || []),
        }));
        nodes.push({ type: listType, content: items });
        break;
      }

      case 'code':
        nodes.push({
          type: 'codeBlock',
          attrs: { language: token.lang || null },
          content: [{ type: 'text', text: token.text }],
        });
        break;

      case 'hr':
        nodes.push({ type: 'horizontalRule' });
        break;

      case 'space':
        // Skip empty space tokens
        break;

      case 'html': {
        // Ignore raw HTML blocks
        break;
      }

      default:
        // For unknown tokens that have text, wrap in paragraph
        if ('text' in token && (token as any).text) {
          nodes.push({
            type: 'paragraph',
            content: [{ type: 'text', text: (token as any).text }],
          });
        }
        break;
    }
  }

  return nodes;
}

function inlineToMarks(tokens: marked.Token[]): any[] {
  const result: any[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'text': {
        if (token.tokens && token.tokens.length > 0) {
          // Text with nested tokens (like bold/italic inside)
          result.push(...inlineToMarks(token.tokens));
        } else if (token.text) {
          result.push({ type: 'text', text: token.text });
        }
        break;
      }

      case 'strong': {
        const children = inlineToMarks(token.tokens || []);
        for (const child of children) {
          const marks = child.marks || [];
          child.marks = [...marks, { type: 'bold' }];
          result.push(child);
        }
        break;
      }

      case 'em': {
        const children = inlineToMarks(token.tokens || []);
        for (const child of children) {
          const marks = child.marks || [];
          child.marks = [...marks, { type: 'italic' }];
          result.push(child);
        }
        break;
      }

      case 'link': {
        // Check if it's a YouTube link (bare URL on its own)
        const ytMatch = token.href.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (ytMatch && token.tokens?.length === 1 && token.tokens[0].type === 'text' && token.tokens[0].text === token.href) {
          // Bare YouTube URL — render as youtube embed node
          result.push({
            type: 'youtube',
            attrs: { src: token.href, width: 640, height: 480 },
          } as any);
        } else {
          const children = inlineToMarks(token.tokens || []);
          for (const child of children) {
            const marks = child.marks || [];
            child.marks = [...marks, { type: 'link', attrs: { href: token.href, target: '_blank' } }];
            result.push(child);
          }
        }
        break;
      }

      case 'image': {
        result.push({
          type: 'image',
          attrs: { src: token.href, alt: token.text || '' },
        });
        break;
      }

      case 'codespan': {
        result.push({
          type: 'text',
          text: token.text,
          marks: [{ type: 'code' }],
        });
        break;
      }

      case 'br': {
        result.push({ type: 'hardBreak' });
        break;
      }

      case 'escape': {
        result.push({ type: 'text', text: token.text });
        break;
      }

      default: {
        if ('text' in token && (token as any).text) {
          result.push({ type: 'text', text: (token as any).text });
        } else if ('raw' in token && (token as any).raw) {
          result.push({ type: 'text', text: (token as any).raw });
        }
        break;
      }
    }
  }

  return result;
}

// YouTube URLs that appear as bare text in paragraphs (not wrapped in links)
function handleBareYoutubeUrls(doc: any): any {
  if (!doc.content) return doc;

  const newContent: any[] = [];
  for (const node of doc.content) {
    if (node.type === 'paragraph' && node.content?.length === 1) {
      const child = node.content[0];
      if (child.type === 'text') {
        const ytMatch = child.text.match(/^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (ytMatch) {
          newContent.push({
            type: 'youtube',
            attrs: { src: child.text, width: 640, height: 480 },
          });
          continue;
        }
      }
    }
    newContent.push(node);
  }

  return { ...doc, content: newContent };
}

// ─── Cloudinary Metadata Fetcher ─────────────────────────────────────────────

async function getCloudinaryMetadata(publicId: string): Promise<{ width: number; height: number; format: string; bytes: number } | null> {
  const auth = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString('base64');
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image/upload/${publicId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { width: data.width, height: data.height, format: data.format, bytes: data.bytes };
  } catch {
    return null;
  }
}

// ─── Main Import ─────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting import...');

  // Read all markdown files
  const files = fs.readdirSync(REVIEWS_DIR).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} markdown files`);

  const posts: { frontmatter: Frontmatter; body: string; filename: string }[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(REVIEWS_DIR, file), 'utf-8');
    const { frontmatter, body } = parseFrontmatter(raw);
    posts.push({ frontmatter, body, filename: file });
  }

  // ─── Step 1: Create Author ───────────────────────────────────────────────
  const authorId = generateId();
  await sql`
    INSERT INTO authors (id, display_name, slug, bio, avatar_url, created_at, updated_at)
    VALUES (${authorId}, ${'Amy97'}, ${'amy97'}, ${null}, ${null}, NOW(), NOW())
    ON CONFLICT (slug) DO NOTHING
  `;
  console.log('✓ Author created: Amy97');

  // ─── Step 2: Create Category ─────────────────────────────────────────────
  const categoryId = generateId();
  await sql`
    INSERT INTO categories (id, name, slug, description)
    VALUES (${categoryId}, ${'Everything Reviews'}, ${'everything-reviews'}, ${'Drama, movie, and donghua reviews'})
    ON CONFLICT (slug) DO NOTHING
  `;
  // Fetch actual ID in case it already existed
  const [catRow] = await sql`SELECT id FROM categories WHERE slug = 'everything-reviews'`;
  const finalCategoryId = catRow.id;
  console.log('✓ Category created: Everything Reviews');

  // ─── Step 3: Create Tags ─────────────────────────────────────────────────
  const allTags = new Set<string>();
  for (const p of posts) {
    for (const t of p.frontmatter.tags) allTags.add(t);
  }

  const tagMap: Record<string, string> = {}; // slug → id
  for (const tagName of allTags) {
    const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const tagId = generateId();
    await sql`
      INSERT INTO tags (id, name, slug)
      VALUES (${tagId}, ${tagName}, ${tagSlug})
      ON CONFLICT (slug) DO NOTHING
    `;
    const [tagRow] = await sql`SELECT id FROM tags WHERE slug = ${tagSlug}`;
    tagMap[tagName] = tagRow.id;
  }
  console.log(`✓ Tags created: ${[...allTags].join(', ')}`);

  // ─── Step 4: Register Media Items ────────────────────────────────────────
  // Collect all unique Cloudinary public IDs from the posts
  const allPublicIds = new Set<string>();
  for (const p of posts) {
    // Featured image
    const featId = extractPublicId(p.frontmatter.featured_image);
    allPublicIds.add(featId);

    // Images in body
    const imgMatches = p.body.matchAll(/bromance-blog\/medium-[a-f0-9]+/g);
    for (const m of imgMatches) allPublicIds.add(m[0]);
  }

  console.log(`Registering ${allPublicIds.size} media items...`);
  let mediaRegistered = 0;

  for (const publicId of allPublicIds) {
    // Check if already exists
    const [existing] = await sql`SELECT id FROM media_items WHERE cloudinary_id = ${publicId}`;
    if (existing) { mediaRegistered++; continue; }

    const meta = await getCloudinaryMetadata(publicId);
    if (!meta) {
      console.warn(`  ⚠ Could not fetch metadata for: ${publicId}`);
      continue;
    }

    await sql`
      INSERT INTO media_items (id, cloudinary_id, filename, width, height, format, bytes, created_at)
      VALUES (${generateId()}, ${publicId}, ${publicId.split('/').pop() + '.' + meta.format}, ${meta.width}, ${meta.height}, ${meta.format}, ${meta.bytes}, NOW())
    `;
    mediaRegistered++;

    // Rate limit Cloudinary API calls
    if (mediaRegistered % 10 === 0) {
      console.log(`  ... ${mediaRegistered}/${allPublicIds.size} registered`);
      await new Promise(r => setTimeout(r, 500));
    }
  }
  console.log(`✓ Media items registered: ${mediaRegistered}`);

  // ─── Step 5: Insert Posts ────────────────────────────────────────────────
  for (const p of posts) {
    const { frontmatter, body } = p;

    // Convert markdown body → TipTap JSON
    let doc = markdownToTipTapJSON(body);
    doc = handleBareYoutubeUrls(doc);

    const content = JSON.stringify(doc);
    const featuredImage = extractPublicId(frontmatter.featured_image);
    const ogImage = extractPublicId(frontmatter.og_image);
    const postId = generateId();
    const publishedAt = new Date(frontmatter.date);
    const updatedAt = new Date(frontmatter.updated);

    await sql`
      INSERT INTO posts (
        id, title, slug, content, summary, status,
        published_at, created_at, updated_at,
        category_id, featured_image,
        meta_title, meta_description, canonical_url,
        views, noindex, og_image, discussion_open, type, meta
      ) VALUES (
        ${postId}, ${frontmatter.title}, ${frontmatter.slug}, ${content}, ${frontmatter.summary}, ${frontmatter.status},
        ${publishedAt}, ${publishedAt}, ${updatedAt},
        ${finalCategoryId}, ${featuredImage},
        ${frontmatter.title}, ${frontmatter.summary}, ${frontmatter.canonical_url},
        ${0}, ${false}, ${ogImage}, ${true}, ${'article'}, ${JSON.stringify({})}
      )
      ON CONFLICT (slug) DO NOTHING
    `;

    // Link tags
    for (const tagName of frontmatter.tags) {
      const tagId = tagMap[tagName];
      if (tagId) {
        await sql`
          INSERT INTO post_tags (post_id, tag_id)
          VALUES (${postId}, ${tagId})
          ON CONFLICT DO NOTHING
        `;
      }
    }

    console.log(`✓ Post imported: ${frontmatter.title}`);
  }

  console.log('\n✅ Import complete!');
  console.log(`   Posts: ${posts.length}`);
  console.log(`   Category: 1`);
  console.log(`   Tags: ${allTags.size}`);
  console.log(`   Media items: ${mediaRegistered}`);

  await sql.end();
  process.exit(0);
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
