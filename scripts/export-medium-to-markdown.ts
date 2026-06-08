/**
 * Medium HTML → Markdown export script
 *
 * Reads posts from medium/posts/, resolves categories from medium/lists/,
 * maps images to Cloudinary URLs via deterministic SHA-256 hashing,
 * and outputs clean markdown files with full frontmatter.
 *
 * Run with: npx tsx scripts/export-medium-to-markdown.ts
 *
 * Dependencies: cheerio (already in package.json)
 * No network calls. No database. Pure file transformation.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as cheerio from 'cheerio';

// ─── Config ───────────────────────────────────────────────────────────────────

const MEDIUM_DIR = path.join(process.cwd(), 'medium');
const POSTS_DIR = path.join(MEDIUM_DIR, 'posts');
const LISTS_DIR = path.join(MEDIUM_DIR, 'lists');
const OUTPUT_DIR = path.join(process.cwd(), 'Markdown');

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dtperak4e/image/upload/bromance-blog';
const AUTHOR = 'Amy97';

// Category mapping: list filename → category slug (priority order matters)
const LIST_CATEGORY_MAP: [string, string][] = [
  ['Everything-Reviews-6445f1eb0446.html', 'Everything-Reviews'],
  ['Everything-Legal-e0b4bf7022c1.html', 'Everything-Legal'],
  ['Everything-Mysterious-15a72cb1ad53.html', 'Everything-Mysterious'],
  ['History-s-Most-Heinous-Crimes-278c56342388.html', 'Historys-Most-Heinous-Crimes'],
  ['Everything-Tech-3a8934d7ec02.html', 'Everything-Tech'],
  ['Everything-Wellness-a04f81e673a6.html', 'Everything-Wellness'],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sha256First12(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 12);
}

function mediumImgToCloudinary(srcUrl: string): string {
  const hash = sha256First12(srcUrl);
  return `${CLOUDINARY_BASE}/medium-${hash}`;
}

function isExternalMediumImage(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  if (url.includes('cdn-images-1.medium.com')) return true;
  if (url.includes('miro.medium.com')) return true;
  return false;
}

function escapeYaml(str: string): string {
  // Wrap in double quotes; escape internal quotes and backslashes
  return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function slugFromFilename(filename: string): string {
  let slug = filename.replace(/\.html$/, '');
  // Strip date prefix (YYYY-MM-DD_)
  slug = slug.replace(/^\d{4}-\d{2}-\d{2}_/, '');
  // Strip draft_ prefix
  slug = slug.replace(/^draft_/, '');
  // Strip medium ID suffix (last hyphen + hex id)
  slug = slug.replace(/-[a-f0-9]{8,}$/, '');
  // Clean up
  slug = slug.toLowerCase();
  slug = slug.replace(/--+/g, '-');
  slug = slug.replace(/[^a-z0-9-]/g, '');
  slug = slug.replace(/^-+|-+$/g, '');
  return slug;
}

function extractMediumId(filename: string): string {
  const match = filename.match(/([a-f0-9]{8,})\.html$/);
  return match ? match[1] : '';
}

function computeReadingTime(wordCount: number): string {
  const minutes = Math.max(1, Math.ceil(wordCount / 238));
  return `${minutes} min read`;
}

function deriveTags(title: string, content: string, category: string): string[] {
  const tags: string[] = [];
  const lower = (title + ' ' + content).toLowerCase();

  if (title.toLowerCase().startsWith('review:') || title.toLowerCase().startsWith('review ')) {
    tags.push('review');
  }
  if (lower.includes('donghua') || lower.includes('chinese animation')) tags.push('donghua');
  if (lower.includes('k-drama') || lower.includes('k drama') || lower.includes('korean drama')) tags.push('kdrama');
  if (lower.includes('c-drama') || lower.includes('c drama') || lower.includes('chinese drama')) tags.push('cdrama');
  if (lower.includes('manga')) tags.push('manga');
  if (lower.includes('thai drama')) tags.push('thai-drama');
  if (lower.includes('taiwan')) tags.push('taiwanese');
  if (category === 'Everything-Mysterious' || category === 'Historys-Most-Heinous-Crimes') {
    if (!tags.includes('true-crime')) tags.push('true-crime');
  }
  if (/\b(legal|law|lawyer|tort)\b/.test(lower)) tags.push('legal');
  if (/\b(startup|business)\b/.test(lower)) tags.push('business');
  if (/\b(k-pop|kpop|idol contract)\b/.test(lower)) tags.push('kpop');

  // Deduplicate and limit to 5
  return [...new Set(tags)].slice(0, 5);
}

// ─── HTML → Markdown converter ────────────────────────────────────────────────

function htmlToMarkdown($: cheerio.CheerioAPI, $content: cheerio.Cheerio<any>): { markdown: string; imageCount: number; featuredImage: string } {
  let imageCount = 0;
  let featuredImage = '';
  const lines: string[] = [];

  function processNode(node: any): string {
    if (node.type === 'text') {
      return node.data || '';
    }

    if (node.type !== 'tag') return '';

    const $el = $(node);
    const tag = node.tagName?.toLowerCase() || '';

    // Skip elements we want to strip
    if ($el.hasClass('graf--title')) return '';
    if ($el.hasClass('graf--subtitle')) return '';
    if ($el.hasClass('section-divider')) return '';
    if ($el.hasClass('graf--empty')) return '';

    // Skip the "by ASRReviews" self-link paragraphs
    const text = $el.text().trim();
    if (tag === 'p' && (text === 'by ASRReviews' || text === 'by ASRReviews' || /^by ASR/i.test(text))) {
      const links = $el.find('a');
      if (links.length > 0 && (links.attr('href')?.includes('asrreviews') || links.attr('href')?.includes('carrd.co'))) {
        return '';
      }
    }

    switch (tag) {
      case 'h1':
      case 'h2':
      case 'h3': {
        const inner = processChildren(node);
        if (!inner.trim()) return '';
        return `\n## ${inner.trim()}\n`;
      }
      case 'h4': {
        const inner = processChildren(node);
        if (!inner.trim()) return '';
        return `\n### ${inner.trim()}\n`;
      }
      case 'p': {
        const inner = processChildren(node);
        if (!inner.trim()) return '';
        return `\n${inner.trim()}\n`;
      }
      case 'strong':
      case 'b': {
        const inner = processChildren(node).trim();
        return inner ? `**${inner}**` : '';
      }
      case 'em':
      case 'i': {
        const inner = processChildren(node).trim();
        if (!inner) return '';
        // If the entire content is already a markdown link [text](url), don't double-wrap with *
        // e.g. <em><a href="...">text</a></em> → [*text*](url), not *[text](url)*
        if (/^\[.+\]\(.+\)$/.test(inner)) {
          // inject italic into the link text
          const linkMatch = inner.match(/^\[(.+)\]\((.+)\)$/);
          if (linkMatch) return `[*${linkMatch[1]}*](${linkMatch[2]})`;
        }
        return `*${inner}*`;
      }
      case 'a': {
        const href = $el.attr('href') || '';
        const inner = processChildren(node);
        if (!inner.trim()) return '';
        return `[${inner.trim()}](${href})`;
      }
      case 'code': {
        const inner = processChildren(node);
        return `\`${inner}\``;
      }
      case 'pre': {
        const code = $el.find('code').text() || $el.text();
        return `\n\`\`\`\n${code.trim()}\n\`\`\`\n`;
      }
      case 'blockquote': {
        const inner = processChildren(node);
        const quoted = inner.trim().split('\n').map(line => `> ${line}`).join('\n');
        return `\n${quoted}\n`;
      }
      case 'ul': {
        const items = $el.children('li').map((_, li) => {
          const inner = processChildren(li);
          return `- ${inner.trim()}`;
        }).get();
        return `\n${items.join('\n')}\n`;
      }
      case 'ol': {
        const items = $el.children('li').map((i, li) => {
          const inner = processChildren(li);
          return `${i + 1}. ${inner.trim()}`;
        }).get();
        return `\n${items.join('\n')}\n`;
      }
      case 'li': {
        return processChildren(node);
      }
      case 'figure': {
        const img = $el.find('img');
        const iframe = $el.find('iframe');
        const caption = $el.find('figcaption').text().trim();

        if (img.length > 0) {
          const src = img.attr('src') || '';
          const alt = img.attr('alt') || '';
          const isFeatured = img.attr('data-is-featured') === 'true';

          let imageUrl = src;
          if (isExternalMediumImage(src)) {
            imageUrl = mediumImgToCloudinary(src);
          }

          if (isFeatured && !featuredImage) {
            featuredImage = imageUrl;
          }
          if (!featuredImage && imageCount === 0) {
            featuredImage = imageUrl;
          }

          imageCount++;

          let md = `\n![${alt}](${imageUrl})\n`;
          if (caption) {
            md += `*${caption}*\n`;
          }
          return md;
        }

        if (iframe.length > 0) {
          const iframeSrc = iframe.attr('src') || '';
          const ytMatch = iframeSrc.match(/youtube\.com\/embed\/([^?/]+)/);
          if (ytMatch) {
            return `\nhttps://www.youtube.com/watch?v=${ytMatch[1]}\n`;
          }
          return `\n${iframeSrc}\n`;
        }

        return '';
      }
      case 'img': {
        const src = $el.attr('src') || '';
        const alt = $el.attr('alt') || '';
        const isFeatured = $el.attr('data-is-featured') === 'true';

        let imageUrl = src;
        if (isExternalMediumImage(src)) {
          imageUrl = mediumImgToCloudinary(src);
        }

        if (isFeatured && !featuredImage) {
          featuredImage = imageUrl;
        }
        if (!featuredImage && imageCount === 0) {
          featuredImage = imageUrl;
        }

        imageCount++;
        return `\n![${alt}](${imageUrl})\n`;
      }
      case 'hr': {
        return '\n---\n';
      }
      case 'br': {
        return '\n';
      }
      case 'section':
      case 'div':
      case 'span':
      case 'article': {
        return processChildren(node);
      }
      default: {
        return processChildren(node);
      }
    }
  }

  function processChildren(node: any): string {
    const children = node.children || [];
    return children.map((child: any) => processNode(child)).join('');
  }

  const raw = processChildren($content[0]);

  // Clean up: collapse multiple blank lines, trim
  const markdown = raw
    .replace(/\n{3,}/g, '\n\n')
    // Fix bold/italic with internal leading/trailing spaces: ** text** → **text**
    .replace(/\*\*\s+/g, '**')
    .replace(/\s+\*\*/g, '**')
    .replace(/\*\s+/g, '*')
    .replace(/\s+\*/g, '*')
    // Fix *text *[link](url) → *text* [link](url) (em bleeds into link)
    .replace(/(\*[^*\n]+)\s\*(\[)/g, '$1* $2')
    .trim();

  return { markdown, imageCount, featuredImage };
}

