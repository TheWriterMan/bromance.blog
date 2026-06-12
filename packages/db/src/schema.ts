import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

// ─── Categories ──────────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description").notNull(),
  parentId: varchar("parent_id", { length: 50 }).references((): any => categories.id, { onDelete: "set null" }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("idx_categories_parent_id").on(table.parentId),
]);

// ─── Tags ────────────────────────────────────────────────────────────────────

export const tags = pgTable("tags", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
});

// ─── Posts ───────────────────────────────────────────────────────────────────

export const posts = pgTable("posts", {
  id: varchar("id", { length: 50 }).primaryKey(),
  title: text("title").notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  summary: text("summary").notNull(),
  status: text("status").notNull(), // 'draft' | 'published' | 'scheduled'
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  categoryId: varchar("category_id", { length: 50 }).references(() => categories.id, { onDelete: "set null" }),
  featuredImage: text("featured_image").notNull(),
  metaTitle: text("meta_title").notNull(),
  metaDescription: text("meta_description").notNull(),
  canonicalUrl: text("canonical_url").notNull(),
  views: integer("views").default(0).notNull(),
  noindex: boolean("noindex").default(false).notNull(),
  ogImage: text("og_image"),
  discussionOpen: boolean("discussion_open").default(true).notNull(),
  type: varchar("type", { length: 50 }).default("article").notNull(),
  meta: jsonb("meta").default("{}").notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("idx_posts_category_id").on(table.categoryId),
  index("idx_posts_status").on(table.status),
  index("idx_posts_type").on(table.type),
]);

// ─── Post Tags (junction) ────────────────────────────────────────────────────

export const postTags = pgTable("post_tags", {
  postId: varchar("post_id", { length: 50 }).references(() => posts.id, { onDelete: "cascade" }).notNull(),
  tagId: varchar("tag_id", { length: 50 }).references(() => tags.id, { onDelete: "cascade" }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.postId, table.tagId] }),
  index("idx_post_tags_post_id").on(table.postId),
  index("idx_post_tags_tag_id").on(table.tagId),
]);

// ─── Media Items ─────────────────────────────────────────────────────────────

export const mediaItems = pgTable("media_items", {
  id: varchar("id", { length: 50 }).primaryKey(),
  cloudinaryId: text("cloudinary_id").notNull(),
  filename: text("filename").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  format: text("format").notNull(),
  bytes: integer("bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Post Revisions ──────────────────────────────────────────────────────────

export const postRevisions = pgTable("post_revisions", {
  id: varchar("id", { length: 50 }).primaryKey(),
  postId: varchar("post_id", { length: 50 }).references(() => posts.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  updatedBy: text("updated_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_post_revisions_post_id").on(table.postId),
]);

// ─── Redirects ───────────────────────────────────────────────────────────────

export const redirects = pgTable("redirects", {
  id: varchar("id", { length: 50 }).primaryKey(),
  source: varchar("source", { length: 255 }).notNull().unique(),
  destination: varchar("destination", { length: 255 }).notNull(),
  permanent: boolean("permanent").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Authors ─────────────────────────────────────────────────────────────────

export const authors = pgTable("authors", {
  id: varchar("id", { length: 50 }).primaryKey(),
  displayName: text("display_name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Post Likes ──────────────────────────────────────────────────────────────

export const postLikes = pgTable("post_likes", {
  id: varchar("id", { length: 50 }).primaryKey(),
  postId: varchar("post_id", { length: 50 }).references(() => posts.id, { onDelete: "cascade" }).notNull(),
  visitorId: varchar("visitor_id", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_post_likes_post_id").on(table.postId),
]);

// ─── Comments ────────────────────────────────────────────────────────────────

export const comments = pgTable("comments", {
  id: varchar("id", { length: 50 }).primaryKey(),
  postId: varchar("post_id", { length: 50 }).references(() => posts.id, { onDelete: "cascade" }).notNull(),
  authorName: text("author_name"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_comments_post_id").on(table.postId),
]);

// ─── Settings (key-value store) ──────────────────────────────────────────────

export const settings = pgTable("settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Backups ─────────────────────────────────────────────────────────────────

export const backups = pgTable("backups", {
  id: varchar("id", { length: 50 }).primaryKey(),
  cloudinaryId: text("cloudinary_id").notNull(),
  filename: text("filename").notNull(),
  bytes: integer("bytes").notNull(),
  postCount: integer("post_count").notNull(),
  categoryCount: integer("category_count").notNull(),
  tagCount: integer("tag_count").notNull(),
  mediaCount: integer("media_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Content Types ───────────────────────────────────────────────────────────

export const contentTypes = pgTable("content_types", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: text("name").notNull(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  urlPrefix: varchar("url_prefix", { length: 50 }).notNull().unique(),
  description: text("description").notNull().default(""),
  icon: varchar("icon", { length: 50 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
