/**
 * Public blog data layer (server-only, read-only).
 *
 * The public-facing blog renders in server components for SEO, so it queries
 * the database directly with read-only SELECTs rather than self-fetching the
 * API routes (which is flaky during SSG and adds a network hop). These mirror
 * the enrichment the /api/posts routes perform (category join, tag arrays,
 * computed read time). No writes happen here.
 */

import { db } from '@repo/db';
import * as schema from '@repo/db';
import { and, avg, count, desc, eq, inArray, isNull, or, ilike, sql } from 'drizzle-orm';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  postCount: number;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  publishedAt: string | null;
  featuredImage: string;
  views: number;
  readTime: number;
  discussionOpen: boolean;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  noindex: boolean;
  ogImage: string | null;
  category: { id: string; name: string; slug: string } | null;
  tags: BlogTag[];
}

export interface BlogAuthor {
  id: string;
  displayName: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  description: string;
  copyright: string;
  siteUrl: string;
  kofiLink: string;
  contactEmail: string;
}

export interface NovelWork {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  status: string;
  metadata: Record<string, unknown>;
  chapterCount: number;
  views: number;
  rating: number;
  reviewsCount: number;
}

export interface NovelChapter {
  id: string;
  title: string;
  slug: string;
  content: string;
  chapterNumber: number;
  locked: boolean;
  publishedAt: string | null;
  collectionId: string;
}

export interface NovelReview {
  id: string;
  collectionId: string;
  authorName: string | null;
  rating: number;
  content: string;
  createdAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function countWords(content: string): number {
  if (!content) return 0;
  const trimmed = content.trim();
  if (trimmed.startsWith('{')) {
    try {
      const doc = JSON.parse(trimmed);
      const extract = (node: any): string => {
        if (node.text) return node.text;
        if (node.content) return node.content.map(extract).join(' ');
        return '';
      };
      return extract(doc).split(/\s+/).filter(Boolean).length;
    } catch {
      /* fall through */
    }
  }
  return trimmed.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
}

function computeReadTime(content: string): number {
  return Math.max(1, Math.ceil(countWords(content) / 200));
}

type PostRow = typeof schema.posts.$inferSelect;

function enrich(
  row: PostRow,
  category: { id: string; name: string; slug: string } | null,
  tags: BlogTag[],
): BlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    summary: row.summary,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    featuredImage: row.featuredImage,
    views: row.views,
    readTime: computeReadTime(row.content),
    discussionOpen: row.discussionOpen,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    canonicalUrl: row.canonicalUrl,
    noindex: row.noindex,
    ogImage: row.ogImage,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
    tags,
  };
}

async function attachRelations(rows: PostRow[]): Promise<BlogPost[]> {
  if (rows.length === 0) return [];
  const postIds = rows.map((p) => p.id);
  const categoryIds = [...new Set(rows.map((p) => p.categoryId).filter(Boolean))] as string[];

  const [categoriesList, joinRows] = await Promise.all([
    categoryIds.length > 0
      ? db.select().from(schema.categories).where(inArray(schema.categories.id, categoryIds))
      : Promise.resolve([] as (typeof schema.categories.$inferSelect)[]),
    db
      .select({
        postId: schema.postTags.postId,
        id: schema.tags.id,
        name: schema.tags.name,
        slug: schema.tags.slug,
      })
      .from(schema.postTags)
      .innerJoin(schema.tags, eq(schema.postTags.tagId, schema.tags.id))
      .where(inArray(schema.postTags.postId, postIds)),
  ]);

  const catMap = new Map(categoriesList.map((c) => [c.id, c]));
  const tagsByPost = new Map<string, BlogTag[]>();
  for (const r of joinRows) {
    const list = tagsByPost.get(r.postId) || [];
    list.push({ id: r.id, name: r.name, slug: r.slug });
    tagsByPost.set(r.postId, list);
  }

  return rows.map((row) => {
    const cat = row.categoryId ? catMap.get(row.categoryId) : undefined;
    return enrich(
      row,
      cat ? { id: cat.id, name: cat.name, slug: cat.slug } : null,
      tagsByPost.get(row.id) || [],
    );
  });
}

