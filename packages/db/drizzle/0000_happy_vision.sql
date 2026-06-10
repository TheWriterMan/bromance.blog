CREATE TABLE "authors" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"bio" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "authors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "backups" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"cloudinary_id" text NOT NULL,
	"filename" text NOT NULL,
	"bytes" integer NOT NULL,
	"post_count" integer NOT NULL,
	"category_count" integer NOT NULL,
	"tag_count" integer NOT NULL,
	"media_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"parent_id" varchar(50),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"post_id" varchar(50) NOT NULL,
	"author_name" text,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"cloudinary_id" text NOT NULL,
	"filename" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"format" text NOT NULL,
	"bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_likes" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"post_id" varchar(50) NOT NULL,
	"visitor_id" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_revisions" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"post_id" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_tags" (
	"post_id" varchar(50) NOT NULL,
	"tag_id" varchar(50) NOT NULL,
	CONSTRAINT "post_tags_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"summary" text NOT NULL,
	"status" text NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"category_id" varchar(50),
	"featured_image" text NOT NULL,
	"meta_title" text NOT NULL,
	"meta_description" text NOT NULL,
	"canonical_url" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"noindex" boolean DEFAULT false NOT NULL,
	"og_image" text,
	"discussion_open" boolean DEFAULT true NOT NULL,
	"type" varchar(50) DEFAULT 'article' NOT NULL,
	"meta" jsonb DEFAULT '{}' NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"source" varchar(255) NOT NULL,
	"destination" varchar(255) NOT NULL,
	"permanent" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redirects_source_unique" UNIQUE("source")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_revisions" ADD CONSTRAINT "post_revisions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_categories_parent_id" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_comments_post_id" ON "comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_likes_post_id" ON "post_likes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_revisions_post_id" ON "post_revisions" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_tags_post_id" ON "post_tags" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_tags_tag_id" ON "post_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_posts_category_id" ON "posts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_posts_status" ON "posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_posts_type" ON "posts" USING btree ("type");