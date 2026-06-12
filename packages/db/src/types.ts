// Type interfaces used by components and API routes

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  deletedAt: Date | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  status: "draft" | "published" | "scheduled";
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string | null;
  featuredImage: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  views: number;
  noindex: boolean;
  ogImage: string | null;
  discussionOpen: boolean;
  type: string;
  meta: Record<string, unknown>;
  deletedAt: Date | null;
}

export interface PostTag {
  postId: string;
  tagId: string;
}

export interface MediaItem {
  id: string;
  cloudinaryId: string;
  filename: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  createdAt: Date;
}

export interface PostRevision {
  id: string;
  postId: string;
  title: string;
  content: string;
  updatedBy: string;
  createdAt: Date;
}

export interface Redirect {
  id: string;
  source: string;
  destination: string;
  permanent: boolean;
  createdAt: Date;
}

export interface Author {
  id: string;
  displayName: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostLike {
  id: string;
  postId: string;
  visitorId: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  authorName: string | null;
  content: string;
  createdAt: Date;
}

export interface Setting {
  key: string;
  value: string;
  updatedAt: Date;
}

export interface Backup {
  id: string;
  cloudinaryId: string;
  filename: string;
  bytes: number;
  postCount: number;
  categoryCount: number;
  tagCount: number;
  mediaCount: number;
  createdAt: Date;
}

export interface ContentType {
  id: string;
  name: string;
  key: string;
  urlPrefix: string;
  description: string;
  icon: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Schema {
  categories: Category[];
  tags: Tag[];
  posts: Post[];
  postTags: PostTag[];
  media: MediaItem[];
  revisions: PostRevision[];
  settings: Setting[];
  backups: Backup[];
  contentTypes: ContentType[];
}
