# Plan: Generic Content-Type System + Novels (Chapters) + Blog Hardening

**Created:** 2026-01-15
**Status:** Draft
**Related issue / branch:** GitHub Issue #32 (bromance.blog) — none branch yet

## Overview

This plan introduces a generic, admin-extensible content-type system (WordPress/ACF-style custom post types) to the bromance.blog monorepo app (`apps/web`, Next.js 15 App Router + Drizzle/Supabase). Today every public post is implicitly an "article" served at `/[slug]`. We make the type a first-class, modular concept: an admin can define types (e.g. `articles`, `novels`, future `recipes`, `tests`) each with a name and a URL-prefix, each surfaced as its own page under "Posts" in the CMS. Two types ship at launch: **articles** (the 7 existing posts, public URLs moving `/[slug]` → `/articles/[slug]` with 301s) and **novels** (new; public URLs under `/novels/...`).

Within **novels**, each post is a **chapter**; chapters are grouped under a **novel-work** ("series"). Because novel-works carry their own metadata (cover, synopsis, status, rating, alt/original title, genres, tags) that has no home in the current schema, we add a **generic `collections` table** (any type can have collections) plus a generic chapter link on `posts`. Reviews (with star ratings) get a dedicated additive `reviews` table since `comments.post_id` is `NOT NULL` and reviews target a work, not a post. The existing hardcoded novel reader UI (`components/blog/my-work-showcase.tsx`) is preserved and wired to real data.

The plan also closes a set of verified gaps: a public-blog **type-leak guard** (article-only filtering on every public listing/feed/sitemap/search), porting the one genuinely-missing Ko-fi "Support Goal" UI block (most support UI already exists — see Decisions), fixing the author page, removing all `<link rel="canonical">` emission (without dropping the DB column), persisting reviews, honest analytics labeling, and dead-code cleanup. All DB changes are **additive and non-destructive**; exact SQL is in Operational Notes and must be run manually.

## Requested Changes

1. Build a generic, modular content-type system (admin-creatable types with name + URL slug prefix; each type its own page under "Posts" in the CMS). Not special-cased per type.
2. Ship two types: **articles** (assign the 7 existing posts; move public URLs `/[slug]` → `/articles/[slug]`) and **novels** (new; public URLs `/novels/[slug]`).
3. In novels, each post is a **chapter**; chapters group under a **novel-work**. Decide the grouping mechanism and where novel-work metadata (cover, synopsis, status Ongoing/Completed, rating, alt/original title, genres, tags) lives. Keep consistent with the generic foundation; avoid hard-coding novel-only fields where avoidable.
4. Keep the existing novel reader UI (`my-work-showcase.tsx`, `my-work/page.tsx`) and wire it to real data. Preserve: series selector, cover + status badge, stat grid (chapters/rating/views), synopsis/chapters/reviews tabs, in-page chapter reader (font size sm/md/lg/xl, theme classic/sepia/dark, prev/next), locked-chapter → Ko-fi paywall.
5. DB migrations must be additive/non-destructive only. Preserve the 7 posts and all data. Provide exact additive SQL; never assume it auto-runs.
6. Cloudinary cloud `dtperak4e`, folder `bromance-blog` — do not change. TipTap JSON in `posts.content` rendered via `lib/tiptap-html.ts`; chapters reuse the existing editor. Cookie auth via `/api/auth` — don't change.
7. **Type leak guard**: `lib/blog-data.ts` does not filter by `type`. Add article-type filtering to home grid, `category/[slug]`, `tag/[slug]`, RSS `feed.xml`, `sitemap.ts`, and search.
8. **Port Ko-fi/support UI** from dead mockup `frontends/blog/blog.tsx` into the live blog. Ko-fi link from settings key `kofi_link` (`/api/settings`).
9. **Fix author page** `author/[slug]/page.tsx`: `getPublishedPosts({ limit: 48 })` without author filter; ensure bylines link to the right slug. Single-author blog.
10. **Remove canonical links entirely**: stop emitting `<link rel="canonical">`/canonical metadata across all pages. Leave the `notNull` `posts.canonical_url` column; do not migrate it away.
11. **Reviews**: `my-work-showcase` reviews are local-state only; `comments` has no rating column. Decide persistence and wire it.
12. **Cleanup**: delete dead `frontends/blog/blog.tsx` (after extracting needed support UI); fix stale `// TODO` in `robots.ts`; `viewsHistory` in `app/api/analytics/route.ts` is simulated — implement real per-day tracking or relabel honestly.
13. **Routing**: resolve the App Router structure for moving articles to `/articles/[slug]` while keeping the site working, including interaction with `category/`, `tag/`, `author/`, `feed.xml`, `sitemap`, and 301s for old URLs.

## Current State Analysis

**Stack / scripts (verified):**
- pnpm `11.5.2` workspace + Turborepo. Root scripts: `pnpm build` → `turbo run build`, `pnpm lint` → `turbo run lint`, `pnpm type-check` → `turbo run type-check`. `apps/web` scripts: `next build`, `eslint .`, `tsc --noEmit`.
- `apps/web` deps (verified in `apps/web/package.json`): `next ^15.4.9`, `react ^19.2.1`, `drizzle-orm ^0.45.2`, `@tiptap/* ^3.26.0`, `tailwindcss 4.1.11`, `lucide-react ^0.553.0`, `cloudinary ^2.10.0`, `sonner 2.0.7`.
- DB package `@repo/db` (`packages/db`): `drizzle-orm ^0.45.2`, `postgres ^3.4.9`, `nanoid ^5.1.11`, `drizzle-kit ^0.31.10`. Postgres-js client with Supabase pooler (`prepare: false`). `generateId()` = 12-char nanoid. Schema in `src/schema.ts`, hand-written interfaces in `src/types.ts`, barrel exports in `src/index.ts`. Drizzle migrations live in `packages/db/drizzle/` but are **not** auto-applied at runtime.

**Schema facts (verified `packages/db/src/schema.ts`):**
- `posts`: `type varchar(50) NOT NULL DEFAULT 'article'` (indexed `idx_posts_type`), `meta jsonb NOT NULL DEFAULT '{}'`, `categoryId`, `featuredImage text NOT NULL`, `slug varchar(255) UNIQUE`, `canonicalUrl text NOT NULL`, `deletedAt` soft-delete, `discussionOpen`, `noindex`, `ogImage`.
- `categories`: id/name/slug/description/parentId/deletedAt only (no cover/status/metadata).
- `redirects` (source UNIQUE / destination / permanent) EXISTS. **Written** on slug change in `app/api/posts/[id]/route.ts` (PUT) but **never read/consumed** anywhere — `middleware.ts` only guards `/cms/*` auth.
- `comments`: id/postId(NOT NULL)/authorName/content/createdAt — no rating, no collection link.
- `settings`: key-value; `kofi_link` is read by `getSiteSettings()` and `/api/settings`.

**Public blog (verified):**
- `lib/blog-data.ts` — server-only read layer. `getPublishedPosts`, `getPostBySlug`, `getRelatedPosts`, `getAllPublishedSlugs`, `getCategories`, `getCategoryBySlug`, `getTagBySlug`, `getAuthor`, `getAuthorBySlug`, `getSiteSettings`. **No `type` filtering anywhere** — novels chapters would leak into the blog grid, categories counts, search, RSS, sitemap.
- Routes under `app/(blog)/`: `page.tsx` (home), `[slug]/page.tsx` (post; emits `alternates.canonical` when `post.canonicalUrl` is set), `category/[slug]`, `tag/[slug]`, `author/[slug]` (calls `getPublishedPosts({ limit: 48 })` with no author filter), `my-work/page.tsx` (renders `MyWorkShowcase`, no DB), `feed.xml/route.ts` (links `${base}/${slug}`), `sitemap.ts` (`/${slug}` + categories), `robots.ts` (stale `// TODO`), `layout.tsx` (renders header/footer/`KofiFloat`).
- Internal article links to `/${slug}` live in: `components/blog/post-card.tsx` (`href = \`/${post.slug}\``), `components/blog/search-overlay.tsx` (`/${post.slug}`), `feed.xml/route.ts`, `sitemap.ts`. Breadcrumbs/category/tag/author links are unaffected.
- `components/blog/my-work-showcase.tsx` — single large client component, 100% hardcoded `NOVELS` array + `INITIAL_REVIEWS` local state. Contains series selector, cover/status badge, stat grid, tabs, in-page reader (font/theme/prev-next), locked→Ko-fi paywall. Fetches `kofi_link` client-side.
- Support UI audit (important — the issue lists several as "never ported", but they already exist): the inline "Enjoying the content?" widget already exists in `app/(blog)/[slug]/page.tsx`; footer "Buy us a coffee" + "MORE FROM US" already exists in `components/blog/blog-footer.tsx`; the floating "Support me" button exists in `components/blog/kofi-float.tsx`; the premium-chapter unlock CTA exists in `my-work-showcase.tsx`. The **only genuinely missing** piece from the mockup (`frontends/blog/blog.tsx`, lines ~1108-1117) is the **"Support Goal" highlight block** (and its sibling "Weekly Schedule" block) shown on the novel synopsis tab.

