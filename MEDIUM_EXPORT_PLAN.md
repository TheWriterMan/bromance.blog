# Medium → Markdown Export Plan

## Overview

Extract 76 Medium posts from `medium/posts/*.html` into clean markdown files with full frontmatter. Images get Cloudinary URLs (already uploaded). Output goes to `export/` directory.

---

## Source Material

- **Location**: `medium/posts/` — 76 HTML files (71 published + 5 drafts)
- **Lists** (category mapping): `medium/lists/` — 6 list files mapping post IDs to categories
- **Author**: Amisha Singh Rana (Medium: `@amishasinghrana`), display as `Amy97`
- **Cloudinary**: Account `dtperak4e`, folder `bromance-blog/`, 185 images already uploaded with prefix `medium-{hash}`

---

## Frontmatter Schema

Every markdown file gets this YAML frontmatter block. All fields are required (use empty string or null if not available):

```yaml
---
title: ""                   # From .p-name or <title> tag (clean, no "Review: " prefix removal)
slug: ""                    # Derived from filename (the URL-safe portion before the medium ID)
date: ""                    # Original publish date from footer <time class="dt-published"> (ISO 8601)
updated: ""                 # Same as date (Medium export doesn't provide a separate updated field)
author: "Amy97"             # Always this value
category: ""                # From list membership (see Category Mapping below)
tags: []                    # Extracted from content signals (see Tag Derivation below)
summary: ""                 # From section[data-field="subtitle"] .p-summary text
featured_image: ""          # Cloudinary URL of the image marked data-is-featured="true", or first image
og_image: ""                # Same as featured_image
canonical_url: ""           # From footer <a class="p-canonical"> href, or construct from medium URL
status: "published"         # "published" for dated posts, "draft" for draft_* files
medium_id: ""               # The hex ID suffix from the filename (e.g. "d7fb7aa2e5da")
medium_url: ""              # Full original Medium URL (from canonical link in footer)
word_count: 0               # Computed from final markdown body text (words only, no markup)
reading_time: ""            # Computed: ceil(word_count / 238) + " min read"
has_images: false           # Boolean: whether the post contains any images
image_count: 0              # Number of images in the post body
---
```

---

## Category Mapping

Derive from list membership. A post can appear in multiple lists — use the FIRST match in this priority order:

| List File | Category Value |
|-----------|---------------|
| `Everything-Reviews-6445f1eb0446.html` | `reviews` |
| `Everything-Legal-e0b4bf7022c1.html` | `legal` |
| `Everything-Mysterious-15a72cb1ad53.html` | `mystery` |
| `History-s-Most-Heinous-Crimes-278c56342388.html` | `true-crime` |
| `Everything-Tech-3a8934d7ec02.html` | `tech` |
| `Everything-Wellness-a04f81e673a6.html` | `wellness` |

Posts not in any list get category: `uncategorized`

Note: `Reading-list-predefined:bab9ce422913:READING_LIST.html` is the user's personal reading list (includes other people's posts). IGNORE it — it's not a category.

---

## Tag Derivation

Tags are derived from content signals — NOT from Medium's native tagging (not available in export). Use these rules:

1. If filename contains `Review--` or title starts with "Review:" → add tag `review`
2. If title/content mentions donghua, Chinese animation → add tag `donghua`
3. If title/content mentions K-Drama, Korean drama → add tag `kdrama`
4. If title/content mentions C-Drama, Chinese drama → add tag `cdrama`
5. If title/content mentions manga → add tag `manga`
6. If title/content mentions Thai drama → add tag `thai-drama`
7. If title/content mentions Taiwan → add tag `taiwanese`
8. If category is `mystery` or `true-crime` → add tag `true-crime`
9. If title/content mentions legal, law, lawyer, tort → add tag `legal`
10. If title/content mentions startup, business → add tag `business`
11. If title/content mentions K-pop, idol → add tag `kpop`

Keep tags lowercase, hyphenated. Max 5 tags per post. Prioritize specificity.

---

## Image Handling

### How the Cloudinary URL is derived

The migration script used a **deterministic hash** to name uploaded images:

```
public_id = "medium-" + sha256(source_url).hex().slice(0, 12)
folder = "bromance-blog"
```

So for any Medium image URL like `https://cdn-images-1.medium.com/max/800/0*i6NBBivV3vrqIQla.jpg`:

1. Compute: `sha256("https://cdn-images-1.medium.com/max/800/0*i6NBBivV3vrqIQla.jpg")` → take first 12 hex chars
2. Construct: `https://res.cloudinary.com/dtperak4e/image/upload/bromance-blog/medium-{hash}.{format}`

### Format detection

The original migration didn't preserve the source extension in the public_id. All uploaded images default to their detected format. Since we can't know the exact format without querying Cloudinary, use this approach:

**Option A (simple, recommended):** Use Cloudinary's auto-format URL (no extension needed):
```
https://res.cloudinary.com/dtperak4e/image/upload/bromance-blog/medium-{hash}
```
Cloudinary serves the correct format automatically when no extension is specified.

