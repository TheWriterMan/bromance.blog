// Mock data for the Inkwell CMS — all API calls would replace these in production

export type PostStatus = 'published' | 'draft' | 'scheduled' | 'trash'
export type PostType = 'article' | 'tutorial' | 'review' | 'opinion'

export interface Post {
  id: string
  title: string
  slug: string
  status: PostStatus
  type: PostType
  category: string
  categoryId: string
  excerpt: string
  coverImage: string
  publishedAt: string | null
  scheduledAt: string | null
  createdAt: string
  updatedAt: string
  views: number
  readTime: number
  featured: boolean
  tags: string[]
  author: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  parentId: string | null
  parentName: string | null
  postCount: number
  createdAt: string
}

export interface MediaItem {
  id: string
  filename: string
  url: string
  type: 'image' | 'video' | 'document'
  mimeType: string
  size: number
  width?: number
  height?: number
  alt: string
  uploadedAt: string
  usedIn: number
}

export interface BackupEntry {
  id: string
  createdAt: string
  sizeBytes: number
  postCount: number
  categoryCount: number
  mediaCount: number
  status: 'complete' | 'in-progress' | 'failed'
  triggeredBy: 'manual' | 'scheduled'
}

export interface SiteSettings {
  siteName: string
  tagline: string
  description: string
  copyright: string
  url: string
  locale: string
  timezone: string
  postsPerPage: number
  maintenanceMode: boolean
}

