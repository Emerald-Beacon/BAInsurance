# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

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

The live WordPress site, **bowthorpeinsurance.com**, is the source of truth for
post content. To pull in posts published there but not yet on this site:

```sh
npm run sync:blog:check   # preview: shows which posts would be added
npm run sync:blog         # apply: prepends missing posts (newest first)
```

`scripts/sync-blog.mjs` reads the WordPress REST API (`/wp-json/wp/v2/posts`),
converts each post's HTML to the plain-text paragraph format used here, and only
**adds** posts whose slug is missing — it never edits or deletes existing
entries. After running it, review with `git diff`, run `npm run build` to
confirm the new pages generate, then commit.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