const publishedFilter = () =>
  and(eq(schema.posts.status, 'published'), isNull(schema.posts.deletedAt));

/** Article-only published filter — use this on every public listing surface. */
const articleFilter = () =>
  and(publishedFilter(), eq(schema.posts.type, 'article'));

// ─── Settings ────────────────────────────────────────────────────────────────

const SETTINGS_DEFAULTS: SiteSettings = {
  siteName: 'Bromance',
  tagline: 'All things Drama, Manga, and Culture',
  description: 'Donghua, drama, manga, and novel reviews, recaps, and recommendations.',
  copyright: `© ${new Date().getFullYear()} Bromance. All rights reserved.`,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://bromance.blog',
  kofiLink: '',
  contactEmail: '',
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await db.select().from(schema.settings);
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;
    return {
      siteName: map.site_name || SETTINGS_DEFAULTS.siteName,
      tagline: map.site_tagline || SETTINGS_DEFAULTS.tagline,
      description: map.site_description || SETTINGS_DEFAULTS.description,
      copyright: map.copyright || SETTINGS_DEFAULTS.copyright,
      siteUrl: map.site_url || SETTINGS_DEFAULTS.siteUrl,
      kofiLink: map.kofi_link || SETTINGS_DEFAULTS.kofiLink,
      contactEmail: map.contact_email || SETTINGS_DEFAULTS.contactEmail,
    };
  } catch {
    return SETTINGS_DEFAULTS;
  }
}

// ─── Categories & Tags ─────────────────────────────────────────────────────

export async function getCategories(): Promise<BlogCategory[]> {
  const [list, counts] = await Promise.all([
    db.select().from(schema.categories).where(isNull(schema.categories.deletedAt)),
    db
      .select({
        categoryId: schema.posts.categoryId,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(schema.posts)
      .where(articleFilter())
      .groupBy(schema.posts.categoryId),
  ]);
  const countMap = new Map(counts.map((c) => [c.categoryId, c.count]));
  return list
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      postCount: countMap.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.postCount - a.postCount);
}

export async function getCategoryBySlug(slug: string): Promise<BlogCategory | null> {
  const [cat] = await db
    .select()
    .from(schema.categories)
    .where(and(eq(schema.categories.slug, slug), isNull(schema.categories.deletedAt)))
    .limit(1);
  if (!cat) return null;
  const [{ count: postCount }] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(schema.posts)
    .where(and(articleFilter(), eq(schema.posts.categoryId, cat.id)));
  return { id: cat.id, name: cat.name, slug: cat.slug, description: cat.description, postCount };
}

export async function getTagBySlug(slug: string): Promise<BlogTag | null> {
  const [tag] = await db.select().from(schema.tags).where(eq(schema.tags.slug, slug)).limit(1);
  return tag ? { id: tag.id, name: tag.name, slug: tag.slug } : null;
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export interface PostQuery {
  categoryId?: string;
  categorySlug?: string;
  tagSlug?: string;
  authorSlug?: string;
  search?: string;
  limit?: number;
  page?: number;
}

export async function getPublishedPosts(
  query: PostQuery = {},
): Promise<{ posts: BlogPost[]; total: number }> {
  const { categoryId, categorySlug, tagSlug, search } = query;
  const limit = query.limit ?? 24;
  const page = query.page ?? 1;
  const conditions = [articleFilter()];

  if (categoryId) conditions.push(eq(schema.posts.categoryId, categoryId));
  if (categorySlug) {
    const cat = await getCategoryBySlug(categorySlug);
    if (!cat) return { posts: [], total: 0 };
    conditions.push(eq(schema.posts.categoryId, cat.id));
  }
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(schema.posts.title, pattern),
        ilike(schema.posts.summary, pattern),
        ilike(schema.posts.content, pattern),
      )!,
    );
  }
  if (tagSlug) {
    const tag = await getTagBySlug(tagSlug);
    if (!tag) return { posts: [], total: 0 };
    const tagged = await db
      .select({ postId: schema.postTags.postId })
      .from(schema.postTags)
      .where(eq(schema.postTags.tagId, tag.id));
    const ids = tagged.map((t) => t.postId);
    if (ids.length === 0) return { posts: [], total: 0 };
    conditions.push(inArray(schema.posts.id, ids));
  }

  const where = and(...conditions);
  const offset = (page - 1) * limit;

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(schema.posts)
      .where(where)
      .orderBy(desc(schema.posts.publishedAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`cast(count(*) as integer)` }).from(schema.posts).where(where),
  ]);

  return { posts: await attachRelations(rows), total: totalRows[0].count };
}