export interface AuthorProfile {
  name: string
  displayName: string
  email: string
  bio: string
  avatar: string
  website: string
  twitter: string
  linkedin: string
  location: string
  pronouns: string
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: 'The Future of Web Development: What to Expect in 2026',
    slug: 'future-web-development-2026',
    status: 'published',
    type: 'article',
    category: 'Technology',
    categoryId: 'cat-1',
    excerpt: 'A deep dive into the trends shaping modern web development.',
    coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=225&fit=crop',
    publishedAt: '2026-06-01T09:00:00Z',
    scheduledAt: null,
    createdAt: '2026-05-28T14:22:00Z',
    updatedAt: '2026-06-01T08:45:00Z',
    views: 12847,
    readTime: 8,
    featured: true,
    tags: ['webdev', 'javascript', 'react'],
    author: 'Sarah Chen',
  },
  {
    id: '2',
    title: 'Mastering TypeScript Generics: A Complete Guide',
    slug: 'mastering-typescript-generics',
    status: 'published',
    type: 'tutorial',
    category: 'Technology',
    categoryId: 'cat-1',
    excerpt: 'Everything you need to know about TypeScript generics with practical examples.',
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=225&fit=crop',
    publishedAt: '2026-05-22T10:00:00Z',
    scheduledAt: null,
    createdAt: '2026-05-18T16:30:00Z',
    updatedAt: '2026-05-22T09:30:00Z',
    views: 8932,
    readTime: 12,
    featured: false,
    tags: ['typescript', 'javascript'],
    author: 'Sarah Chen',
  },
  {
    id: '3',
    title: 'Why Slow Mornings Changed My Productivity',
    slug: 'slow-mornings-productivity',
    status: 'draft',
    type: 'opinion',
    category: 'Lifestyle',
    categoryId: 'cat-3',
    excerpt: 'Rushing out of bed killed my creativity. Here\'s what I changed.',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop',
    publishedAt: null,
    scheduledAt: null,
    createdAt: '2026-06-08T07:15:00Z',
    updatedAt: '2026-06-10T11:20:00Z',
    views: 0,
    readTime: 5,
    featured: false,
    tags: ['productivity', 'lifestyle', 'morning-routine'],
    author: 'Sarah Chen',
  },
  {
    id: '4',
    title: 'Review: Notion vs. Obsidian for Serious Writers',
    slug: 'notion-vs-obsidian-writers',
    status: 'scheduled',
    type: 'review',
    category: 'Tools',
    categoryId: 'cat-4',
    excerpt: 'I used both for 90 days. Here is an honest, detailed comparison.',
    coverImage: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=225&fit=crop',
    publishedAt: null,
    scheduledAt: '2026-06-15T09:00:00Z',
    createdAt: '2026-06-05T13:40:00Z',
    updatedAt: '2026-06-09T17:05:00Z',
    views: 0,
    readTime: 10,
    featured: false,
    tags: ['tools', 'writing', 'productivity'],
    author: 'Sarah Chen',
  },
  {
    id: '5',
    title: 'Building a Design System from Scratch',
    slug: 'design-system-from-scratch',
    status: 'published',
    type: 'tutorial',
    category: 'Design',
    categoryId: 'cat-2',
    excerpt: 'Step-by-step guide to creating a scalable design system for your team.',
    coverImage: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=225&fit=crop',
    publishedAt: '2026-05-10T10:00:00Z',
    scheduledAt: null,
    createdAt: '2026-05-05T09:00:00Z',
    updatedAt: '2026-05-10T09:45:00Z',
    views: 6421,
    readTime: 15,
    featured: true,
    tags: ['design', 'ux', 'figma'],
    author: 'Sarah Chen',
  },
  {
    id: '6',
    title: 'The Psychology of Color in UI Design',
    slug: 'psychology-color-ui-design',
    status: 'published',
    type: 'article',
    category: 'Design',
    categoryId: 'cat-2',
    excerpt: 'How color choices subconsciously affect user behavior and perception.',
    coverImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=225&fit=crop',
    publishedAt: '2026-04-28T10:00:00Z',
    scheduledAt: null,
    createdAt: '2026-04-22T11:00:00Z',
    updatedAt: '2026-04-28T09:30:00Z',
    views: 9103,
    readTime: 7,
    featured: false,
    tags: ['design', 'psychology', 'color'],
    author: 'Sarah Chen',
  },
  {
    id: '7',
    title: 'My Honest Take on the Apple Vision Pro After 3 Months',
    slug: 'apple-vision-pro-3-months',
    status: 'draft',
    type: 'review',
    category: 'Technology',
    categoryId: 'cat-1',
    excerpt: 'The hype has settled. Here is what it is actually like to use it daily.',
    coverImage: 'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=400&h=225&fit=crop',
    publishedAt: null,
    scheduledAt: null,
    createdAt: '2026-06-07T14:00:00Z',
    updatedAt: '2026-06-10T10:00:00Z',
    views: 0,
    readTime: 9,
    featured: false,
    tags: ['apple', 'vr', 'review'],
    author: 'Sarah Chen',
  },
  {
    id: '8',
    title: 'An Ode to Sourdough: What Baking Taught Me About Patience',
    slug: 'sourdough-patience',
    status: 'scheduled',
    type: 'opinion',
    category: 'Lifestyle',
    categoryId: 'cat-3',
    excerpt: 'There is a life philosophy buried in a well-timed loaf.',
    coverImage: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=400&h=225&fit=crop',
    publishedAt: null,
    scheduledAt: '2026-06-20T08:00:00Z',
    createdAt: '2026-06-03T09:30:00Z',
    updatedAt: '2026-06-09T08:00:00Z',
    views: 0,
    readTime: 4,
    featured: false,
    tags: ['baking', 'lifestyle', 'patience'],
    author: 'Sarah Chen',
  },
  {
    id: '9',
    title: 'The Real Cost of Technical Debt',
    slug: 'real-cost-technical-debt',
    status: 'trash',
    type: 'article',
    category: 'Technology',
    categoryId: 'cat-1',
    excerpt: 'Why "we will fix it later" is the most expensive sentence in software.',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
    publishedAt: null,
    scheduledAt: null,
    createdAt: '2026-04-10T10:00:00Z',
    updatedAt: '2026-05-01T09:00:00Z',
    views: 0,
    readTime: 6,
    featured: false,
    tags: ['engineering', 'software'],
    author: 'Sarah Chen',
  },
  {
    id: '10',
    title: 'CSS Grid vs Flexbox: When to Use Which',
    slug: 'css-grid-vs-flexbox',
    status: 'trash',
    type: 'tutorial',
    category: 'Technology',
    categoryId: 'cat-1',
    excerpt: 'The definitive answer to the age-old CSS layout debate.',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop',
    publishedAt: null,
    scheduledAt: null,
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-05-02T11:00:00Z',
    views: 0,
    readTime: 8,
    featured: false,
    tags: ['css', 'webdev'],
    author: 'Sarah Chen',
  },
]