// ─── Build category map ───────────────────────────────────────────────────────

function buildCategoryMap(): Map<string, string> {
  const map = new Map<string, string>();

  for (const [listFile, category] of LIST_CATEGORY_MAP) {
    const filePath = path.join(LISTS_DIR, listFile);
    if (!fs.existsSync(filePath)) continue;

    const html = fs.readFileSync(filePath, 'utf-8');
    const matches = html.matchAll(/medium\.com\/p\/([a-f0-9]+)/g);
    for (const match of matches) {
      const postId = match[1];
      // Only set if not already set (priority order)
      if (!map.has(postId)) {
        map.set(postId, category);
      }
    }
  }

  return map;
}

// ─── Process a single post ────────────────────────────────────────────────────

interface PostResult {
  filename: string;
  category: string;
  frontmatter: Record<string, any>;
  body: string;
}

function processPost(htmlFile: string, categoryMap: Map<string, string>): PostResult | null {
  const filePath = path.join(POSTS_DIR, htmlFile);
  const html = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);

  // Extract metadata
  const title = $('h1.p-name').first().text().trim() || $('title').text().trim() || 'Untitled';
  const summary = $('section[data-field="subtitle"]').text().trim() || '';
  const dateEl = $('time.dt-published');
  const date = dateEl.attr('datetime') || '';
  const canonicalEl = $('a.p-canonical');
  const canonicalUrl = canonicalEl.attr('href') || '';
  const mediumId = extractMediumId(htmlFile);
  const isDraft = htmlFile.startsWith('draft_');
  const slug = slugFromFilename(htmlFile);

  // Medium URL: from canonical or construct
  let mediumUrl = canonicalUrl;
  if (!mediumUrl) {
    const footerLink = $('footer a[href*="medium.com/p/"]').attr('href');
    if (footerLink) mediumUrl = footerLink;
  }

  // Category
  let category = categoryMap.get(mediumId) || 'uncategorized';
  if (isDraft) category = 'drafts';

  // Convert content
  const $body = $('section[data-field="body"].e-content, section.e-content');
  const { markdown, imageCount, featuredImage } = htmlToMarkdown($, $body);

  // Word count from markdown (strip markdown syntax roughly)
  const plainText = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // remove images
    .replace(/\[[^\]]*\]\([^)]*\)/g, '$1') // links to text
    .replace(/[#*>`_~\-\[\]()]/g, '') // strip markdown chars
    .replace(/```[\s\S]*?```/g, '') // strip code blocks
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const readingTime = computeReadingTime(wordCount);

  // Tags
  const tags = deriveTags(title, markdown, category);

  // Check if images might be broken (not in the Reviews list = probably not migrated to Cloudinary)
  const hasImages = imageCount > 0;

  const frontmatter: Record<string, any> = {
    title,
    slug,
    date,
    updated: date,
    author: AUTHOR,
    category,
    tags,
    summary,
    featured_image: featuredImage,
    og_image: featuredImage,
    canonical_url: canonicalUrl,
    status: isDraft ? 'draft' : 'published',
    medium_id: mediumId,
    medium_url: mediumUrl,
    word_count: wordCount,
    reading_time: readingTime,
    has_images: hasImages,
    image_count: imageCount,
  };

  return {
    filename: `${slug}.md`,
    category,
    frontmatter,
    body: markdown,
  };
}

// ─── Write output ─────────────────────────────────────────────────────────────

function writeFrontmatter(fm: Record<string, any>): string {
  const lines: string[] = ['---'];

  lines.push(`title: ${escapeYaml(fm.title)}`);
  lines.push(`slug: ${escapeYaml(fm.slug)}`);
  lines.push(`date: ${escapeYaml(fm.date)}`);
  lines.push(`updated: ${escapeYaml(fm.updated)}`);
  lines.push(`author: ${escapeYaml(fm.author)}`);
  lines.push(`category: ${escapeYaml(fm.category)}`);
  lines.push(`tags: [${fm.tags.map((t: string) => escapeYaml(t)).join(', ')}]`);
  lines.push(`summary: ${escapeYaml(fm.summary)}`);
  lines.push(`featured_image: ${escapeYaml(fm.featured_image)}`);
  lines.push(`og_image: ${escapeYaml(fm.og_image)}`);
  lines.push(`canonical_url: ${escapeYaml(fm.canonical_url)}`);
  lines.push(`status: ${escapeYaml(fm.status)}`);
  lines.push(`medium_id: ${escapeYaml(fm.medium_id)}`);
  lines.push(`medium_url: ${escapeYaml(fm.medium_url)}`);
  lines.push(`word_count: ${fm.word_count}`);
  lines.push(`reading_time: ${escapeYaml(fm.reading_time)}`);
  lines.push(`has_images: ${fm.has_images}`);
  lines.push(`image_count: ${fm.image_count}`);

  lines.push('---');
  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('=== Medium → Markdown Export ===\n');

  // Build category map
  const categoryMap = buildCategoryMap();
  console.log(`Category map: ${categoryMap.size} posts mapped to lists\n`);

  // Get all post files
  const postFiles = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.html')).sort();
  console.log(`Found ${postFiles.length} post files\n`);

  // Process each
  let exported = 0;
  let errors = 0;

  for (const file of postFiles) {
    try {
      const result = processPost(file, categoryMap);
      if (!result) {
        console.log(`  SKIP: ${file}`);
        continue;
      }

      // Create output directory
      const outDir = path.join(OUTPUT_DIR, result.category);
      fs.mkdirSync(outDir, { recursive: true });

      // Write file
      const outPath = path.join(outDir, result.filename);
      const content = writeFrontmatter(result.frontmatter) + '\n\n' + result.body + '\n';
      fs.writeFileSync(outPath, content, 'utf-8');

      exported++;
      console.log(`  ✓ ${result.category}/${result.filename} (${result.frontmatter.word_count} words, ${result.frontmatter.image_count} images)`);
    } catch (err: any) {
      errors++;
      console.error(`  ✗ ERROR: ${file} — ${err.message}`);
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`  Exported: ${exported}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Output: ${OUTPUT_DIR}/`);
}

main();
