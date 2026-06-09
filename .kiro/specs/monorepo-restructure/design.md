# Design Document: Monorepo Restructure

## Overview

This design covers the restructuring of the bromance blog project from a single Next.js application into a Turborepo monorepo with pnpm workspaces. The restructure extracts shared database logic into a dedicated package (`@repo/db`), scaffolds a shared UI package (`@repo/ui`), centralizes configuration into `packages/config`, and relocates the existing Next.js app into `apps/web`. Blog frontend components are deleted (frontend rebuild is a separate effort), while CMS routes, API routes, and middleware are preserved intact.

The primary goals are: clear separation of concerns, enabling future multi-app development (e.g., a separate blog frontend), and establishing a clean foundation for the packages ecosystem.

## Architecture

```mermaid
graph TD
    subgraph Root["bromance/ (monorepo root)"]
        RootPkg[package.json<br/>turbo.json<br/>pnpm-workspace.yaml]
    end

    subgraph Apps["apps/"]
        Web["apps/web/<br/>Next.js 15 App"]
    end

    subgraph Packages["packages/"]
        DB["packages/db/<br/>@repo/db"]
        UI["packages/ui/<br/>@repo/ui"]
        Config["packages/config/<br/>@repo/config"]
    end

    Web -->|"@repo/db"| DB
    Web -->|"@repo/ui"| UI
    Web -->|"extends"| Config
    RootPkg --> Apps
    RootPkg --> Packages
```

## Components and Interfaces

### Component 1: Root Monorepo Configuration

**Purpose**: Orchestrates the workspace — defines packages, Turborepo pipelines, and shared scripts.

**Key Files**:
- `package.json` — workspace root with Turborepo devDependency and orchestration scripts
- `pnpm-workspace.yaml` — defines `apps/*` and `packages/*` as workspace members
- `turbo.json` — defines `build`, `lint`, `dev` pipelines with dependency caching

**Responsibilities**:
- Define workspace package locations
- Provide Turborepo task pipeline (build order, caching)
- Host root-level devDependencies (turbo, typescript)
- Provide convenience scripts (`pnpm build`, `pnpm dev`, `pnpm lint`)

### Component 2: apps/web (Next.js Application)

**Purpose**: The single Next.js 15 application containing CMS, API routes, middleware, and blog route stubs.

**Interface**:
```typescript
// apps/web/package.json name field
{ "name": "@repo/web" }

// Import alias configuration (tsconfig.json paths)
{
  "@/*": ["./*"],  // app-local imports (relative to apps/web root)
  "@repo/db": ["../../packages/db/src/index.ts"],
  "@repo/ui": ["../../packages/ui/src/index.ts"]
}
```

**Responsibilities**:
- Serve CMS admin panel at `/cms/*`
- Expose API routes at `/api/*`
- Run middleware for CMS authentication
- Provide blog route stubs at `/(blog)/*`
- Own all app-specific lib files (auth, cloudinary, utils, design, draft-store, theme)
- Own all CMS components and hooks

### Component 3: packages/db (@repo/db)

**Purpose**: Shared database package containing Drizzle schema definitions, the database client, and TypeScript type interfaces.

**Interface**:
```typescript
// packages/db/src/index.ts — barrel export
export { db, sql } from './client';
export * from './schema';
export type { Category, Tag, Post, PostTag, MediaItem, PostRevision, Schema } from './types';
```

```typescript
// packages/db/src/client.ts
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_URL || '';

export const sql = postgres(databaseUrl || 'postgresql://postgres:postgres@localhost:5432/fake', {
  prepare: false,
  max: 10,
  ssl: 'require',
  idle_timeout: 20,
  connect_timeout: 15,
  max_lifetime: 60 * 5,
});

export const db = drizzle(sql, { schema });
```

```typescript
// packages/db/src/types.ts
export interface Category { id: string; name: string; slug: string; description: string; }
export interface Tag { id: string; name: string; slug: string; }
export interface Post { /* ... full interface ... */ }
export interface PostTag { post_id: string; tag_id: string; }
export interface MediaItem { /* ... */ }
export interface PostRevision { /* ... */ }
export interface Schema { /* ... */ }
```

**Responsibilities**:
- Define all Drizzle ORM table schemas
- Provide a configured database client instance
- Export TypeScript interfaces for all database entities
- Own `drizzle.config.ts` for migrations
- Declare `drizzle-orm` and `postgres` as dependencies

### Component 4: packages/ui (@repo/ui)

**Purpose**: Empty scaffold for shared UI components, ready for shadcn/ui setup in a future iteration.

**Interface**:
```typescript
// packages/ui/src/index.ts — initially empty
export {};
```

**Responsibilities**:
- Provide package structure ready for component additions
- Include React/Tailwind peer dependencies
- Scaffold `src/` directory for future components

### Component 5: packages/config (@repo/config)

**Purpose**: Shared configuration presets for TypeScript and ESLint that other packages extend.

**Key Files**:
- `typescript/base.json` — base tsconfig for all packages
- `typescript/nextjs.json` — Next.js-specific tsconfig extending base
- `eslint/base.js` — shared ESLint configuration

**Responsibilities**:
- Provide reusable TypeScript configurations
- Provide reusable ESLint configurations
- Reduce duplication across workspace packages

## Data Models