// ─── Categories ──────────────────────────────────────────────────────────────

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Technology',
    slug: 'technology',
    description: 'Software, hardware, and the future of tech.',
    parentId: null,
    parentName: null,
    postCount: 5,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cat-1a',
    name: 'Web Development',
    slug: 'web-development',
    description: 'Frontend, backend, and full-stack topics.',
    parentId: 'cat-1',
    parentName: 'Technology',
    postCount: 3,
    createdAt: '2024-01-05T00:00:00Z',
  },
  {
    id: 'cat-1b',
    name: 'Hardware & Gadgets',
    slug: 'hardware-gadgets',
    description: 'Reviews and news about physical tech products.',
    parentId: 'cat-1',
    parentName: 'Technology',
    postCount: 2,
    createdAt: '2024-01-08T00:00:00Z',
  },
  {
    id: 'cat-2',
    name: 'Design',
    slug: 'design',
    description: 'UI/UX, visual design, and creative process.',
    parentId: null,
    parentName: null,
    postCount: 2,
    createdAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'cat-2a',
    name: 'UX Research',
    slug: 'ux-research',
    description: 'User research methods and insights.',
    parentId: 'cat-2',
    parentName: 'Design',
    postCount: 1,
    createdAt: '2024-02-10T00:00:00Z',
  },
  {
    id: 'cat-3',
    name: 'Lifestyle',
    slug: 'lifestyle',
    description: 'Personal growth, habits, and everyday life.',
    parentId: null,
    parentName: null,
    postCount: 2,
    createdAt: '2024-01-03T00:00:00Z',
  },
  {
    id: 'cat-4',
    name: 'Tools',
    slug: 'tools',
    description: 'Apps, services, and gear that help you work better.',
    parentId: null,
    parentName: null,
    postCount: 1,
    createdAt: '2024-01-04T00:00:00Z',
  },
]

// ─── Media ───────────────────────────────────────────────────────────────────