**Option B (if you want explicit URLs):** Query the Cloudinary API for each hash to get the actual format. This is slower but more precise.

**Recommendation: Use Option A.** The extensionless URL works fine and avoids API calls.

### Featured image selection

Priority order:
1. The `<img>` element with `data-is-featured="true"` attribute
2. If none marked, the FIRST `<img>` inside `.e-content`
3. If no images at all, leave `featured_image` empty

### Image in markdown body

Replace each `<img src="...medium CDN URL...">` with:
```markdown
![{alt_text}](https://res.cloudinary.com/dtperak4e/image/upload/bromance-blog/medium-{hash})
```

If the image has a `<figcaption>`, render as:
```markdown
![{alt_text}](https://res.cloudinary.com/dtperak4e/image/upload/bromance-blog/medium-{hash})
*{caption_text}*
```

If no alt text available, use empty alt: `![](...)`

### Images that may NOT be in Cloudinary

The migration only ran against posts that were in the DB at that time (the "Everything Reviews" list — 7 posts). Posts from other lists or uncategorized posts may still have raw Medium CDN URLs with NO corresponding Cloudinary upload.

**For images that can't be mapped to Cloudinary:** Keep the original Medium CDN URL as-is in the markdown. Add a comment at the top of the file:
```markdown
<!-- WARNING: This post contains Medium CDN image URLs that may be broken. Re-upload needed. -->
```

---

## HTML → Markdown Conversion Rules

### Elements to convert

| HTML | Markdown |
|------|----------|
| `<h2>`, `<h3>` with class `graf--h3` | `## Heading` (h3 in Medium = h2 in markdown, since h1 is title) |
| `<h4>` with class `graf--h4` | `### Heading` |
| `<p>` | Plain paragraph with blank line above/below |
| `<strong>`, `<b>` | `**bold**` |
| `<em>`, `<i>` | `*italic*` |
| `<a href="...">text</a>` | `[text](url)` |
| `<blockquote>` | `> quoted text` |
| `<ul>/<li>` | `- list item` |
| `<ol>/<li>` | `1. list item` |
| `<pre><code>` | ````code block```` |
| `<code>` (inline) | `` `code` `` |
| `<figure>` with `<img>` | Image markdown (see above) |
| `<figure>` with `<iframe>` (YouTube) | `{{< youtube VIDEO_ID >}}` or just the URL on its own line |
| `<hr>` / `.section-divider` | `---` |
| `<br>` in sequence (empty grafs) | Single blank line (collapse multiples) |

### Elements to STRIP (remove entirely)