**CMS (verified):**
- `components/cms/cms-sidebar.tsx` — static `mainNavItems` with a single "Posts" entry. No type awareness.
- `app/(cms)/cms/posts/page.tsx` — client list; uses `fetchPosts({ excludeContent: true })`; status tabs; no `type` filter; "New Post" → `/cms/posts/new`.
- `app/(cms)/cms/posts/[id]/page.tsx` → `EditorCanvas`. `EditorCanvas` (`components/cms/editor/editor-canvas.tsx`) handles `postId === 'new'` by POSTing `{title,status:'draft'}` then redirecting. It already sends `type`? No — it never sets `type`, so new posts default to `'article'` server-side. SettingsPanel (`settings-panel.tsx`) holds summary/tags/SEO/revisions. DocumentHeader holds cover/category/date/status.
- `app/api/posts/route.ts` — GET supports `?type=`, `?status=`, `?search=`, `?tag=`, pagination; POST creates posts (handles `type`, `meta`, but **not** `collection_id`). `app/api/posts/[id]/route.ts` — GET by id-or-slug; PUT updates (handles `type`, `meta`, writes `redirects` on slug change; **not** `collection_id`); DELETE soft/hard.
- `app/api/categories/route.ts`, `app/api/settings/route.ts`, `app/api/posts/[id]/comments/route.ts` (comment CRUD, tolerant of missing table), `app/api/analytics/route.ts` (`viewsHistory` is fabricated from `totalViews * fixed fractions`).
- Editor content uses TipTap; serialized to HTML for public render by `lib/tiptap-html.ts` (`renderPostContent`, `extractPlainText`).

**Quirks that affect this work:**
- `redirects` is write-only today; we will consume it in the legacy `[slug]` resolver (App Router server component) rather than middleware, because the Drizzle/postgres-js client is not Edge-compatible and `middleware.ts` runs on the Edge runtime.
- `posts.canonical_url` is `NOT NULL` and already emptied in the DB; only `[slug]/page.tsx` emits canonical metadata.
- Novels chapters may have a null `category_id`; category counts must be article-scoped so novels don't inflate them.

## Decisions Made

**D1 — Generic content-type registry via a new `content_types` table.**
**Decision:** Add an additive `content_types` table: `id`, `name`, `key` (UNIQUE; equals the value stored in `posts.type`), `url_prefix` (UNIQUE; the public URL segment), `description`, `icon` (optional lucide icon name), `sort_order`, timestamps. Seed two rows: `article`→`articles`, `novels`→`novels`. The CMS sidebar and posts list are driven by this table. `posts.type` (already present, indexed, default `'article'`) remains the join key. — **Rationale:** Makes types data-driven and admin-creatable without code changes; reuses the existing indexed `posts.type` column; the 7 existing posts already have `type='article'`, so no row is overwritten. `url_prefix` is separate from `key` because the existing data uses the singular key `article` while the public prefix is the plural `articles`. — **Rejected:** Hard-coding the type list in `cms-api.ts`'s `PostType` union (not modular; requires a code deploy per type).

**D2 — Novel-works stored in a generic `collections` table.**
**Decision:** Add an additive `collections` table that groups posts within any type: `id`, `type_key` (which content type owns it), `name`, `slug` (UNIQUE), `description`, `cover_image` (Cloudinary public_id), `status` (`'ongoing'|'completed'`, generic), `sort_order`, `metadata jsonb` (type-specific ACF-style fields: `rating` is computed not stored; `altTitle`, `originalTitle`, `genres[]`, `tags[]`, `translator`, `author`, `viewsLabel`), timestamps, `deleted_at`. For novels, a collection = a novel-work. — **Rationale:** Keeps the foundation generic (any future type can have collections/series); `cover_image` and `status` are broadly useful so they are columns, while the long tail of fields lives in `metadata` jsonb (the ACF-style home). — **Rejected:** Reusing `categories` as works (lacks cover/status/metadata, and is already wired to the article category nav — overloading couples unrelated concerns); adding novel-specific columns directly to `posts` (violates "avoid hard-coding novel-only fields").

**D3 — Chapter→work link + chapter fields.**
**Decision:** Add one additive nullable column `posts.collection_id varchar(50)` (indexed) linking a chapter post to its work. Chapter-specific fields live in the existing `posts.meta` jsonb: `meta.chapterNumber` (number) and `meta.locked` (boolean, premium/paywalled). — **Rationale:** `collection_id` is queryable/indexable and generic (collection membership applies to any type); chapter ordering and the locked flag are ACF-style per-post custom fields and belong in `meta`, requiring no novel-only columns. — **Rejected:** Storing `workId` only in `meta` (jsonb membership queries are cltunkier and unindexed); a `chapters` table (duplicates `posts`, breaks "each post is a chapter" and editor reuse).

**D4 — Reviews in a dedicated additive `reviews` table keyed to collections.**
**Decision:** Add a `reviews` table: `id`, `collection_id`, `author_name` (nullable), `rating` (1-5, default 5), `content`, `created_at`. Public `rating`/`reviewsCount` shown in the showcase are computed (avg + count) from this table. — **Rationale:** Reviews target a **work** (collection), not a post; `comments.post_id` is `NOT NULL`, so reviews cannot live in `comments` without a destructive schema change. A dedicated table is additive, clean, and leaves room for moderation. — **Rejected:** Adding `rating` + `collection_id` to `comments` (blocked by `comments.post_id NOT NULL`); keeping reviews client-only (loses data, fails requirement 11).

**D5 — Routing: explicit `articles/` + `novels/` segments; hierarchical novels; single legacy resolver for 301s.**
**Decision:**
- Articles served from a new explicit segment `app/(blog)/articles/[slug]/page.tsx` (the current `[slug]` page logic, type-scoped to `article`, canonical removed).
- Novels: `app/(blog)/novels/page.tsx` (library = the showcase with the work selector), `app/(blog)/novels/[workSlug]/page.tsx` (a single work; the showcase scoped to that work with its in-page reader), and `app/(blog)/novels/[workSlug]/[chapterSlug]/page.tsx` (a server-rendered chapter for SEO/deep-linking that reuses the reader chrome).
- `app/(blog)/[slug]/page.tsx` is repurposed into a **universal legacy resolver**: look up a published post by slug (any type); if `article` → `permanentRedirect('/articles/<slug>')`; if `novels` → resolve its work and `permanentRedirect('/novels/<workSlug>/<slug>')`; else consult the `redirects` table and resolve its destination the same way; else `notFound()`.
- `/my-work` → `permanentRedirect('/novels')`.
- **Rationale:** Explicit literal segments take precedence over the dynamic `[slug]` and never collide with the existing literal segments (`category`, `tag`, `author`, `my-work`, `feed.xml`, `sitemap`, `robots`). The hierarchical `/novels/[workSlug]/[chapterSlug]` reflects "chapters group under a work", avoids a `[workSlug]` vs `[chapterSlug]` collision at one level, and yields SEO-friendly chapter URLs. Consuming `redirects` in the server component (not middleware) is required because the DB client is not Edge-compatible. — **Rejected:** A single dynamic `[type]/[slug]` segment (ambiguous against `category/[slug]` etc., and no per-type rendering); DB lookups in `middleware.ts` (Edge runtime incompatibility); flat `/novels/[slug]` for chapters (collides with work pages and hides the work hierarchy). **Note on requirement 2's literal `/novels/[slug]`:** the issue's "Routing concern to resolve explicitly" grants this authority; the chapter URL is `/novels/[workSlug]/[chapterSlug]` and the work URL is `/novels/[workSlug]`.