export const MOCK_MEDIA: MediaItem[] = [
  { id: 'm1', filename: 'hero-banner.jpg', url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop', type: 'image', mimeType: 'image/jpeg', size: 284320, width: 1920, height: 1080, alt: 'Code on screen', uploadedAt: '2026-06-01T09:00:00Z', usedIn: 1 },
  { id: 'm2', filename: 'typescript-cover.jpg', url: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=600&fit=crop', type: 'image', mimeType: 'image/jpeg', size: 198450, width: 1920, height: 1080, alt: 'TypeScript code', uploadedAt: '2026-05-22T10:00:00Z', usedIn: 1 },
  { id: 'm3', filename: 'morning-light.jpg', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', type: 'image', mimeType: 'image/jpeg', size: 312780, width: 1920, height: 1280, alt: 'Sunrise mountain', uploadedAt: '2026-06-08T07:15:00Z', usedIn: 1 },
  { id: 'm4', filename: 'notebook-planning.jpg', url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop', type: 'image', mimeType: 'image/jpeg', size: 245100, width: 1600, height: 1066, alt: 'Notebook and pen', uploadedAt: '2026-06-05T13:40:00Z', usedIn: 1 },
  { id: 'm5', filename: 'design-system.jpg', url: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=600&fit=crop', type: 'image', mimeType: 'image/jpeg', size: 167890, width: 1920, height: 1080, alt: 'Design components', uploadedAt: '2026-05-10T10:00:00Z', usedIn: 1 },
  { id: 'm6', filename: 'color-palette.jpg', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&h=600&fit=crop', type: 'image', mimeType: 'image/jpeg', size: 223400, width: 1920, height: 1280, alt: 'Colorful abstract', uploadedAt: '2026-04-28T10:00:00Z', usedIn: 1 },
  { id: 'm7', filename: 'vr-headset.jpg', url: 'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=800&h=600&fit=crop', type: 'image', mimeType: 'image/jpeg', size: 291000, width: 1920, height: 1080, alt: 'VR headset', uploadedAt: '2026-06-07T14:00:00Z', usedIn: 1 },
  { id: 'm8', filename: 'sourdough.jpg', url: 'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=800&h=600&fit=crop', type: 'image', mimeType: 'image/jpeg', size: 178650, width: 1600, height: 1066, alt: 'Sourdough bread loaf', uploadedAt: '2026-06-03T09:30:00Z', usedIn: 1 },
  { id: 'm9', filename: 'author-headshot.jpg', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', type: 'image', mimeType: 'image/jpeg', size: 89200, width: 400, height: 400, alt: 'Author photo', uploadedAt: '2024-01-01T00:00:00Z', usedIn: 3 },
  { id: 'm10', filename: 'analytics-chart.jpg', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', type: 'image', mimeType: 'image/jpeg', size: 134500, width: 1600, height: 1066, alt: 'Analytics dashboard', uploadedAt: '2026-04-10T10:00:00Z', usedIn: 0 },
  { id: 'm11', filename: 'dev-workspace.jpg', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop', type: 'image', mimeType: 'image/jpeg', size: 256700, width: 1920, height: 1280, alt: 'Developer workspace', uploadedAt: '2026-03-15T10:00:00Z', usedIn: 0 },
  { id: 'm12', filename: 'coffee-writing.jpg', url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=600&fit=crop', type: 'image', mimeType: 'image/jpeg', size: 192300, width: 1920, height: 1280, alt: 'Coffee and writing', uploadedAt: '2026-02-20T11:00:00Z', usedIn: 0 },
]

// ─── Backups ─────────────────────────────────────────────────────────────────

export const MOCK_BACKUPS: BackupEntry[] = [
  { id: 'bk1', createdAt: '2026-06-10T02:00:00Z', sizeBytes: 24350000, postCount: 8, categoryCount: 7, mediaCount: 12, status: 'complete', triggeredBy: 'scheduled' },
  { id: 'bk2', createdAt: '2026-06-09T14:32:00Z', sizeBytes: 24100000, postCount: 8, categoryCount: 7, mediaCount: 11, status: 'complete', triggeredBy: 'manual' },
  { id: 'bk3', createdAt: '2026-06-09T02:00:00Z', sizeBytes: 23800000, postCount: 7, categoryCount: 7, mediaCount: 11, status: 'complete', triggeredBy: 'scheduled' },
  { id: 'bk4', createdAt: '2026-06-08T02:00:00Z', sizeBytes: 21500000, postCount: 7, categoryCount: 6, mediaCount: 10, status: 'complete', triggeredBy: 'scheduled' },
  { id: 'bk5', createdAt: '2026-06-07T02:00:00Z', sizeBytes: 19200000, postCount: 6, categoryCount: 6, mediaCount: 10, status: 'complete', triggeredBy: 'scheduled' },
  { id: 'bk6', createdAt: '2026-06-06T02:00:00Z', sizeBytes: 18900000, postCount: 6, categoryCount: 5, mediaCount: 9, status: 'complete', triggeredBy: 'scheduled' },
]

// ─── Site Settings ────────────────────────────────────────────────────────────

export const MOCK_SITE_SETTINGS: SiteSettings = {
  siteName: 'Inkwell',
  tagline: 'Thoughtful writing on tech, design, and life.',
  description: 'A personal blog exploring the intersection of technology, design thinking, and everyday creativity.',
  copyright: '© 2026 Sarah Chen. All rights reserved.',
  url: 'https://inkwell.example.com',
  locale: 'en-US',
  timezone: 'America/Los_Angeles',
  postsPerPage: 10,
  maintenanceMode: false,
}

// ─── Author Profile ────────────────────────────────────────────────────────────

export const MOCK_AUTHOR: AuthorProfile = {
  name: 'sarah-chen',
  displayName: 'Sarah Chen',
  email: 'sarah@inkwell.example.com',
  bio: 'Designer-turned-developer. I write about building things on the internet, slow mornings, and everything in between. Based in San Francisco.',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  website: 'https://inkwell.example.com',
  twitter: '@sarahchen',
  linkedin: 'linkedin.com/in/sarahchen',
  location: 'San Francisco, CA',
  pronouns: 'she/her',
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export const MOCK_ANALYTICS = {
  totalViews: { value: 42381, change: 12.4 },
  totalPosts: { value: 8, change: 3 },
  avgReadTime: { value: '7.2 min', change: -0.3 },
  subscribers: { value: 1247, change: 8.1 },
  viewsByDay: [
    { date: 'Jun 4', views: 1200 },
    { date: 'Jun 5', views: 1450 },
    { date: 'Jun 6', views: 980 },
    { date: 'Jun 7', views: 1680 },
    { date: 'Jun 8', views: 2100 },
    { date: 'Jun 9', views: 1870 },
    { date: 'Jun 10', views: 2240 },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDate(dateStr: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', opts ?? { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatViewCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
