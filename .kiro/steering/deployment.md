# Deployment — bromance.blog

## How deploys work

Git integration is **DISCONNECTED** on Vercel (Hobby plan limitation). Deploys are triggered via the **Vercel REST API** from a GitHub Actions workflow on every push to `main`.

Vercel pulls the commit from GitHub and builds on their infrastructure.

## Vercel API details

- **Endpoint:** `POST https://api.vercel.com/v13/deployments?teamId=team_c2vJiNlVfD4IVOQX72gQ6AVt`
- **Project ID:** `prj_p6pJk5NvAlNjPKpe1ELkfOuWHE3j`
- **Body:**
```json
{
  "name": "bromance",
  "project": "prj_p6pJk5NvAlNjPKpe1ELkfOuWHE3j",
  "target": "production",
  "gitSource": {
    "type": "github",
    "repo": "bromance",
    "ref": "main",
    "org": "hobi-design"
  }
}
```

## Critical rules

1. `teamId` is a **query parameter**, never in the body. Body inclusion causes 400.
2. The workflow MUST check the HTTP status code. `curl` exits 0 even on Vercel errors.
3. After pushing, verify deploy via Vercel API: `GET /v6/deployments?projectId=prj_p6pJk5NvAlNjPKpe1ELkfOuWHE3j&teamId=team_c2vJiNlVfD4IVOQX72gQ6AVt&limit=1` — check `readyState` is `READY`, not just that the action passed.
4. If making changes to the deploy workflow, always test by pushing and confirming Vercel shows a new BUILDING/READY deployment.
5. Never put `teamId` in the body. Never use the old repo name `simple-clean-blog`.

## GitHub Actions secrets

- `VERCEL_TOKEN` — Vercel API bearer token
- `VERCEL_PROJECT_ID` — `prj_p6pJk5NvAlNjPKpe1ELkfOuWHE3j`

## Workflow file

See `.github/workflows/deploy.yml` — reference implementation with HTTP status checking.



---

## Local verification (before pushing)

Run one command instead of testing piecemeal:

```
pnpm verify          # type-check (blocking) + lint (advisory)
pnpm verify -Build   # also attempt the Next.js build (compile check only)
```

All output goes to `.verify.log` at the repo root (gitignored). The console
shows a compact PASS/FAIL summary and tails the first errors on failure.

What each gate means:

- **type-check (db + web) — BLOCKING.** This is the real local gate. It catches
  broken imports, removed symbols, and type drift. Green here = structurally sound.
- **lint (web) — ADVISORY.** The repo has many pre-existing react-compiler /
  react-hooks findings, and `next build` skips linting, so lint never blocks a
  deploy. `verify` reports it but does not fail on it.
- **build (web) — OPT-IN, compile check only.** A full production build does NOT
  complete on Windows locally: it needs `DATABASE_URL` to prerender pages (else a
  60s timeout) and it hits `EPERM` creating `.next/standalone` symlinks. That's
  environmental, not a code defect. Look for `Compiled successfully` to confirm the
  bundle is valid; the authoritative build runs on Vercel (Linux).

Notes:
- `turbo run` crashes on this machine (exit `3221225781`); `verify` calls `tsc`/
  `next` directly instead.
- Only Windows PowerShell 5 is available (no `pwsh`), so the script is invoked via
  `powershell`.
- The script clears `apps/web/.next/types` first so deleted routes don't produce
  phantom tsc errors from stale generated route stubs.

---

## Database Rules

**Additive, non-destructive migrations are allowed** — new tables, new columns, new indexes. These are fine when the work genuinely needs them.

**NEVER run destructive operations** against the Supabase database: no `DROP`, `DELETE`, `TRUNCATE`, `RESET`, no removing/renaming existing columns or tables, no seeding/overwriting existing rows, nothing that can cause data loss. The existing data (posts, categories, media, etc.) is correct and must be preserved.

When a migration is needed: provide the exact SQL, make it additive only, and never assume it runs automatically. If something doesn't display, suspect the app code (API routes, queries, components) before the data.
