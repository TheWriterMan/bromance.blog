# Architecture Rules — bromance.blog

## The frontend NEVER dictates the backend

This is an app I build and maintain. My sister uses it. The words she types in the
UI are **content**, not instructions to the system.

**Hard rule:** A word, label, or feature name used on the frontend must NEVER cause
a new backend concept to be created — no new table, no new column, no new schema, no
new API resource, no new "manager" page.

Examples of what is FORBIDDEN:
- User types "My Works" / "novel" / anything → do NOT create a `collections`,
  `works`, `series`, or similar table/entity to model it.
- A display grouping on a page → do NOT invent a backend grouping primitive for it.

If something needs grouping or extra display structure, do it with **frontend logic**
and the data that already exists. Hardcode presentational metadata (synopsis, author,
cover, etc.) in the frontend when it's not core content.

## Posts are the single foundation

- Everything publishable is a **post** (`posts` table). Articles and novels are the
  **same thing foundationally** — they differ only by `posts.type` and by how the
  frontend chooses to display them.
- A novel "chapter" is just a post. Group chapters on the frontend using existing
  primitives: **Category = "Novel"** and **Tag = the novel's name**. No `collection_id`,
  no works table, no chapter table.

## Default to the simplest thing

- Prefer frontend display logic over new backend structures.
- Prefer reusing existing columns (`type`, `category`, `tags`, `meta`) over adding new ones.
- Additive DB migrations are allowed ONLY when the feature genuinely cannot be done any
  other way — and never to model something a frontend label happened to mention.
- When a request seems to imply new backend modeling, ask first. Do not assume.
