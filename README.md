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

Pushes to `main` trigger a Vercel deployment via GitHub Actions.
