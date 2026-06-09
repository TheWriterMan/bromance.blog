# Requirements Document

## Introduction

This document specifies the requirements for restructuring the bromance blog project from a single Next.js application into a Turborepo monorepo with pnpm workspaces. The restructure extracts shared database logic, scaffolds shared packages, relocates the Next.js app, removes blog frontend components, and establishes a working build pipeline.

## Glossary

- **Monorepo_Root**: The top-level directory containing `pnpm-workspace.yaml`, `turbo.json`, and the root `package.json`
- **Build_Pipeline**: The Turborepo-orchestrated sequence of `tsc` and `next build` commands across workspace packages
- **Package_Resolution**: The mechanism by which pnpm workspaces resolve `@repo/*` imports to local packages
- **DB_Package**: The `packages/db` workspace package (`@repo/db`) containing Drizzle schema, client, and types
- **UI_Package**: The `packages/ui` workspace package (`@repo/ui`) scaffolded for future shared components
- **Config_Package**: The `packages/config` workspace package (`@repo/config`) containing shared TypeScript and ESLint configurations
- **Web_App**: The `apps/web` workspace package (`@repo/web`) containing the relocated Next.js 15 application
- **Blog_Route_Group**: The `(blog)` Next.js route group containing stub pages for public blog routes

## Requirements

### Requirement 1: Root Workspace Configuration

**User Story:** As a developer, I want the monorepo root to define workspace membership and build pipelines, so that all packages are discoverable and build in the correct order.

#### Acceptance Criteria

1. THE Monorepo_Root SHALL contain a `pnpm-workspace.yaml` file with `packages: ["apps/*", "packages/*"]`
2. THE Monorepo_Root SHALL contain a `turbo.json` file defining `build`, `lint`, and `dev` pipelines
3. WHEN `turbo.json` defines the `build` pipeline, THE Build_Pipeline SHALL declare that `build` depends on `^build` to enforce topological ordering
4. THE Monorepo_Root `package.json` SHALL include `turbo` as a devDependency
5. THE Monorepo_Root `package.json` SHALL include scripts for `build`, `dev`, and `lint` that delegate to `turbo run`
6. WHEN `pnpm install` is run at the Monorepo_Root, THE Package_Resolution SHALL install dependencies for all workspace members

### Requirement 2: Database Package (packages/db)

**User Story:** As a developer, I want shared database logic in a dedicated package, so that multiple apps can import schema, client, and types from a single source.

#### Acceptance Criteria

1. THE DB_Package SHALL have a `package.json` with `"name": "@repo/db"` and `"main": "./src/index.ts"`
2. THE DB_Package SHALL export the Drizzle database client (`db`, `sql`) from `src/client.ts`
3. THE DB_Package SHALL export all Drizzle table schema definitions from `src/schema.ts`
4. THE DB_Package SHALL export TypeScript interfaces (Category, Tag, Post, PostTag, MediaItem, PostRevision, Schema) from `src/types.ts`
5. THE DB_Package `src/index.ts` SHALL re-export all public symbols from `client.ts`, `schema.ts`, and `types.ts`
6. THE DB_Package SHALL declare `drizzle-orm` and `postgres` as dependencies in its `package.json`
7. THE DB_Package SHALL declare `drizzle-kit` as a devDependency in its `package.json`
8. WHEN TypeScript compiles `packages/db`, THE Build_Pipeline SHALL produce no type errors

### Requirement 3: UI Package Scaffold (packages/ui)

**User Story:** As a developer, I want an empty but properly configured UI package, so that shared components can be added incrementally without restructuring later.

#### Acceptance Criteria

1. THE UI_Package SHALL have a `package.json` with `"name": "@repo/ui"` and `"main": "./src/index.ts"`
2. THE UI_Package SHALL contain a `src/index.ts` file that exports an empty module (`export {}`)
3. THE UI_Package SHALL declare `react` and `react-dom` as peerDependencies
4. THE UI_Package SHALL contain a valid `tsconfig.json`
5. WHEN TypeScript compiles `packages/ui`, THE Build_Pipeline SHALL produce no type errors

### Requirement 4: Config Package (packages/config)

**User Story:** As a developer, I want shared TypeScript and ESLint configurations in a dedicated package, so that all workspace members use consistent settings without duplication.

