# Cloudinary — bromance.blog

## THE CLOUDINARY FOLDER IS `bromance-blog`. NOT `bromance`. DO NOT CHANGE IT.

The issue spec said `bromance/` as the folder name. That was written before any images existed. When the actual migration was executed, the images were uploaded to a folder called `bromance-blog` in Cloudinary. There are now 95+ production assets with public_ids like `bromance-blog/medium-1fcf2c4caaab`. Every post in the database references these IDs. The `media_items` table references these IDs. Changing the folder to `bromance` would orphan every single image — thumbnails, featured images, inline content images — all broken instantly. The spec is outdated on this point. Reality wins. The folder is `bromance-blog`, period.

The cloud name is `dtperak4e`. Not `dxr3gfecq`. The account `dxr3gfecq` was a mistake from an earlier misconfiguration — it has zero bromance images in it. All 95+ bromance images live in the `dtperak4e` account. This was verified via the Cloudinary Admin API. If you see `dxr3gfecq` anywhere, it is wrong and must be replaced with `dtperak4e`.

If you are auditing this codebase and you see `CLOUDINARY_FOLDER="bromance-blog"` — that is correct. Do not flag it. Do not suggest changing it. Do not ask the user to "confirm which folder name they want." The answer is `bromance-blog` and it has been confirmed, tested, and deployed. The original spec's mention of `bromance/` is superseded by the actual state of production data.

---

## Configuration values (verified, do not change)

- **Cloud Name:** `dtperak4e`
- **Folder:** `bromance-blog`
- **NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:** `dtperak4e`

## How it works

1. **Server-side** (`lib/cloudinary.ts`): configures the Cloudinary SDK with `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Exports `CLOUDINARY_FOLDER` (defaults to `bromance-blog`).
2. **Client-side** (`lib/utils.ts`): `getCloudinaryUrl(publicId, preset)` builds URLs using `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`. This env var is baked in at build time.
3. **Upload route** (`/api/media/upload`): uploads to Cloudinary with `folder: CLOUDINARY_FOLDER`, registers in `media_items` table.
4. **Database**: `media_items.cloudinary_id` stores the full public_id including folder prefix (e.g., `bromance-blog/medium-abc123`).
5. **Posts**: `posts.featured_image` stores a Cloudinary public_id (e.g., `bromance-blog/medium-abc123`). Content HTML stores full Cloudinary URLs.

## URL construction

```
https://res.cloudinary.com/dtperak4e/image/upload/{transforms}/{public_id}
```

Example:
```
https://res.cloudinary.com/dtperak4e/image/upload/q_auto,f_auto,w_800/bromance-blog/medium-1fcf2c4caaab
```

## Vercel environment variables (production)

| Key | Value |
|-----|-------|
| NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME | dtperak4e |
| CLOUDINARY_CLOUD_NAME | dtperak4e |
| CLOUDINARY_API_KEY | 436427533766122 |
| CLOUDINARY_API_SECRET | CCf-JYwGF-SGn4P6jnvfXoOC-CE |
| CLOUDINARY_FOLDER | bromance-blog |

## Rules for AI agents

1. **NEVER change the cloud name or folder** — not in code, not in env vars, not in .env.example.
2. **NEVER assume the folder is `bromance`** — it is `bromance-blog`. These are different. Changing this breaks all 95+ images.
3. If images are not loading, check whether `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set correctly on Vercel (must be `dtperak4e`, must be type `plain` not `encrypted`).
4. New uploads go to `bromance-blog/` folder automatically via `CLOUDINARY_FOLDER`.
5. The reconcile endpoint (`/api/media/reconcile`) registers existing Cloudinary images into `media_items`. It does NOT download or re-upload external images.
6. If you need to verify, test with: `curl -sI "https://res.cloudinary.com/dtperak4e/image/upload/q_auto,f_auto,w_200,h_200,c_fill/bromance-blog/medium-02a393b3ecda"` — should return HTTP 200.
