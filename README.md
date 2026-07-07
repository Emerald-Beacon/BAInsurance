# B&A Insurance Producers — bowthorpeinsurance.com

Static marketing site for B&A Insurance Producers (Bowthorpe & Associates), an
independent insurance agency in Bountiful, Utah. Built with Astro + Tailwind,
deployed on Netlify.

## 🚀 Project Structure

```text
/
├── public/            # logos, favicons, images (served as-is)
├── src/
│   ├── components/    # Header, Footer
│   ├── layouts/       # Layout.astro (meta tags, LocalBusiness schema)
│   ├── data/          # posts.json (blog content)
│   └── pages/         # one .astro file per route; [slug].astro renders posts
└── scripts/           # sync-blog.mjs (WordPress backfill)
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
| `npm run sync:blog:check` | List live posts missing locally (writes nothing) |
| `npm run sync:blog`       | Backfill any missing blog posts into `posts.json`|

## ✍️ Blog content

Blog posts live in `src/data/posts.json` (one object per post: `title`, `slug`,
`excerpt`, `content`, `date`). The blog index and each `/<slug>/` page are
generated from this file at build time.

Until the domain cutover, the old WordPress site at **bowthorpeinsurance.com**
is the source of truth for post content. To pull in posts published there but
not yet on this site (run one last time right before switching the domain):

```sh
npm run sync:blog:check   # preview: shows which posts would be added
npm run sync:blog         # apply: prepends missing posts (newest first)
```

`scripts/sync-blog.mjs` reads the WordPress REST API (`/wp-json/wp/v2/posts`),
converts each post's HTML to the plain-text paragraph format used here, and only
**adds** posts whose slug is missing — it never edits or deletes existing
entries. After running it, review with `git diff`, run `npm run build` to
confirm the new pages generate, then commit.
