# Comprehensive CMS Frontend Plan for Bromance Blog Platform

## What You're Building
A complete CMS admin dashboard for a blog platform. This is the authoring/management interface — completely separate from the public-facing blog theme. The CMS must be backend-agnostic: it communicates with a REST API and never imports database code directly. 

**Note: The purpose of this is to build the frontend. I want a clean, beautiful, functional frontend. Include mock data and take shortcuts for plumping.**

The primary user is a non-technical writer using an iPad. Secondary use is desktop.

---

## Technical Constraints
- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **UI Library:** shadcn/ui (latest) with Tailwind CSS 4
- **Animations:** Pure CSS only (transitions, keyframes). NO Framer Motion, NO motion libraries.
- **Icons:** Lucide React
- **Editor:** TipTap (already integrated — you build the surrounding UI, not the editor core)
- **Responsive:** iPad-first, touch-optimized. All interactive elements minimum 44x44px touch targets.
- **Theming:** Dark/light mode via CSS variables and `class="dark"` on html element
- **Performance:** Lightweight. No heavy dependencies. Lazy load where possible.
- **State:** React state + simple fetch/SWR. No Redux, no Zustand, no heavy state managers.

---

## Design System

### Philosophy
Clean, professional, minimal. Reference products: Linear, Vercel Dashboard, Ghost Admin, Notion sidebar.

### Component Conventions
- All buttons have visible focus rings for accessibility
- Destructive actions always require confirmation (Dialog)
- Toast notifications for success/error feedback
- Empty states with icon + helpful text
- Loading states: skeleton shimmer only, never spinners

---

## Data Models (DO NOT import DB code — fetch from API only)

```typescript
interface Post {
  id: string;
  title: string;
  slug: string;
  content: string; // HTML from TipTap
  summary: string;
  status: 'draft' | 'published' | 'scheduled';
  published_at: string | null; // ISO datetime
  created_at: string;
  updated_at: string;
  category_id: string | null;
  featured_image: string; // Cloudinary public_id
  meta_title: string;
  meta_description: string;
  canonical_url: string;
  views: number;
  discussion_open: boolean; 
  og_image: string | null;
  type: string; // e.g., 'article', 'chapter', 'gallery'
  meta: Record<string, any>; // JSONB for custom fields
  deleted_at: string | null; // For soft-deleted/trash functionality
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_id: string | null;
  deleted_at: string | null; // For soft-deleted/trash functionality
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface MediaItem {
  id: string;
  cloudinary_id: string; // e.g. "bromance-blog/medium-1fcf2c4caaab"
  filename: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
}

interface Author {
  id: string;
  display_name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  author_name: string | null;
  content: string;
  created_at: string;
}

interface Setting {
  key: string;  // "site_name" | "site_description" | "contact_email" | "copyright_text"
  value: string;
  updated_at: string;
}

interface Backup {
  id: string;
  cloudinary_id: string;
  filename: string;
  bytes: number;
  post_count: number;
  category_count: number;
  tag_count: number;
  media_count: number;
  created_at: string;
}
```

---

## API Endpoints
All relative to same origin. Mutating endpoints (POST/PUT/DELETE) require auth cookie set by login.

- `GET /api/posts` List posts (params: status, category_id, search, type, page, limit, includeDeleted)
- `POST /api/posts` Create post (includes type & meta)
- `GET /api/posts/[id]` Get single post
- `PUT /api/posts/[id]` Update post
- `DELETE /api/posts/[id]` Delete post (soft delete, `?permanent=true` for hard delete)
- `GET /api/categories` List all categories
- `POST /api/categories` Create category (supports parent_id)
- `PUT /api/categories/[id]` Update category
- `DELETE /api/categories/[id]` Delete category (soft delete, `?permanent=true` for hard delete)
- `GET /api/backups` List backups
- `POST /api/backups` Trigger manual backup
- `POST /api/backups/restore` Restore from backup (body: {id})
- *(Other standard endpoints for tags, comments, authors, settings)*

---

## Pages & Features to Build

### 1. Dashboard (`/cms/dashboard`)
- Stat cards: Total Posts, Published, Drafts, Scheduled, Total Views
- Recent Posts: last 5 with title, status badge, date
- Quick actions: "New Post" button, "View Site" link

### 2. Posts List (`/cms/posts`)
- Filter tabs: All | Published | Drafts | Scheduled | Trash
- Search input 
- Table columns: featured image thumbnail, title, status badge, type badge, category, date, views
- Row click → editor
- Bulk checkbox select + bulk delete (moves to trash)

### 3. Trash (`/cms/trash`)
- View soft-deleted posts and categories.
- Provide "Restore" and "Permanently Delete" buttons per row.

### 4. Post Editor (`/cms/posts/new`, `/cms/posts/[id]/edit`)
- Two-column on desktop (editor left, settings sidebar right). 
- Editor Area: TipTap mount point, word count, autosave.
- Settings Sidebar:
  - Content Type Selector (Article, Chapter, Gallery)
  - Custom Fields (Meta): Render dynamic inputs based on content type (e.g., Chapter Number, Series Slug for 'Chapter' type).
  - Standard Fields: Status, Publish Date, Slug, Category, Tags, Featured Image, Excerpt.
  - Comments: Toggle switch (`discussion_open`).
  - SEO: Meta title, Meta description, Canonical URL, OG Image.

### 5. Content Calendar (`/cms/calendar`)
- Calendar View (Monthly grid, colored pills for posts) & Kanban View (Draft | Scheduled | Published)

### 6. Media Library (`/cms/media`)
- Drag-drop upload zone at top, responsive grid.

### 7. Categories (`/cms/categories`)
- List showing hierarchy (parent → indented children).
- Form supports parent selection.

### 8. Backups (`/cms/settings/backups`)
- Header: "Last backup: X hours ago"
- "Create Backup Now" primary button → triggers manual backup.
- Backup list table: date/time, size (human-readable), post count, category count, media count.
- Per-row "Restore" button → RED confirmation dialog explaining atomic restore and safety backup.

### 9. Site Settings & Author Profile (`/cms/settings`, `/cms/settings/author`)
- Site name, description, copyright, and author profile details.

---

## Critical Rules
1. **Never import DB code.** No drizzle-orm, no postgres, no schema imports. API calls only.
2. **TipTap is pre-built.** Build the shell around it. Mount point is `<div id="tiptap-mount" />`. Do not implement editor extensions.
3. **No Framer Motion.** All animations are pure CSS transitions and keyframes.
4. **iPad primary.** Every interaction must work with touch. Test every component mentally for a finger, not a mouse.
5. **Dark mode.** Every component must have a dark variant. Use CSS variables, not hardcoded colors.