This restructure does not change any database schema or data models. The existing Drizzle schema (categories, tags, posts, postTags, mediaItems, postRevisions, redirects, authors, postLikes, comments) moves unchanged into `packages/db/src/schema.ts`.

## Sequence: Build Pipeline

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Turbo as Turborepo
    participant DB as packages/db
    participant UI as packages/ui
    participant Web as apps/web

    Dev->>Turbo: pnpm build
    Turbo->>DB: tsc (build)
    Turbo->>UI: tsc (build)
    Note over DB,UI: packages build in parallel (no interdependency)
    DB-->>Turbo: ✓ built
    UI-->>Turbo: ✓ built
    Turbo->>Web: next build
    Note over Web: Depends on @repo/db, @repo/ui
    Web-->>Turbo: ✓ built
    Turbo-->>Dev: Build complete
```

## Sequence: File Relocation

```mermaid
flowchart TD
    A[Current root-level Next.js app] --> B{Categorize files}
    B -->|DB files| C[packages/db/src/]
    B -->|App files| D[apps/web/]
    B -->|Blog components| E[DELETE]
    B -->|Config files| F[packages/config/ + apps/web/]
    B -->|Root configs| G[Root monorepo level]

    C --> C1[schema.ts → packages/db/src/schema.ts]
    C --> C2[db.ts → packages/db/src/client.ts + types.ts]
    
    D --> D1[app/ → apps/web/app/]
    D --> D2[components/cms/ → apps/web/components/cms/]
    D --> D3[lib/* → apps/web/lib/*]
    D --> D4[middleware.ts → apps/web/middleware.ts]
    
    E --> E1[components/blog/ → DELETED]
    E --> E2[components/blog.tsx → DELETED]
    E --> E3[app/page.tsx content → stub]
    E --> E4[app/[slug]/ → stub]
```

## Blog Route Group Strategy

Blog routes are wrapped in a `(blog)` route group with minimal stub pages:

```typescript
// apps/web/app/(blog)/layout.tsx
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// apps/web/app/(blog)/page.tsx
export default function HomePage() {
  return <div><h1>Coming Soon</h1></div>;
}

// apps/web/app/(blog)/[slug]/page.tsx
export default function PostPage() {
  return <div><p>Post coming soon</p></div>;
}
```

Routes that remain as stubs: `/`, `/[slug]`, `/category/[slug]`, `/author/[slug]`, `/tag/[slug]`, `/feed.xml`, `/sitemap.ts`, `/robots.ts`.

## Import Path Migration

All imports change from root-relative `@/lib/db` to either:
- `@repo/db` — for schema, db client, and types
- `@/lib/*` — for app-local files (now relative to `apps/web/`)

```typescript
// Before (in API route):
import { db } from '@/lib/db';
import { posts } from '@/lib/schema';

// After:
import { db, posts } from '@repo/db';
```

## Error Handling

### Missing DATABASE_URL at Build Time

**Condition**: `DATABASE_URL` not set during `next build`
**Response**: The db client logs a warning but uses a dummy connection string. Build succeeds because Drizzle schema exports are purely type-level at build time.
**Recovery**: Runtime requests will fail with connection errors — expected behavior matching current setup.

### Package Resolution Failure

**Condition**: `@repo/db` or `@repo/ui` cannot be resolved
**Response**: TypeScript and Next.js will emit build errors pointing to the unresolved import.
**Recovery**: Verify `pnpm-workspace.yaml` includes `packages/*`, and that each package has correct `name` in `package.json`.

## Testing Strategy

### Build Verification

The primary acceptance test is: `pnpm build` from the monorepo root must complete without errors. This validates:
- Turborepo pipeline ordering is correct
- All inter-package dependencies resolve
- TypeScript compilation succeeds across all packages
- Next.js can bundle the app with the new import paths

### Import Resolution Verification

After restructuring, run `pnpm tsc --noEmit` in `apps/web` to verify all TypeScript imports resolve correctly.

## Dependencies

| Package | Location | Purpose |
|---------|----------|---------|
| turbo | Root devDep | Monorepo orchestration |
| pnpm | System | Package manager (workspaces) |
| drizzle-orm | packages/db | ORM |
| postgres | packages/db | PostgreSQL driver |
| drizzle-kit | packages/db devDep | Migration tooling |
| next | apps/web | Framework |
| react, react-dom | apps/web | UI library |
| typescript | Root + packages | Type checking |
| eslint | Root + packages | Linting |

## Correctness Properties

*This restructure is an Infrastructure-as-Code / project configuration task. Property-based testing is not appropriate here — the acceptance criteria are verified by build success (`pnpm build` exit code 0) and import resolution (`tsc --noEmit`). These are integration/smoke checks, not universal properties over generated inputs.*

No property-based tests are defined for this spec. Verification is achieved through:
1. `pnpm build` from monorepo root exits with code 0
2. `tsc --noEmit` in each workspace package reports no type errors
3. All `@repo/db` imports resolve correctly at compile time

**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

## Vercel Configuration Note

After restructuring, the Vercel project's **Root Directory** setting must be updated from `/` (default) to `apps/web`. This is a manual step in the Vercel dashboard. The GitHub Actions deploy workflow (`deploy.yml`) does not need changes — Vercel reads the root directory setting when building from the git source.