#### Acceptance Criteria

1. THE Config_Package SHALL have a `package.json` with `"name": "@repo/config"`
2. THE Config_Package SHALL contain a `typescript/base.json` with shared compiler options
3. THE Config_Package SHALL contain a `typescript/nextjs.json` that extends `base.json` with Next.js-specific options
4. THE Config_Package SHALL contain an `eslint/base.js` with shared ESLint rules
5. WHEN `apps/web/tsconfig.json` extends the Config_Package TypeScript preset, THE Build_Pipeline SHALL resolve the extended configuration without errors

### Requirement 5: Web App Relocation (apps/web)

**User Story:** As a developer, I want the existing Next.js application relocated to `apps/web`, so that it operates as a workspace member within the monorepo structure.

#### Acceptance Criteria

1. THE Web_App SHALL have a `package.json` with `"name": "@repo/web"`
2. THE Web_App SHALL contain the existing `app/` directory with all CMS routes, API routes, and middleware intact
3. THE Web_App SHALL declare `@repo/db` as a dependency in its `package.json`
4. WHEN the Web_App imports from `@repo/db`, THE Package_Resolution SHALL resolve to `packages/db/src/index.ts`
5. WHEN the Web_App imports from `@/lib/*`, THE Package_Resolution SHALL resolve relative to the `apps/web/` root
6. THE Web_App SHALL retain all existing CMS components under `components/cms/`
7. THE Web_App SHALL retain all app-local lib files (auth, cloudinary, utils, design, draft-store, theme)
8. WHEN `next build` runs in `apps/web`, THE Build_Pipeline SHALL complete without import resolution errors

### Requirement 6: Blog Route Group with Stubs

**User Story:** As a developer, I want blog routes wrapped in a `(blog)` route group with minimal stubs, so that URL structure is preserved while the frontend is rebuilt separately.

#### Acceptance Criteria

1. THE Web_App SHALL contain a `(blog)` route group directory at `app/(blog)/`
2. THE Blog_Route_Group SHALL contain a `layout.tsx` that renders children without additional markup
3. THE Blog_Route_Group SHALL contain stub pages for: `/` (home), `/[slug]`, `/category/[slug]`, `/author/[slug]`, `/tag/[slug]`
4. THE Blog_Route_Group SHALL contain stubs for `/feed.xml`, `/sitemap.ts`, and `/robots.ts`
5. WHEN a stub page is rendered, THE Web_App SHALL return valid HTML without runtime errors

### Requirement 7: Blog Component Cleanup

**User Story:** As a developer, I want blog-specific frontend components removed, so that the codebase does not contain dead code from the previous frontend implementation.

#### Acceptance Criteria

1. WHEN the restructure is complete, THE Web_App SHALL NOT contain a `components/blog/` directory
2. WHEN the restructure is complete, THE Web_App SHALL NOT contain a `components/blog.tsx` file
3. WHEN blog components are deleted, THE Build_Pipeline SHALL still complete without errors (no dangling imports)

### Requirement 8: Build Verification

**User Story:** As a developer, I want `pnpm build` from the monorepo root to pass, so that I can confirm the restructure is complete and all packages integrate correctly.

#### Acceptance Criteria

1. WHEN `pnpm build` is executed at the Monorepo_Root, THE Build_Pipeline SHALL complete with exit code 0
2. WHEN `pnpm build` runs, THE Build_Pipeline SHALL build `packages/db` and `packages/ui` before `apps/web`
3. WHEN `pnpm build` runs, THE Build_Pipeline SHALL resolve all `@repo/*` imports across workspace boundaries
4. IF a package has a type error, THEN THE Build_Pipeline SHALL report the error and exit with a non-zero code

### Requirement 9: Vercel Root Directory Configuration

**User Story:** As a developer, I want documentation on the required Vercel configuration change, so that deployments work correctly after the monorepo restructure.

#### Acceptance Criteria

1. THE Monorepo_Root SHALL contain documentation (in README or a dedicated file) stating that the Vercel Root Directory must be set to `apps/web`
2. THE documentation SHALL specify this is a manual step in the Vercel dashboard under Project Settings → General → Root Directory