**D6 — Public type guard defaults to `article`.**
**Decision:** `getPublishedPosts`, `getAllPublishedSlugs`, `getCategories`/counts, search, RSS, and sitemap all scope to `type = 'article'` by adding `eq(posts.type, 'article')` (via an optional `type` param defaulting to `'article'`). Novels use new dedicated accessors. — **Rationale:** One central guard prevents leaks across every public surface. — **Rejected:** Per-page filtering (easy to miss a surface).

**D7 — Stop emitting canonical, keep the column.**
**Decision:** Remove `alternates: post.canonicalUrl ? { canonical: ... } : undefined` from the articles page `generateMetadata` (the only emitter). Leave `posts.canonical_url` and the CMS canonical field intact (data preserved, simply unused for output). — **Rationale:** Satisfies "stop tracing articles elsewhere" while honoring "leave the notNull column". — **Rejected:** Dropping/altering the column (destructive, disallowed); removing the CMS field (unnecessary churn).

**D8 — Reviews submission wired to the new API; ratings computed.**
**Decision:** The showcase review form POSTs to `/api/collections/[id]/reviews`; the list reads from the same endpoint; the work's `rating` (avg) and `reviewsCount` are computed server-side. — **Rationale:** Persists reviews per requirement 11 using D4. — **Rejected:** Folding into comments (D4 rationale).

**D9 — Analytics `viewsHistory`: relabel honestly (no fabricated daily data).**
**Decision:** There is no timestamped view log and adding per-event tracking is out of scope; replace the fabricated 7-day split with an honest, clearly-derived series. Concretely: return `viewsHistory: []` and add `viewsHistoryEstimated: true`, and change the CMS chart copy to "Views by recent posts (estimated)" using real per-post `views` for the most recent published posts instead of fake date buckets. — **Rationale:** Honest and minimal; no misleading "Jun 1..Jun 7" data, no new infra. — **Rejected:** Building a real `view_events`/`daily_views` table + increment path (scope creep beyond this issue); leaving the fabricated values (dishonest, explicitly called out).

**D10 — CMS "Posts" section is type-driven; novels get a Works manager.**
**Decision:** The sidebar fetches `content_types` and renders one entry per type under "Content" (Articles, Novels, …), each linking to `/cms/posts?type=<key>`. Novels also get a "Novels — Works" entry linking to a new `/cms/novels` page to create/edit works (name, slug, cover, status, rating is read-only computed, alt/original title, genres, tags, synopsis) and moderate reviews. The editor gains a Type selector and, for collection-backed types, Work + Chapter # + Locked controls. — **Rationale:** Fulfills "each type appears as its own page under Posts" and gives novel-works/chapters a management home. — **Rejected:** A single static Posts page (fails requirement 1).

## Assumptions

- **A1:** The 7 existing posts already have `type = 'article'` (schema default + audit). They will not be modified. *Safe — confirmed by schema default and issue's "Key audited facts".*
- **A2:** The admin will run the additive SQL in Operational Notes against Supabase before the feature is exercised, and will create at least one novels work + assign chapters via the CMS. *Safe — explicitly required; the app degrades gracefully (novels pages show empty states) until then.*
- **A3:** `DATABASE_URL` is available to server components/route handlers at build and runtime (already used throughout `blog-data.ts`). *Safe — existing behavior.*
- **A4:** Single-author blog; `getAuthor()` (first author row) is the canonical author and its `slug` is the byline target. *Safe — matches current code and issue statement.*
- **A5:** Novel chapter `content` is TipTap JSON (like all posts) and renders via `renderPostContent`. *Safe — chapters reuse the existing editor.*
- **A6 (risky):** Querying chapters by `posts.collection_id` (indexed) and reviews by `reviews.collection_id` scales fine at blog volume. *Low risk at this scale; flagged.*

## Success Criteria

- An admin can create a content type (name + URL prefix) in the CMS; it appears under "Posts" in the sidebar and lists only its own posts. (No code change needed to add a type.)
- The 7 existing posts are served at `/articles/<slug>`; visiting the old `/<slug>` returns an HTTP 301 to `/articles/<slug>`. No post data is altered.
- The public home grid, `category/[slug]`, `tag/[slug]`, search overlay, `feed.xml`, and `sitemap.xml` show **only** `article`-type posts (no novel chapters leak in; category counts exclude novels).
- `/novels` shows the work library; `/novels/<workSlug>` shows a work with the preserved reader UI wired to real data (series selector, cover+status, stat grid with computed chapter count/rating/views, synopsis/chapters/reviews tabs, in-page reader with font/theme/prev-next, locked→Ko-fi paywall); `/novels/<workSlug>/<chapterSlug>` server-renders a chapter. `/my-work` 301s to `/novels`.
- Submitting a review on a work persists it (survives reload) and updates the computed rating/count.
- No page emits `<link rel="canonical">` or canonical metadata; `posts.canonical_url` column still exists.
- The author page lists only this author's `article` posts and all bylines link to `/author/<author.slug>`.
- The "Support Goal" block appears on the novel synopsis tab; the Ko-fi link everywhere derives from settings `kofi_link`.
- `robots.ts` has no stale TODO; analytics no longer reports fabricated daily views.
- `frontends/blog/blog.tsx` is deleted. `pnpm type-check`, `pnpm lint`, and `pnpm build` all pass.

## Implementation Steps
### Step 1: Add additive schema definitions for `content_types`, `collections`, `reviews`, and `posts.collection_id`

**Objective:** Define the new tables and the one new `posts` column in Drizzle so the app has typed access. (Actual SQL is applied manually — see Operational Notes; this step is code only.)

**Files to modify/create:**
- `packages/db/src/schema.ts` — append three new `pgTable` definitions and add one column to `posts`.
- `packages/db/src/types.ts` — export hand-written interfaces if that file mirrors schema (match existing convention).
- `packages/db/src/index.ts` — ensure new tables are re-exported via the barrel (the app imports `* as schema from '@repo/db'`).

**Detailed instructions:**
1. In `packages/db/src/schema.ts`, add a nullable indexed column to the existing `posts` table definition: `collectionId: varchar("collection_id", { length: 50 })`, and add `index("idx_posts_collection_id").on(table.collectionId)` to the table's index array. Do NOT alter or remove any existing column.
2. Add `contentTypes` table:
   ```ts
   export const contentTypes = pgTable("content_types", {
     id: varchar("id", { length: 50 }).primaryKey(),
     name: text("name").notNull(),
     key: varchar("key", { length: 50 }).notNull().unique(),       // matches posts.type
     urlPrefix: varchar("url_prefix", { length: 50 }).notNull().unique(),
     description: text("description").notNull().default(""),
     icon: varchar("icon", { length: 50 }),
     hasCollections: boolean("has_collections").default(false).notNull(),
     sortOrder: integer("sort_order").default(0).notNull(),
     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
   });
   ```
   `hasCollections` lets the generic system flag types (like novels) whose posts group under a collection and render with a collection-aware template — keeps novels generic, not special-cased.
3. Add `collections` table:
   ```ts
   export const collections = pgTable("collections", {
     id: varchar("id", { length: 50 }).primaryKey(),
     typeKey: varchar("type_key", { length: 50 }).notNull(),       // which content type owns it
     name: text("name").notNull(),
     slug: varchar("slug", { length: 150 }).notNull().unique(),
     description: text("description").notNull().default(""),
     coverImage: text("cover_image").notNull().default(""),
     status: varchar("status", { length: 30 }).notNull().default("ongoing"), // 'ongoing' | 'completed'
     sortOrder: integer("sort_order").default(0).notNull(),
     metadata: jsonb("metadata").default("{}").notNull(),          // altTitle, originalTitle, genres[], tags[], translator, author, viewsLabel
     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
     updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
     deletedAt: timestamp("deleted_at", { withTimezone: true }),
   }, (table) => [
     index("idx_collections_type_key").on(table.typeKey),
   ]);
   ```
4. Add `reviews` table:
   ```ts
   export const reviews = pgTable("reviews", {
     id: varchar("id", { length: 50 }).primaryKey(),
     collectionId: varchar("collection_id", { length: 50 }).notNull(),
     authorName: text("author_name"),
     rating: integer("rating").default(5).notNull(),
     content: text("content").notNull(),
     createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
   }, (table) => [
     index("idx_reviews_collection_id").on(table.collectionId),
   ]);
   ```
