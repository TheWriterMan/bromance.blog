# Cloudinary — bromance.blog

## DO NOT CHANGE THESE VALUES

The Cloudinary configuration for this project has been verified and tested. The values below are correct and must not be changed.

- **Cloud Name:** `dtperak4e`
- **Folder:** `bromance-blog`
- **NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:** `dtperak4e`

## Why these specific values

- The cloud name is `dtperak4e` — this is the Cloudinary account that holds all bromance images (95+ assets in the `bromance-blog/` folder). The account `dxr3gfecq` is WRONG and does NOT contain bromance images.
- The folder is `bromance-blog` (NOT `bromance`). All existing assets have public_ids like `bromance-blog/medium-xxx`. Changing this to `bromance` breaks every image URL.

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