/** Type-agnostic slug lookup — used by the legacy resolver (Step 8). */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const [row] = await db
    .select()
    .from(schema.posts)
    .where(and(eq(schema.posts.slug, slug), eq(schema.posts.status, 'published'), isNull(schema.posts.deletedAt)))
    .limit(1);
  if (!row) return null;
  const [enriched] = await attachRelations([row]);
  return enriched;
}

/** Article-scoped slug lookup — use for the /articles/[slug] page. */
export async function getArticleBySlug(slug: string): Promise<BlogPost | null> {
  const [row] = await db
    .select()
    .from(schema.posts)
    .where(
      and(
        eq(schema.posts.slug, slug),
        eq(schema.posts.status, 'published'),
        isNull(schema.posts.deletedAt),
        eq(schema.posts.type, 'article'),
      ),
    )
    .limit(1);
  if (!row) return null;
  const [enriched] = await attachRelations([row]);
  return enriched;
}

export async function getRelatedPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  const conditions = [articleFilter(), sql`${schema.posts.id} != ${post.id}`];
  if (post.category) conditions.push(eq(schema.posts.categoryId, post.category.id));
  const rows = await db
    .select()
    .from(schema.posts)
    .where(and(...conditions))
    .orderBy(desc(schema.posts.publishedAt))
    .limit(limit);
  if (rows.length >= limit || !post.category) return attachRelations(rows);
  // Top up with recent articles from any category if the category is thin.
  const have = new Set(rows.map((r) => r.id).concat(post.id));
  const extra = await db
    .select()
    .from(schema.posts)
    .where(articleFilter())
    .orderBy(desc(schema.posts.publishedAt))
    .limit(limit + rows.length + 1);
  const merged = [...rows, ...extra.filter((e) => !have.has(e.id))].slice(0, limit);
  return attachRelations(merged);
}

export async function getAllPublishedSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  const rows = await db
    .select({ slug: schema.posts.slug, updatedAt: schema.posts.updatedAt })
    .from(schema.posts)
    .where(articleFilter());
  return rows;
}

// ─── Author ────────────────────────────────────────────────────────────────

export async function getAuthor(): Promise<BlogAuthor> {
  try {
    const [a] = await db.select().from(schema.authors).limit(1);
    if (a) {
      return { id: a.id, displayName: a.displayName, slug: a.slug, bio: a.bio, avatarUrl: a.avatarUrl };
    }
  } catch {
    /* fall through to default */
  }
  return { id: 'author-1', displayName: 'Amy97', slug: 'amy97', bio: null, avatarUrl: null };
}

export async function getAuthorBySlug(slug: string): Promise<BlogAuthor | null> {
  try {
    const [a] = await db.select().from(schema.authors).where(eq(schema.authors.slug, slug)).limit(1);
    if (a) return { id: a.id, displayName: a.displayName, slug: a.slug, bio: a.bio, avatarUrl: a.avatarUrl };
  } catch {
    /* ignore */
  }
  const fallback = await getAuthor();
  return fallback.slug === slug ? fallback : null;
}

// ─── Collections (novels / generic works) ────────────────────────────────────