- `.graf--title` (duplicates the title already in frontmatter)
- `.graf--subtitle` (duplicates the summary already in frontmatter)
- `.section-divider` at the very top (the first one is just Medium's section opener)
- Any `<p>` that contains ONLY a link to `asrreviews.carrd.co` or similar author self-link (the "by ASRReviews" line)
- Empty `<p>` tags (`graf--empty`)
- The `<footer>` section
- All `class`, `id`, `name`, `data-*` attributes (they're just Medium's internal markup)

### Special handling

- **YouTube embeds**: Extract video ID from iframe `src` (pattern: `youtube.com/embed/{VIDEO_ID}`). Output as a standalone link: `https://www.youtube.com/watch?v={VIDEO_ID}`
- **Medium internal links** (`medium.com/p/...`): Keep as-is (they're cross-references to other posts)
- **Horizontal rules**: Only keep if they separate actual content sections. Don't keep the one at the very start of the body.

---

## Output Structure

```
export/
├── reviews/
│   ├── the-last-dynasty-a-modern-chinese-donghua-with-supernatural-flair.md
│   ├── the-trauma-code-heroes-on-call-k-drama-2025.md
│   ├── ya-she-the-company-from-tencent-2025.md
│   ├── brain-works-detective-k-drama-2023.md
│   ├── mudborn-2025-taiwanese-horror-movie.md
│   ├── echoes-of-evidence-chinese-detective-drama-2026.md
│   └── dramas-with-no-f-m-romance.md
├── legal/
│   └── ...14 posts...
├── mystery/
│   └── ...12 posts...
├── true-crime/
│   └── ...12 posts (overlaps with mystery — use priority order)...
├── tech/
│   └── ...6 posts...
├── wellness/
│   └── ...3 posts...
├── uncategorized/
│   └── ...31 posts...
└── drafts/
    └── ...5 draft posts...
```

### Filename convention

Derived from the Medium filename, cleaned:
1. Strip the date prefix (`2026-01-14_`)
2. Strip the medium ID suffix (`-d7fb7aa2e5da`)
3. Strip `draft_` prefix
4. Convert to lowercase
5. Replace `--` with `-`
6. Replace remaining non-alphanumeric (except hyphens) with nothing
7. Trim leading/trailing hyphens

Example: `2026-01-14_Review--The-Last-Dynasty---A-Modern-Chinese-Donghua-With-Supernatural-Flair-d7fb7aa2e5da.html`
→ `review-the-last-dynasty-a-modern-chinese-donghua-with-supernatural-flair.md`

Draft posts go in the `drafts/` subfolder regardless of category.

---

## Slug Convention

The `slug` in frontmatter should match the output filename (without `.md`). This is what the blog will use as the URL path.

---

## Edge Cases

1. **Post `0019ccbaa50a`** — A one-line comment/reply ("Sadly that is our reality..."). Still export it, but it'll be tiny.
2. **Post `f5384b3b664e`** — "About my work" — personal/meta post. Export as uncategorized.
3. **Post `e9510a9f2505`** — "War of" — appears to be an abandoned draft fragment. Export to drafts/.
4. **Post `cfddcd4a48f4`** — Referenced in Reading List but NO corresponding file exists in posts/. SKIP IT (it's someone else's post they bookmarked).
5. **Posts in multiple lists** — e.g. a post in both "Everything Mysterious" and "History's Most Heinous Crimes". Use the FIRST match per priority table above.
6. **Drafts** — Files prefixed with `draft_`. Set `status: "draft"`, put in `drafts/` folder.
7. **Very short posts** (< 50 words) — Still export. The frontmatter still has value.

---

## Implementation Notes (for the executing model)

### Dependencies needed

```bash
npm install cheerio
# That's it. Node.js built-in crypto for sha256.
```

### Script entry point

Create `scripts/export-medium-to-markdown.ts`. Run with `npx tsx scripts/export-medium-to-markdown.ts`.

### Processing order

1. Parse all list files → build a `Map<mediumId, category>`
2. For each file in `medium/posts/`:
   a. Parse HTML with cheerio
   b. Extract metadata (title, date, summary, canonical URL, medium ID)
   c. Determine category from the map
   d. Derive tags from title/content
   e. Find featured image
   f. Convert `.e-content` HTML to markdown
   g. For each `<img>`, compute sha256 hash of src URL → construct Cloudinary URL
   h. Compute word count and reading time
   i. Write `.md` file to appropriate `export/{category}/` directory

### Quality checks after export

- Verify no empty markdown bodies
- Verify no broken Cloudinary URLs (spot-check a few hashes against the API)
- Verify frontmatter YAML is valid (no unescaped special chars in title/summary)
- Count: should produce 76 files total (71 in category folders + 5 in drafts/)

---

## Example Output

For `2026-01-14_Review--The-Last-Dynasty---A-Modern-Chinese-Donghua-With-Supernatural-Flair-d7fb7aa2e5da.html`:

```markdown
---
title: "Review: The Last Dynasty — A Modern Chinese Donghua With Supernatural Flair"
slug: "review-the-last-dynasty-a-modern-chinese-donghua-with-supernatural-flair"
date: "2026-01-14T11:30:39.169Z"
updated: "2026-01-14T11:30:39.169Z"
author: "Amy97"
category: "reviews"
tags: ["review", "donghua"]
summary: "by ASRReviews"
featured_image: "https://res.cloudinary.com/dtperak4e/image/upload/bromance-blog/medium-1fcf2c4caaab"
og_image: "https://res.cloudinary.com/dtperak4e/image/upload/bromance-blog/medium-1fcf2c4caaab"
canonical_url: "https://medium.com/@amishasinghrana/review-the-last-dynasty-a-modern-chinese-donghua-with-supernatural-flair-d7fb7aa2e5da"
status: "published"
medium_id: "d7fb7aa2e5da"
medium_url: "https://medium.com/@amishasinghrana/review-the-last-dynasty-a-modern-chinese-donghua-with-supernatural-flair-d7fb7aa2e5da"
word_count: 892
reading_time: "4 min read"
has_images: true
image_count: 3
---

*The Last Dynasty* (also known as *The Chosen One*, original title *谷围南亭*) is a 2025 Chinese animated series (donghua) that blends supernatural mystery, historical myth, and character growth in a surprisingly compelling way.

![](https://res.cloudinary.com/dtperak4e/image/upload/bromance-blog/medium-1fcf2c4caaab)

## Engaging plot?

The story kicks off in a seemingly ordinary modern setting...

(... rest of content ...)

https://www.youtube.com/watch?v=pKXYhcrROjc
```

---

## YAML Escaping Rules

Titles and summaries MUST be wrapped in double quotes. Within those quotes:
- Escape `"` as `\"`
- Escape `\` as `\\`
- Colons, brackets, and other YAML special chars are safe inside double quotes

---

## What NOT To Do

- Do NOT strip "Review:" from titles — keep them as-is from Medium
- Do NOT strip author identity references (ASRReviews, slipperyslipped) from content — that cleanup is a separate concern
- Do NOT modify or rewrite any content — extract faithfully
- Do NOT re-upload images — they already exist in Cloudinary
- Do NOT touch the database
- Do NOT query the Cloudinary API for every image — use the deterministic hash approach