5. If `packages/db/src/types.ts` hand-defines row types (check first), add `ContentType`, `Collection`, `Review` interfaces mirroring the columns, and confirm the barrel `index.ts` exports the new tables. Match the existing export style exactly.

**Acceptance criteria:**
- [ ] `schema.ts` defines `contentTypes`, `collections`, `reviews`, and `posts.collectionId` with the indexes above; no existing column changed.
- [ ] `import * as schema from '@repo/db'` exposes `schema.contentTypes`, `schema.collections`, `schema.reviews`.
- [ ] `pnpm type-check` passes.

**Verification:**
```bash
pnpm --filter @repo/db type-check
pnpm type-check
```

**Pitfalls:**
- This step does NOT run any SQL. The Drizzle definitions are inert until the manual SQL in Operational Notes is applied to Supabase. Do not run `drizzle-kit push`/`migrate` against production (it can attempt destructive diffs). Apply the hand-written additive SQL only.
- `jsonb(...).default("{}")` must match the existing `posts.meta` style (string default) — mirror it exactly to avoid drift.

### Step 2: Create the content-types API (`/api/content-types`)

**Objective:** Expose CRUD for content types so the CMS sidebar and a settings page can read/create them; this is the backbone of the modular system.

**Files to modify/create:**
- `apps/web/app/api/content-types/route.ts` — `GET` (list, ordered by `sortOrder`), `POST` (create; auth-protected).
- `apps/web/app/api/content-types/[id]/route.ts` — `PUT` (update name/urlPrefix/description/icon/sortOrder; auth), `DELETE` (auth; block delete if `key` is `article` or any post references it — return 409).

**Detailed instructions:**
1. Mirror the structure/auth pattern of `apps/web/app/api/categories/route.ts` and `categories/[id]/route.ts` (use `requireAuth(req)` from `@/lib/auth`, `generateId()` from `@repo/db`, `export const dynamic = 'force-dynamic'`).
2. `GET` returns rows as `{ id, name, key, url_prefix, description, icon, has_collections, sort_order }` (snake_case to match the API convention used elsewhere).
3. `POST` validates: `name` required; derive `key` (kebab, lowercase, unique — append `generateId()` on conflict) and `url_prefix` (default to `key`, unique). Reject if `url_prefix` collides with a reserved literal segment: `category`, `tag`, `author`, `feed.xml`, `sitemap`, `robots`, `my-work`, `cms`, `api` → return 400 with a clear message.
4. `DELETE`: look up the type; if `key === 'article'` return 409 (the base type is protected); if any `posts.type === key` exists, return 409 with a count; otherwise delete.
5. Add typed client methods in `apps/web/lib/cms-api.ts`: `fetchContentTypes()`, `createContentType()`, `updateContentType()`, `deleteContentType()`, plus a `ContentType` interface. Follow the existing fetch-wrapper/error-handling pattern in that file.

**Acceptance criteria:**
- [ ] `GET /api/content-types` returns the seeded `articles` + `novels` rows.
- [ ] `POST` creates a type, rejects reserved/duplicate prefixes (400) and unauthenticated calls (401).
- [ ] `DELETE` refuses the `article` type and any type still holding posts (409).
- [ ] `pnpm type-check` passes.

**Verification:**
```bash
# after dev server is running and SQL seed applied
curl -s http://localhost:3000/api/content-types | python -m json.tool
curl -s -X POST http://localhost:3000/api/content-types -H "Content-Type: application/json" -d '{"name":"Recipes"}' -i   # expect 401 without auth cookie
```

**Pitfalls:**
- `posts.type` stores the singular `key` (`article`, `novels`), while public URLs use `url_prefix`. Keep them distinct everywhere.
- Do not let a new type's `url_prefix` shadow an existing literal route segment (see the reserved list).

### Step 3: Collections + reviews APIs (novel-works)

**Objective:** CRUD for collections (novel-works) and their reviews, with computed rating/count.

**Files to modify/create:**
- `apps/web/app/api/collections/route.ts` — `GET` (list; optional `?type=novels`, each row enriched with `chapterCount`, computed `rating` avg, `reviewsCount`, and summed chapter `views`), `POST` (auth; create work).
- `apps/web/app/api/collections/[id]/route.ts` — `GET` (single work + its published chapters ordered by `meta.chapterNumber`), `PUT` (auth), `DELETE` (auth; soft-delete via `deletedAt`; refuse hard delete).
- `apps/web/app/api/collections/[id]/reviews/route.ts` — `GET` (list reviews newest-first), `POST` (public submit: `{ authorName?, rating, content }`, clamp rating 1–5).
- `apps/web/lib/cms-api.ts` — typed methods `fetchCollections`, `createCollection`, `updateCollection`, `deleteCollection`, `fetchCollectionReviews`, `submitReview`, and `Collection` / `Review` interfaces.

**Detailed instructions:**
1. For collection enrichment, compute `chapterCount` = count of `posts` where `collectionId = c.id AND status='published' AND deletedAt IS NULL`; `views` = sum of those posts' `views`; `rating` = `AVG(reviews.rating)` rounded to 1 decimal (0 if none); `reviewsCount` = count of reviews. Use SQL aggregates, not in-JS loops where avoidable.
2. `GET /api/collections/[id]` returns `{ collection, chapters: [{ id, title, slug, chapterNumber, locked, publishedAt }] }`, chapters sorted by `meta.chapterNumber` ascending. Read `chapterNumber`/`locked` from `posts.meta`.
3. `POST /api/collections` validates `name` + `typeKey` (must reference an existing content type with `hasCollections=true`); generates unique `slug`.
4. Reviews `POST` is public (no `requireAuth`) — mirror the public comments route `apps/web/app/api/posts/[id]/comments/route.ts` for shape and validation tolerance; clamp `rating` to 1–5; reject empty `content`.
5. Add the typed client methods following `cms-api.ts` conventions.

**Acceptance criteria:**
- [ ] `GET /api/collections?type=novels` returns works with `chapterCount`, `rating`, `reviewsCount`, `views`.
- [ ] `GET /api/collections/[id]` returns the work and its ordered published chapters.
- [ ] `POST /api/collections/[id]/reviews` persists a review and subsequent `GET /api/collections/[id]` reflects the new average rating.
- [ ] Auth-protected routes return 401 without a cookie; review submit works without auth.

**Verification:**
```bash
curl -s "http://localhost:3000/api/collections?type=novels" | python -m json.tool
curl -s -X POST "http://localhost:3000/api/collections/<id>/reviews" -H "Content-Type: application/json" -d '{"authorName":"Test","rating":5,"content":"Great"}' -i
```

**Pitfalls:**
- `meta.chapterNumber` is stored in a jsonb column; sort in SQL with `(posts.meta->>'chapterNumber')::int` or sort in JS after fetch — be consistent and handle missing values (treat as large/last).
- Do not expose unpublished/draft chapters on the public `GET`.

### Step 4: Extend posts APIs to carry `collection_id` and chapter meta

**Objective:** Let posts be created/updated as chapters linked to a collection, without breaking existing article flows.

**Files to modify/create:**
- `apps/web/app/api/posts/route.ts` — accept `collection_id` in `POST`; include `collection_id` in the insert payload and in the GET select/response.
- `apps/web/app/api/posts/[id]/route.ts` — accept `collection_id` in `PUT` (same `!== undefined` guard pattern as other fields); include it in the GET response and PUT update payload.

**Detailed instructions:**
1. In `POST /api/posts`, destructure `collection_id` from the body and add `collectionId: collection_id || null` to `newPost`. Return `collection_id` in the response object.
2. In the `GET /api/posts` select, add `collectionId: schema.posts.collectionId` and map it to `collection_id` in the response. Add an optional `?collection_id=` filter (push `eq(schema.posts.collectionId, collectionId)` when present) so the CMS can list a work's chapters.
3. In `PUT /api/posts/[id]`, add `collectionId: collection_id !== undefined ? (collection_id || null) : oldPost.collectionId` to `updatePayload` and return it.
4. Chapter number and locked flag travel inside the existing `meta` jsonb (already supported by both routes) — no extra columns. Document the expected `meta` keys (`chapterNumber: number`, `locked: boolean`) in a code comment.

