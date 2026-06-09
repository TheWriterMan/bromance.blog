# Implementation Plan: Monorepo Restructure

## Overview

Restructure the bromance blog from a single Next.js app into a Turborepo monorepo. Tasks proceed bottom-up: root config → packages → app relocation → cleanup → verification.

## Tasks

- [ ] 1. Initialize monorepo root configuration
  - Create `pnpm-workspace.yaml` with `packages: ["apps/*", "packages/*"]`
  - Create `turbo.json` with `build` (depends on `^build`), `lint`, and `dev` pipelines
  - Update root `package.json`: add `turbo` devDependency, update scripts to use `turbo run build`, `turbo run dev`, `turbo run lint`
  - Remove Next.js-specific scripts from root `package.json` (they move to `apps/web`)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Create packages/db
  - [ ] 2.1 Scaffold packages/db package structure
    - Create `packages/db/package.json` with `"name": "@repo/db"`, `"main": "./src/index.ts"`, dependencies on `drizzle-orm` and `postgres`, devDependency on `drizzle-kit`
    - Create `packages/db/tsconfig.json` extending a base config
    - _Requirements: 2.1, 2.6, 2.7_
  - [ ] 2.2 Move database files into packages/db/src
    - Copy `lib/schema.ts` → `packages/db/src/schema.ts` (unchanged)
    - Extract client logic from `lib/db.ts` → `packages/db/src/client.ts` (exports `db`, `sql`)
    - Extract type interfaces from `lib/db.ts` → `packages/db/src/types.ts` (exports all interfaces)
    - Create `packages/db/src/index.ts` barrel file re-exporting from `client.ts`, `schema.ts`, `types.ts`
    - _Requirements: 2.2, 2.3, 2.4, 2.5_
  - [ ] 2.3 Verify packages/db compiles
    - Run `tsc --noEmit` in `packages/db` and confirm no type errors
    - _Requirements: 2.8_

- [ ] 3. Create packages/ui scaffold
  - Create `packages/ui/package.json` with `"name": "@repo/ui"`, `"main": "./src/index.ts"`, peerDependencies on `react` and `react-dom`
  - Create `packages/ui/tsconfig.json`
  - Create `packages/ui/src/index.ts` with `export {}`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 4. Create packages/config
  - Create `packages/config/package.json` with `"name": "@repo/config"`
  - Create `packages/config/typescript/base.json` with shared compiler options (strict, esModuleInterop, skipLibCheck, etc.)
  - Create `packages/config/typescript/nextjs.json` extending base with Next.js-specific options (jsx preserve, plugins, module bundler)
  - Create `packages/config/eslint/base.js` with shared ESLint rules
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 5. Checkpoint — Verify packages build
  - Run `pnpm install` at root to link workspaces
  - Run `tsc --noEmit` in each package to confirm they compile independently
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Relocate Next.js app to apps/web
  - [ ] 6.1 Create apps/web package structure
    - Create `apps/web/package.json` with `"name": "@repo/web"`, dependency on `@repo/db`, all existing Next.js dependencies
    - Create `apps/web/tsconfig.json` extending `@repo/config/typescript/nextjs.json`, with path aliases for `@/*` and `@repo/db`
    - Copy `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts` (or CSS config) to `apps/web/`
    - _Requirements: 5.1, 5.3, 4.5_
  - [ ] 6.2 Move application files to apps/web
    - Move `app/` → `apps/web/app/`
    - Move `components/cms/` → `apps/web/components/cms/`
    - Move `components/ui/` → `apps/web/components/ui/`
    - Move `lib/` → `apps/web/lib/` (excluding `db.ts` and `schema.ts` which are now in packages/db)
    - Move `middleware.ts` → `apps/web/middleware.ts`
    - Move `public/` → `apps/web/public/`
    - Copy `.env.local` and `.env.example` to `apps/web/`
    - _Requirements: 5.2, 5.6, 5.7_
  - [ ] 6.3 Update all imports from `@/lib/db` and `@/lib/schema` to `@repo/db`
    - Search all files in `apps/web/` for imports of `@/lib/db` or `@/lib/schema`
    - Replace with `import { db, posts, categories, ... } from '@repo/db'`
    - Remove leftover `apps/web/lib/db.ts` and `apps/web/lib/schema.ts` if they were copied
    - _Requirements: 5.4, 5.5_

- [ ] 7. Create blog route group with stubs
  - [ ] 7.1 Create (blog) route group structure
    - Create `apps/web/app/(blog)/layout.tsx` — passthrough layout rendering children
    - Create `apps/web/app/(blog)/page.tsx` — "Coming Soon" stub for home
    - Create `apps/web/app/(blog)/[slug]/page.tsx` — stub for individual posts
    - Create `apps/web/app/(blog)/category/[slug]/page.tsx` — stub
    - Create `apps/web/app/(blog)/author/[slug]/page.tsx` — stub
    - Create `apps/web/app/(blog)/tag/[slug]/page.tsx` — stub
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  - [ ] 7.2 Create feed/SEO stubs
    - Create `apps/web/app/(blog)/feed.xml/route.ts` — returns empty valid XML
    - Create `apps/web/app/(blog)/sitemap.ts` — returns minimal sitemap
    - Create `apps/web/app/(blog)/robots.ts` — returns basic robots config
    - _Requirements: 6.4, 6.5_

- [ ] 8. Delete blog frontend components
  - Delete `components/blog/` directory (or `apps/web/components/blog/` if already moved)
  - Delete `components/blog.tsx` file (or `apps/web/components/blog.tsx`)
  - Remove any dangling imports that reference deleted blog components
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 9. Checkpoint — Full build verification
  - Run `pnpm install` at monorepo root
  - Run `pnpm build` from root — must exit 0
  - Verify Turborepo builds packages/db and packages/ui before apps/web
  - Verify all `@repo/db` imports resolve correctly
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 10. Add Vercel deployment documentation
  - Create or update `README.md` at monorepo root with a "Deployment" section
  - Document that Vercel Root Directory must be set to `apps/web` in Project Settings → General → Root Directory
  - Note this is a manual Vercel dashboard step required after the restructure
  - _Requirements: 9.1, 9.2_

- [ ] 11. Final cleanup and verification
  - Remove old root-level files that were relocated: `app/`, `components/`, `lib/`, `middleware.ts`, `public/`
  - Remove old root-level Next.js config files that were moved to `apps/web/`
  - Run `pnpm build` one final time to confirm clean state
  - Ensure all tests pass, ask the user if questions arise.

## Task Dependency Graph

```json
{
  "waves": [
    ["1"],
    ["2", "3", "4"],
    ["5"],
    ["6"],
    ["7", "8"],
    ["9"],
    ["10", "11"]
  ]
}
```

## Notes

- The database schema is NOT modified — only relocated to `packages/db`
- Blog components are deleted because the frontend will be rebuilt separately
- CMS routes, API routes, and middleware are preserved unchanged
- The Vercel Root Directory change is a manual step after code is merged
- `pnpm build` passing from root is the primary acceptance test for this restructure