export async function getCollections(typeKey = 'novels'): Promise<NovelWork[]> {
  try {
    const rows = await db
      .select({
        id: schema.collections.id,
        name: schema.collections.name,
        slug: schema.collections.slug,
        description: schema.collections.description,
        coverImage: schema.collections.coverImage,
        status: schema.collections.status,
        metadata: schema.collections.metadata,
        chapterCount: sql<number>`cast(count(distinct ${schema.posts.id}) as integer)`,
        views: sql<number>`cast(coalesce(sum(${schema.posts.views}), 0) as integer)`,
        rating: sql<number>`coalesce(avg(${schema.reviews.rating}), 0)`,
        reviewsCount: sql<number>`cast(count(distinct ${schema.reviews.id}) as integer)`,
      })
      .from(schema.collections)
      .leftJoin(
        schema.posts,
        and(
          eq(schema.posts.collectionId, schema.collections.id),
          eq(schema.posts.status, 'published'),
          isNull(schema.posts.deletedAt),
        ),
      )
      .leftJoin(schema.reviews, eq(schema.reviews.collectionId, schema.collections.id))
      .where(
        and(
          eq(schema.collections.typeKey, typeKey),
          isNull(schema.collections.deletedAt),
        ),
      )
      .groupBy(
        schema.collections.id,
        schema.collections.name,
        schema.collections.slug,
        schema.collections.description,
        schema.collections.coverImage,
        schema.collections.status,
        schema.collections.metadata,
      )
      .orderBy(schema.collections.sortOrder);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      coverImage: r.coverImage,
      status: r.status,
      metadata: (r.metadata as Record<string, unknown>) ?? {},
      chapterCount: r.chapterCount,
      views: r.views,
      rating: Number(Number(r.rating).toFixed(1)),
      reviewsCount: r.reviewsCount,
    }));
  } catch {
    return [];
  }
}

export async function getCollectionBySlug(
  slug: string,
): Promise<{ work: NovelWork; chapters: NovelChapter[] } | null> {
  try {
    const works = await getCollections('novels');
    const work = works.find((w) => w.slug === slug) ?? null;
    if (!work) return null;

    const chapterRows = await db
      .select()
      .from(schema.posts)
      .where(
        and(
          eq(schema.posts.collectionId, work.id),
          eq(schema.posts.status, 'published'),
          isNull(schema.posts.deletedAt),
        ),
      );

    const chapters: NovelChapter[] = chapterRows
      .map((r) => {
        const meta = (r.meta as Record<string, unknown>) ?? {};
        return {
          id: r.id,
          title: r.title,
          slug: r.slug,
          content: r.content,
          chapterNumber: typeof meta.chapterNumber === 'number' ? meta.chapterNumber : 0,
          locked: meta.locked === true,
          publishedAt: r.publishedAt?.toISOString() ?? null,
          collectionId: r.collectionId ?? work.id,
        };
      })
      .sort((a, b) => a.chapterNumber - b.chapterNumber);

    return { work, chapters };
  } catch {
    return null;
  }
}

export async function getChapter(
  workSlug: string,
  chapterSlug: string,
): Promise<{ chapter: NovelChapter; prev: string | null; next: string | null } | null> {
  try {
    const result = await getCollectionBySlug(workSlug);
    if (!result) return null;
    const { chapters } = result;
    const idx = chapters.findIndex((c) => c.slug === chapterSlug);
    if (idx === -1) return null;
    return {
      chapter: chapters[idx],
      prev: idx > 0 ? chapters[idx - 1].slug : null,
      next: idx < chapters.length - 1 ? chapters[idx + 1].slug : null,
    };
  } catch {
    return null;
  }
}

export async function getCollectionReviews(collectionId: string): Promise<NovelReview[]> {
  try {
    const rows = await db
      .select()
      .from(schema.reviews)
      .where(eq(schema.reviews.collectionId, collectionId))
      .orderBy(desc(schema.reviews.createdAt));
    return rows.map((r) => ({
      id: r.id,
      collectionId: r.collectionId,
      authorName: r.authorName,
      rating: r.rating,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}
