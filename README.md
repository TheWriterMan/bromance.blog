# Bromance

A blog about donghua, manga, drama, and novels. Built with Next.js 15, Drizzle ORM, Supabase, and Cloudinary.

## Stack

- **Framework:** Next.js 15 (App Router, standalone output)
- **Database:** Supabase PostgreSQL via Drizzle ORM
- **Media:** Cloudinary
- **Styling:** Tailwind CSS 4
- **Editor:** TipTap
- **Hosting:** Vercel

## Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in the values.

## Deployment

This project deploys via GitHub Actions to a **single Vercel project** at [bromance.blog](https://bromance.blog).

### How deploys work

Deployments are triggered automatically on every push to `main`. The GitHub Actions workflow (`.github/workflows/deploy.yml`) calls the Vercel REST API directly.

### ⚠️ Required Vercel Configuration

After this monorepo restructure, the Vercel project's **Root Directory** must be set to `apps/web`.

**Steps:**
1. Go to [Vercel Dashboard](https://vercel.com) → Project Settings → General
2. Find **Root Directory** under "Build & Development Settings"
3. Set it to: `apps/web`
4. Save and redeploy

Without this change, Vercel will try to build from the repo root (which no longer contains a Next.js app) and the build will fail.

### Deploy workflow

The deploy workflow does not need changes — it triggers Vercel to pull and build from the `main` branch, and Vercel uses the Root Directory setting to find the app.
