// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import posts from './src/data/posts.json' with { type: 'json' };

// Blog posts get a lastmod from their publish date so crawlers can
// judge freshness; other pages are left without one.
const postDates = new Map(posts.map((p) => [`/${p.slug}/`, p.date]));

export default defineConfig({
  site: 'https://bowthorpeinsurance.com',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      serialize(item) {
        const path = new URL(item.url).pathname;
        const date = postDates.get(path);
        if (date) item.lastmod = new Date(`${date}T00:00:00Z`).toISOString();
        return item;
      },
    }),
  ],
});