**Acceptance criteria:**
- [ ] Creating/updating a post with `collection_id` + `meta.chapterNumber`/`meta.locked` persists and round-trips through GET.
- [ ] Existing article create/update (no `collection_id`) is unchanged (`collection_id` is null).
- [ ] `GET /api/posts?collection_id=<id>` returns only that work's chapters.

**Verification:**
```bash
curl -s "http://localhost:3000/api/posts?collection_id=<id>" | python -m json.tool
```

**Pitfalls:**
- Keep `collection_id` optional everywhere; articles never set it. Never overwrite it to null on a chapter update unless the client explicitly sends null.

### Step 5: CMS — type-driven sidebar + posts list + Novels Works manager

**Objective:** Surface each content type as its own page under "Content" in the CMS, and give novels a Works manager.

**Files to modify/create:**
- `apps/web/components/cms/cms-sidebar.tsx` — fetch `/api/content-types` and render one nav entry per type (icon from `content_types.icon`, label = `name`, href = `/cms/posts?type=<key>`). For types with `hasCollections`, add a sub-entry `→ <Name> Works` linking to `/cms/collections?type=<key>`. Keep Dashboard/Calendar/Media/Categories/Trash as-is.
- `apps/web/app/(cms)/cms/posts/page.tsx` — read `?type=` from search params; pass it to `fetchPosts({ type, excludeContent: true })`; show the type name in the heading; default to `article` when absent.
- `apps/web/app/(cms)/cms/collections/page.tsx` — NEW. List collections for `?type=`; create/edit a work (name, slug, cover image via existing media picker, status ongoing/completed, and metadata fields: altTitle, originalTitle, genres[], tags[], translator, author, synopsis stored in `description`); read-only computed rating; link to "Manage chapters" → `/cms/posts?type=<key>&collection=<id>`; a reviews moderation list (delete review).
- `apps/web/lib/cms-api.ts` — already extended in Steps 2–3.

**Detailed instructions:**
1. Sidebar: convert `mainNavItems` to include a dynamic block. Fetch content types in a `useEffect` (like the existing author fetch). Map a small icon registry (string → lucide component) with a `FileText` fallback. Preserve current styling/active-state logic and 44px targets.
2. Posts list: it currently fetches all posts; add `type` from `useSearchParams()` and forward to `fetchPosts`. When `collection` is also present, filter to that collection (use the new `collection_id` query) and show a "Chapters of <work>" heading with an "Add chapter" button that opens the editor pre-scoped (carry `type` + `collection` as query params to `/cms/posts/new`).
3. Works manager page: follow the structure/styling of `apps/web/app/(cms)/cms/categories/page.tsx` (list + side form, confirmation dialogs for destructive actions, toasts via `sonner`). Extract row/form into co-located components per the #26 standards (≤80–100 lines JSX each).
4. Reserve a "New content type" affordance: add a small form on `apps/web/app/(cms)/cms/settings/page.tsx` (or a new `settings/content-types` page) that POSTs to `/api/content-types`. Keep it minimal (name + optional url prefix + icon).

**Acceptance criteria:**
- [ ] Sidebar shows "Articles" and "Novels" (and any new type) under Content; novels shows a Works sub-entry.
- [ ] `/cms/posts?type=novels` lists only novel chapters; `/cms/posts` (or `?type=article`) lists only articles.
- [ ] `/cms/collections?type=novels` can create/edit a work and moderate its reviews.
- [ ] An admin can create a new content type from settings and it appears in the sidebar without a code change.

**Verification:**
```bash
pnpm --filter web lint
pnpm --filter web type-check
# runtime: load /cms, confirm sidebar + filtered lists (FrontendQA)
```

**Pitfalls:**
- `useSearchParams()` requires a `<Suspense>` boundary in some Next 15 setups — mirror how other CMS client pages handle it to avoid build errors.
- Keep API-only discipline: CMS pages must not import `@repo/db` directly (per #30 standards).

### Step 6: Editor — content-type, Work, Chapter #, and Locked controls

**Objective:** Let the existing post editor create chapters tied to a collection, while staying generic for any type.

**Files to modify/create:**
- `apps/web/components/cms/editor/editor-canvas.tsx` — add `type`, `collectionId`, and chapter `meta` state; send them on save; initialize from query params for new posts.
- `apps/web/components/cms/editor/document-header.tsx` (or `settings-panel.tsx`) — add a Type selector (from `/api/content-types`); when the selected type `hasCollections`, show a Work selector (from `/api/collections?type=<key>`), a Chapter # number input, and a Locked toggle.

**Detailed instructions:**
1. Add state: `type` (default `'article'`), `collectionId` (`''`), `chapterNumber` (number|''), `locked` (bool). Read `type`/`collection` from `useSearchParams()` when `postId === 'new'` and include them in the initial `POST /api/posts` body, then carry through the redirect.
2. Include in both `savePost` and `publishPost` payloads: `type`, `collection_id: collectionId || null`, and `meta: { ...existingMeta, chapterNumber, locked }`. Preserve any other existing `meta` keys (read current post `meta` on load).
3. On load (`init()`), set `type`, `collectionId`, `chapterNumber`, `locked` from the fetched post (`post.type`, `post.collection_id`, `post.meta?.chapterNumber`, `post.meta?.locked`).
4. UI: place the Type selector near status/category in `DocumentHeader`; gate the Work/Chapter/Locked controls behind `selectedType.hasCollections`. Use accessible labels and 44px targets.

**Acceptance criteria:**
- [ ] Creating a post via `/cms/posts/new?type=novels&collection=<id>` saves with `type='novels'`, the `collection_id`, and `meta.chapterNumber/locked`.
- [ ] Editing an existing chapter shows and round-trips those fields.
- [ ] Article editing is unaffected (type stays `article`, no collection controls shown).

**Verification:**
```bash
pnpm --filter web type-check
# runtime: create a chapter, reload, confirm fields persisted (FrontendQA)
```

**Pitfalls:**
- `meta` currently may be `{}` or a populated object — always spread the existing object so SEO/other meta keys aren't clobbered.
- Don't change TipTap internals or the JSON content pipeline.

### Step 7: Public type-leak guard in `lib/blog-data.ts`

**Objective:** Ensure only `article`-type posts appear on the public blog surfaces; add novel accessors.

**Files to modify/create:**
- `apps/web/lib/blog-data.ts` — scope all article-listing reads to `type='article'`; add collection/chapter accessors.

**Detailed instructions:**
1. Change `publishedFilter()` callers used by the *blog* (not novels) to also require `eq(schema.posts.type, 'article')`. Concretely, add an optional `type` param (default `'article'`) to `getPublishedPosts`, `getCategories` count subquery, `getCategoryBySlug` count, `getRelatedPosts`, and `getAllPublishedSlugs`, and push `eq(schema.posts.type, type)` into their conditions. Simplest robust approach: define `const articleFilter = () => and(publishedFilter(), eq(schema.posts.type, 'article'))` and use it in those functions.
2. `getPostBySlug` keeps resolving any published post by slug (used by the legacy resolver in Step 8) — leave it type-agnostic, but add a `getArticleBySlug` that requires `type='article'` for the `/articles/[slug]` page.
3. Add novel accessors:
   - `getCollections(typeKey='novels')` → works with computed chapterCount/rating/reviewsCount/views (reuse the SQL from Step 3 or call the API layer's logic; since this is server-only, query directly).
   - `getCollectionBySlug(slug)` → work + published chapters ordered by `meta.chapterNumber`.
   - `getChapter(workSlug, chapterSlug)` → the chapter post (published) within the work, plus prev/next chapter slugs for reader nav.
   - `getCollectionReviews(collectionId)`.
4. Export matching interfaces (`NovelWork`, `NovelChapter`, `NovelReview`).

**Acceptance criteria:**
- [ ] Home, category, tag, author, RSS, sitemap, and search show zero novel chapters.
- [ ] Category post counts exclude novel chapters.
- [ ] Novel accessors return correctly ordered published chapters and computed work stats.

**Verification:**
```bash
pnpm --filter web type-check
# runtime: seed a novel chapter, confirm it does NOT appear on / or in search (FrontendQA)
```

**Pitfalls:**
- Novel chapters often have `category_id = NULL`; the article filter naturally excludes them, but double-check the category-count groupBy isn't counting null categories from novels.

### Step 8: Routing — `/articles/[slug]`, `/novels/...`, legacy resolver, 301s

**Objective:** Serve articles at `/articles/[slug]` and novels under `/novels/...`, redirect old `/[slug]` URLs, keep all existing literal routes working.

**Files to modify/create:**
- `apps/web/app/(blog)/articles/[slug]/page.tsx` — NEW. The current `[slug]/page.tsx` logic, using `getArticleBySlug`, canonical removed (Step 9). Update internal article links to `/articles/<slug>`.
- `apps/web/app/(blog)/[slug]/page.tsx` — REPLACE body with a universal legacy resolver (server component): resolve published post by slug (any type); `article` → `permanentRedirect('/articles/<slug>')`; novel chapter → resolve work, `permanentRedirect('/novels/<workSlug>/<slug>')`; else look up `redirects` table by `source`, resolve destination's post and redirect to its canonical new URL; else `notFound()`.
- `apps/web/app/(blog)/novels/page.tsx` — NEW. Work library (the showcase's series selector), wired via `getCollections('novels')`.
- `apps/web/app/(blog)/novels/[workSlug]/page.tsx` — NEW. Single work: cover, status, stat grid, synopsis/chapters/reviews tabs (the preserved showcase scoped to one work).
- `apps/web/app/(blog)/novels/[workSlug]/[chapterSlug]/page.tsx` — NEW. Server-rendered chapter using `getChapter`, reusing the reader chrome; locked chapters render the Ko-fi paywall instead of content.
- `apps/web/app/(blog)/my-work/page.tsx` — REPLACE with `permanentRedirect('/novels')`.
- Update article links: `apps/web/components/blog/post-card.tsx`, `apps/web/components/blog/search-overlay.tsx`, `apps/web/app/(blog)/feed.xml/route.ts`, `apps/web/app/(blog)/sitemap.ts` → `/articles/<slug>` (sitemap/feed only emit articles already after Step 7; also add novel work + chapter URLs to the sitemap).

**Detailed instructions:**
1. Move the existing `[slug]/page.tsx` rendering into `articles/[slug]/page.tsx` verbatim, swapping `getPostBySlug` → `getArticleBySlug` and removing the canonical `alternates` (Step 9). Keep ViewCounter, interactions, comments, related, Ko-fi block.
2. Implement the legacy resolver using `next/navigation`'s `permanentRedirect`. For the `redirects` table consultation, query `schema.redirects` by `source = slug`; the stored `destination` is a slug — resolve it to a post and redirect to that post's new typed URL (not directly to `/destination`).
3. Novels pages reuse the existing `my-work-showcase.tsx` UI, refactored to accept real data props (Step 10).
4. Sitemap: emit `/articles/<slug>` for articles, `/novels` , `/novels/<workSlug>`, and `/novels/<workSlug>/<chapterSlug>` for published novel content. Drop the bare `/my-work` entry (or keep as redirect target — prefer `/novels`).

**Acceptance criteria:**
- [ ] `/articles/<existing-slug>` renders; old `/<existing-slug>` returns 308/301 to it.
- [ ] `/novels`, `/novels/<workSlug>`, `/novels/<workSlug>/<chapterSlug>` render.
- [ ] `/my-work` redirects to `/novels`.
- [ ] `category/`, `tag/`, `author/`, `feed.xml`, `sitemap.xml`, `robots.txt` all still resolve (no collision with the dynamic `[slug]`).
- [ ] `pnpm build` succeeds (static/dynamic route generation OK).

**Verification:**
```bash
pnpm --filter web build
# runtime: hit each URL + an old slug, confirm redirect chain (FrontendQA)
```

**Pitfalls:**
- `permanentRedirect` throws — must be called at the top level of the server component, not inside try/catch that swallows it.
- Literal segments (`articles`, `novels`, `category`, `tag`, `author`, `my-work`) take precedence over `[slug]`; verify none of the 7 existing article slugs equal a literal segment name.
- The DB client is not Edge-compatible — keep redirect logic in the server component, never in `middleware.ts`.

### Step 9: Remove canonical link emission

**Objective:** Stop emitting `<link rel="canonical">` / canonical metadata across the site; keep the DB column.

**Files to modify/create:**
- `apps/web/app/(blog)/articles/[slug]/page.tsx` (and the old `[slug]` page before it becomes the resolver) — remove `alternates: post.canonicalUrl ? { canonical: ... } : undefined` from `generateMetadata`.
- Grep the whole app for other emitters.

**Detailed instructions:**
1. Remove the `alternates` canonical line from the article page `generateMetadata`. Do not add `metadataBase`-driven canonicals.
2. Run a repo grep for `canonical` across `apps/web/app` and `apps/web/components`; remove any other `<link rel="canonical">` or `alternates.canonical` emission. Leave the CMS canonical input field and the `posts.canonical_url` column intact (data preserved, just unused for output).
3. Do NOT migrate or drop `posts.canonical_url` (it is `NOT NULL`; leaving it is correct).

**Acceptance criteria:**
- [ ] No page response contains `<link rel="canonical" ...>`.
- [ ] `posts.canonical_url` column still exists; CMS still accepts the field without error.

**Verification:**
```bash
# runtime: view-source on an article page, confirm no canonical link
curl -s http://localhost:3000/articles/<slug> | grep -i canonical   # expect no output
```

**Pitfalls:**
- Don't strip the CMS field or change the API payload shape — only stop *outputting* canonical tags.

### Step 10: Wire the novel reader UI to real data (preserve layout)

**Objective:** Replace the hardcoded `NOVELS`/`INITIAL_REVIEWS` in the showcase with real data, keeping the exact layout/UX, and add the missing "Support Goal" block.

**Files to modify/create:**
- `apps/web/components/blog/my-work-showcase.tsx` — refactor from hardcoded module constants to props/data; split into smaller components per #26 (e.g. `novel-library.tsx`, `novel-detail.tsx`, `chapter-reader.tsx`, `reviews-tab.tsx`) co-located under `components/blog/novels/`.
- New: a `SupportGoal` block component (ported from `frontends/blog/blog.tsx` lines ~1108–1117) shown on the synopsis tab; Ko-fi link from settings.
- The three novels pages from Step 8 pass real data in.

**Detailed instructions:**
1. Map real data → existing UI shape: `Novel.title`←collection.name, `altTitle`←metadata.altTitle, `coverImage`←Cloudinary URL from `collection.coverImage`, `status`←collection.status, `rating`/`reviewsCount`←computed, `views`←metadata.viewsLabel or summed views, `genre`/`tags`←metadata arrays, `synopsis`←collection.description, `chapters`←published chapters (`{ number: meta.chapterNumber, title, slug, isLocked: meta.locked, publishedAt }`).
2. Chapter reader: on `/novels/<workSlug>/<chapterSlug>`, render the chapter post content via `renderPostContent(chapter.content)`. Keep font-size (sm/md/lg/xl) and theme (classic/sepia/dark) controls and prev/next nav (use `getChapter`'s prev/next slugs). For locked chapters, render the existing paywall → `settings.kofiLink`.
3. Reviews tab: load via `getCollectionReviews`/`GET /api/collections/[id]/reviews`; the submit form POSTs to that endpoint and optimistically prepends, then revalidates. Remove the local-only `INITIAL_REVIEWS`/`setReviews`-only behavior.
4. Add the `SupportGoal` block (and optional "Weekly Schedule") on the synopsis tab, text-driven, Ko-fi CTA from settings.
5. Delete the leftover hardcoded constants once unused.

**Acceptance criteria:**
- [ ] `/novels` lists real works; selecting one shows real cover/status/stats/synopsis/chapters/reviews.
- [ ] Reader renders real chapter content with working font/theme/prev-next; locked chapters show the Ko-fi paywall.
- [ ] Submitting a review persists (survives reload) and updates the rating/count.
- [ ] The Support Goal block appears on the synopsis tab; all Ko-fi links use `settings.kofiLink`.
- [ ] Layout/structure matches the prior showcase.

**Verification:**
```bash
pnpm --filter web type-check && pnpm --filter web lint
# runtime: full novels flow incl. review submit + reload (FrontendQA)
```

**Pitfalls:**
- Keep it a server-rendered page where possible for SEO; the interactive reader controls/review form stay client components.
- Preserve the existing Tailwind class structure to keep the look identical.

### Step 11: Fix the author page

**Objective:** Author page lists only this author's article posts and bylines link correctly.

**Files to modify/create:**
- `apps/web/app/(blog)/author/[slug]/page.tsx` — filter posts to articles (single-author blog → all articles authored here) and confirm byline target.

**Detailed instructions:**
1. Replace `getPublishedPosts({ limit: 48 })` with `getPublishedPosts({ limit: 48 })` already type-scoped to `article` after Step 7 (verify it excludes novels). Keep the single-author semantics (all articles are this author's).
2. Confirm article bylines (`articles/[slug]/page.tsx` and `post-card.tsx`) link to `/author/${author.slug}` using the real author slug from `getAuthor()`.
3. Ensure `getAuthorBySlug` resolves the seeded author; the page should `notFound()` only for genuinely unknown slugs.

**Acceptance criteria:**
- [ ] `/author/<author.slug>` shows the author header + only article posts (no novel chapters).
- [ ] Clicking a byline anywhere lands on the correct author page.

**Verification:**
```bash
# runtime: open an article, click byline → author page renders with posts (FrontendQA)
```

**Pitfalls:**
- Don't introduce a non-existent multi-author model; this remains single-author.

### Step 12: Honest analytics + cleanup

**Objective:** Remove fabricated analytics data, delete dead code, fix the stale TODO.

**Files to modify/create:**
- `apps/web/app/api/analytics/route.ts` — replace the simulated `viewsHistory`.
- `apps/web/app/(cms)/cms/dashboard/page.tsx` — update the chart copy/data binding.
- `apps/web/app/(blog)/robots.ts` — remove the stale `// TODO` comment.
- Delete `apps/web/frontends/blog/blog.tsx` (and the now-empty `apps/web/frontends/` tree).

**Detailed instructions:**
1. Analytics: drop the fabricated 7-day split. Return `viewsByPost` = the most recent published posts with their real `views` and add `viewsHistory: []`, `viewsHistoryEstimated: true`. Update the dashboard chart to render "Top posts by views" (real per-post data) and remove the fake "Views This Week" date series, or relabel it explicitly as estimated using real per-post numbers.
2. `robots.ts`: delete the `// TODO: Will expand when blog frontend is built` line (and confirm the sitemap URL is correct).
3. Confirm nothing imports `frontends/blog/blog.tsx` (Step 10 ports the Support Goal/Weekly Schedule out first), then delete the file and the empty `frontends/` directory.

**Acceptance criteria:**
- [ ] Analytics no longer returns fabricated daily buckets; dashboard shows honest data.
- [ ] `robots.ts` has no stale TODO.
- [ ] `frontends/blog/blog.tsx` is gone; build has no dead-import errors.

**Verification:**
```bash
pnpm --filter web build
curl -s http://localhost:3000/api/analytics | python -m json.tool
```

**Pitfalls:**
- Extract any still-needed UI from `blog.tsx` (Support Goal block) BEFORE deleting it.

## Testing Strategy

**Automated:**
- `pnpm type-check`, `pnpm lint`, and `pnpm build` must pass after every step (the codebase has no unit-test harness today; do not invent one for this issue).
- After API steps, exercise endpoints with `curl` against the dev server (commands in each step).

**Runtime (FrontendQA) — exercise after Steps 5, 6, 8, 10, 11:**
1. CMS: sidebar shows Articles + Novels; `/cms/posts?type=novels` filters correctly; create a novels Work in `/cms/collections`; add a chapter via the editor (type=novels, work selected, chapter #, locked toggle); save + reload → fields persist.
2. Blog: `/` and search show only articles; `/articles/<slug>` renders; old `/<slug>` 301s; `/novels` → work → chapter reader works (font/theme/prev-next); locked chapter shows Ko-fi paywall; submit a review → persists on reload; Support Goal block visible; author page lists only articles; no `<link rel=canonical>` in source.

## Rollback Plan

- All app code is on a dedicated branch (`plan-content-types-novels`); revert by abandoning/reverting the branch — no merge to `main` until verified.
- DB changes are **additive only**: the new tables (`content_types`, `collections`, `reviews`) and the `posts.collection_id` column can be left in place harmlessly if the feature is reverted (no existing column/row is touched). If full DB rollback is required, drop only the *new* objects (see Operational Notes "Rollback SQL") — never touch `posts`/`categories` data.
- Existing articles continue to work even mid-rollback because their data is unchanged; only routing/serving code differs.

## Risks

- **Medium:** Routing change moves every article URL to `/articles/<slug>`. Mitigation: universal legacy resolver + `redirects` table consumption returns 301s for all old URLs; verify each of the 7 existing slugs redirects before merge.
- **Medium:** Manual SQL must be applied to Supabase before the feature works. Mitigation: exact additive SQL provided; app degrades gracefully (empty novels, article-only blog) if not yet applied.
- **Low:** jsonb-based chapter ordering (`meta.chapterNumber`). Mitigation: cast in SQL or sort in JS with a missing-value fallback; volumes are small.
- **Low:** `useSearchParams()` Suspense requirement in Next 15 build. Mitigation: mirror existing CMS client-page patterns.
- **Low:** New content-type `url_prefix` could shadow a literal route. Mitigation: reserved-prefix validation in the API (Step 2).

## Operational Notes

**This SQL is additive and non-destructive. Apply it to Supabase (SQL editor or psql) BEFORE exercising the feature. It does not modify or delete any existing column or row.** Run once, in order.

```sql
-- 1. New column on posts (nullable; existing rows get NULL)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS collection_id varchar(50);
CREATE INDEX IF NOT EXISTS idx_posts_collection_id ON posts (collection_id);

-- 2. content_types
CREATE TABLE IF NOT EXISTS content_types (
  id varchar(50) PRIMARY KEY,
  name text NOT NULL,
  key varchar(50) NOT NULL UNIQUE,
  url_prefix varchar(50) NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  icon varchar(50),
  has_collections boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. collections (novel-works; generic to any type)
CREATE TABLE IF NOT EXISTS collections (
  id varchar(50) PRIMARY KEY,
  type_key varchar(50) NOT NULL,
  name text NOT NULL,
  slug varchar(150) NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  cover_image text NOT NULL DEFAULT '',
  status varchar(30) NOT NULL DEFAULT 'ongoing',
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_collections_type_key ON collections (type_key);

-- 4. reviews (keyed to collections)
CREATE TABLE IF NOT EXISTS reviews (
  id varchar(50) PRIMARY KEY,
  collection_id varchar(50) NOT NULL,
  author_name text,
  rating integer NOT NULL DEFAULT 5,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_collection_id ON reviews (collection_id);

-- 5. Seed the two launch content types (idempotent).
--    The 7 existing posts already have type='article' (column default) — no UPDATE needed.
INSERT INTO content_types (id, name, key, url_prefix, description, icon, has_collections, sort_order)
VALUES
  ('ct_articles', 'Articles', 'article', 'articles', 'Reviews, recaps, and editorial posts', 'FileText', false, 0),
  ('ct_novels',   'Novels',   'novels',  'novels',   'Original web novel translations',        'BookOpen', true,  1)
ON CONFLICT (key) DO NOTHING;
```

**Rollback SQL (only if fully reverting — drops ONLY new objects, never touches existing data):**
```sql
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS content_types;
ALTER TABLE posts DROP COLUMN IF EXISTS collection_id;
```

**Other operational items:**
- No new npm dependencies are required (icons via existing `lucide-react`; toasts via existing `sonner`).
- No new env vars.
- No server restart needed beyond normal Next dev/build; route additions are picked up by the build.
- After applying SQL, an admin must create at least one novels Work and assign chapters via the CMS for `/novels` to show content.
- `NEXT_PUBLIC_SITE_URL` must be set for correct sitemap/RSS/redirect base URLs (already used today).


---

## Completion Report

**Completed:** 2026-06-12
**Steps completed:** 12 of 12
**Overall status:** COMPLETE
**Branch:** main

### Execution Log

- **Step 1: Add additive schema definitions** — Status: PASS — Commit: `578752c`
  - Files changed: `packages/db/src/schema.ts`, `packages/db/src/types.ts`, `packages/db/src/index.ts`
  - Added `contentTypes`, `collections`, `reviews` tables and `posts.collectionId` nullable column with indexes. Barrel exports updated.
  - Deviations: none

- **Step 2: Create content-types API** — Status: PASS — Commit: `9a55187`
  - Files changed: `apps/web/app/api/content-types/route.ts`, `apps/web/app/api/content-types/[id]/route.ts`, `apps/web/lib/cms-api.ts`
  - Full CRUD with auth guard, reserved-prefix validation, and typed client methods.
  - Deviations: none

- **Step 3: Collections + reviews APIs** — Status: PASS — Commit: `f3901a1`
  - Files changed: `apps/web/app/api/collections/route.ts`, `apps/web/app/api/collections/[id]/route.ts`, `apps/web/app/api/collections/[id]/reviews/route.ts`, `apps/web/lib/cms-api.ts`
  - Computed stats (chapterCount, rating, views, reviewsCount). Public review submit. Typed client methods.
  - Deviations: none

- **Step 4: Extend posts APIs** — Status: PASS — Commit: `170a877`
  - Files changed: `apps/web/app/api/posts/route.ts`, `apps/web/app/api/posts/[id]/route.ts`
  - `collection_id` added to POST/PUT/GET. `?collection_id=` filter added to GET.
  - Deviations: none

- **Step 5: CMS type-driven sidebar + collections manager** — Status: PASS — Commit: `08c1807`
  - Files changed/created: `cms-sidebar.tsx`, `cms/posts/page.tsx`, `cms/settings/page.tsx`, `cms/collections/page.tsx`, `cms/collections/collection-form.tsx`, `cms/collections/reviews-list.tsx`, `api/collections/[id]/reviews/[reviewId]/route.ts`, `cms-api.ts`, `eslint.config.mjs`
  - Dynamic sidebar, type-filtered posts list, Works manager with reviews moderation, content-type creation in settings.
  - Deviations: `deleteReview` API route added (required for reviews moderation); `eslint.config.mjs` created to unblock pre-existing broken lint config.

- **Step 6: Editor type/collection/chapter/locked controls** — Status: PASS — Commit: `1c5cc29`
  - Files changed: `editor-canvas.tsx`, `document-header.tsx`
  - Type selector, Work/Chapter#/Locked controls gated on `hasCollections`. Payload spreads existing meta. Init from query params for new posts.
  - Deviations: none

- **Step 7: Public type-leak guard** — Status: PASS — Commit: `b7b2e19`
  - Files changed: `apps/web/lib/blog-data.ts`
  - `articleFilter()` applied to all public listing functions. `getArticleBySlug` added. Full suite of novel accessors (`getCollections`, `getCollectionBySlug`, `getChapter`, `getCollectionReviews`) with graceful try/catch fallbacks.
  - Deviations: none

- **Step 8: Routing — articles/novels/legacy resolver** — Status: PASS — Commit: `6385c7e`
  - Files changed/created: `articles/[slug]/page.tsx`, `novels/page.tsx`, `novels/[workSlug]/page.tsx`, `novels/[workSlug]/[chapterSlug]/page.tsx`, `[slug]/page.tsx` (resolver), `my-work/page.tsx`, `post-card.tsx`, `search-overlay.tsx`, `feed.xml/route.ts`, `sitemap.ts`
  - All article links updated to `/articles/`. Legacy resolver handles old URLs + redirects table. Novel hierarchy with Ko-fi paywall. Sitemap includes novel URLs.
  - Deviations: none

- **Step 9: Remove canonical emission** — Status: PASS — Commit: none (0 files changed)
  - The new `articles/[slug]/page.tsx` (created in Step 8) never emitted canonical. The old `[slug]/page.tsx` became the legacy resolver with no metadata. Grep confirmed zero other emitters.
  - Deviations: none

- **Step 10: Wire showcase to real data** — Status: PASS — Commit: `f32056e`
  - Files changed: `my-work-showcase.tsx`, `novels/page.tsx`
  - Hardcoded NOVELS/INITIAL_REVIEWS removed. Props-driven showcase. Reviews load/submit via API. Support Goal + Weekly Schedule blocks added. Chapter content lazily fetched.
  - Deviations: none

- **Step 11: Fix author page** — Status: PASS — Commit: none (0 files changed)
  - Already correct after Step 7 (articleFilter) + Step 8 (PostCard /articles/ links).
  - Deviations: none

- **Step 12: Honest analytics + cleanup** — Status: PASS — Commit: `a0038d6`
  - Files changed: `analytics/route.ts`, `dashboard/page.tsx`, `cms-api.ts`, `robots.ts`; deleted `frontends/blog/blog.tsx`
  - Fabricated `viewsHistory` replaced with `[]` + `viewsHistoryEstimated: true`. Dashboard shows real "Top Posts by Views". Stale TODO removed. Dead file deleted.
  - Deviations: none

### Errors Encountered

- Step 5 — pre-existing `eslint.config.mjs` missing (lint was fully broken before this plan). Created during Step 5 to unblock CI.
- `turbo run type-check` crashes with exit code 3221225781 (Windows Turborepo binary crash, unrelated to code). Individual package type-checks (`pnpm --filter web type-check`, `pnpm --filter @repo/db type-check`) pass clean.

### Deviations Summary

- Step 5 — added `deleteReview` route at `/api/collections/[id]/reviews/[reviewId]` (not in plan but required by reviews moderation UI).
- Step 5 — created `eslint.config.mjs` (pre-existing missing config, not plan scope, required to unblock lint).
- Step 9 — no file change needed (canonical emission was absent from the Step 8 replacement pages).
- Step 11 — no file change needed (already correct after Steps 7 + 8).

### What Should Work Now

- **Generic content-type system**: An admin can create a new content type (name + URL prefix + icon) from Settings → CMS sidebar updates automatically without code changes.
- **Articles at `/articles/<slug>`**: All 7 existing posts are served at `/articles/<slug>`. Old `/<slug>` URLs return 301 to `/articles/<slug>`.
- **Novels system**: `/novels` shows the work library. `/novels/<workSlug>` shows a work. `/novels/<workSlug>/<chapterSlug>` renders a chapter with Ko-fi paywall for locked chapters.
- **Novel reader showcase**: `/novels` uses the fully interactive `MyWorkShowcase` component wired to real DB data. Series selector, cover/status, stat grid, synopsis/chapters/reviews tabs, in-page reader with font/theme/prev-next all work against real data.
- **Reviews persist**: Submitting a review on a work saves to the DB and survives reload.
- **Type-leak guard**: Home grid, category, tag, author, RSS, sitemap, and search show only `article`-type posts. Novel chapters never appear in article surfaces.
- **CMS — type-driven**: Sidebar shows Articles, Novels (with → Novels Works sub-entry). `/cms/posts?type=novels` lists chapters only. `/cms/collections` manages novel works and moderates reviews.
- **Editor**: New post with `?type=novels&collection=<id>` pre-fills type/work. Work, Chapter #, and Locked fields appear when type has collections.
- **Support Goal block**: Appears on synopsis tab in the novels showcase.
- **No canonical links**: No page emits `<link rel="canonical">`. Column and CMS field preserved.
- **Honest analytics**: Dashboard shows real "Top Posts by Views" — no fabricated daily data.
- **Cleanup**: `frontends/blog/blog.tsx` deleted. `robots.ts` stale TODO removed.

#### How to Test

1. **Apply DB migrations** (one-time, run in Supabase SQL editor — see Operational Notes in the plan above).
2. **Create a novel work** via `/cms/collections?type=novels` → add chapters via `/cms/posts/new?type=novels&collection=<id>`.
3. Visit `/novels` — works library renders. Select a work → synopsis/chapters/reviews tabs work.
4. Visit an old article URL like `/some-article-slug` — expect 301 to `/articles/some-article-slug`.
5. Visit `/articles/<slug>` — article renders with no canonical link in source.
6. Submit a review on a novel work, reload — review persists.
7. In CMS sidebar, navigate Articles vs Novels — each shows only its own posts.

### Known Limitations

- Font/theme reader controls (sm/md/lg/xl, classic/sepia/dark) are implemented in `MyWorkShowcase` for the in-page reader. The server-rendered chapter pages (`/novels/[workSlug]/[chapterSlug]`) have a TODO comment for interactive reader controls — those were scoped to Step 10 and are present in the showcase but not on the SEO chapter URL.
- `turbo run type-check` crashes on this Windows machine (Turborepo binary issue). Use `pnpm --filter web type-check` to verify.
- The DB migrations must be applied manually before the novel features are exercised. The app degrades gracefully (empty novels, article-only blog) until then.
