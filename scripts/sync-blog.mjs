#!/usr/bin/env node
// Backfill new blog posts from the live WordPress site into src/data/posts.json.
//
// The live site (bowthorpeinsurance.com) is the source of truth for blog
// content. This script pulls posts via the WordPress REST API, finds any whose
// slug is not yet in posts.json, converts their HTML to the plain-text
// paragraph format this site uses, and prepends them (newest first).
//
// Usage:
//   node scripts/sync-blog.mjs            apply: add any missing posts
//   node scripts/sync-blog.mjs --dry-run  show what would be added, write nothing
//
// It only ever ADDS missing posts; it never edits or removes existing entries.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SITE = 'https://bowthorpeinsurance.com';
const API = `${SITE}/wp-json/wp/v2/posts`;
const POSTS_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'posts.json');

// The live host sits behind ModSecurity, which rejects non-browser requests.
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'application/json',
};

const dryRun = process.argv.includes('--dry-run');

// Live posts we deliberately do NOT mirror. Each entry should explain why and,
// if the post was replaced, point at the local slug that superseded it.
const EXCLUDED_SLUGS = new Set([
  // Wrong market (Idaho Falls); rewritten locally as
  // why-choosing-an-independent-home-insurance-agency-in-bountiful-utah-is-a-smart-move
  // with a 301 in public/_redirects.
  'why-choosing-an-independent-home-insurance-agency-in-idaho-falls-is-a-smart-move',
]);

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘',
  rdquo: '”', ldquo: '“', laquo: '«', raquo: '»', copy: '©',
  reg: '®', trade: '™', deg: '°', frac12: '½', frac14: '¼', frac34: '¾',
};

function decodeEntities(str) {
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, name) =>
      Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name) ? NAMED_ENTITIES[name] : m
    );
}

// WordPress content.rendered is well-formed block HTML (p / h2 / li / etc.).
// Turn each block into its own line; the Astro renderer wraps each line in <p>.
function htmlToParagraphs(html) {
  let s = html;
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<figure\b[\s\S]*?<\/figure>/gi, '\n'); // drop images + captions
  s = s.replace(/<li\b[^>]*>/gi, '\n'); // list items start a new line
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/(p|div|h[1-6]|li|ul|ol|blockquote|tr|table|section|article|header|footer)>/gi, '\n');
  s = s.replace(/<[^>]+>/g, ''); // strip any remaining tags
  s = decodeEntities(s);
  return s
    .split('\n')
    .map((line) => line.replace(/[ \t ]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function makeExcerpt(content) {
  const flat = content.replace(/\s+/g, ' ').trim();
  if (flat.length <= 200) return flat;
  let cut = flat.slice(0, 200);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 0) cut = cut.slice(0, lastSpace);
  return cut.replace(/[\s.,;:]+$/, '') + '...';
}

async function fetchAllPosts() {
  const all = [];
  for (let page = 1; ; page++) {
    const url = `${API}?per_page=100&page=${page}&orderby=date&order=desc&_fields=slug,date,title,content`;
    const res = await fetch(url, { headers: HEADERS });
    if (res.status === 400 || res.status === 404) break; // past the last page
    if (!res.ok) throw new Error(`WP API ${res.status} ${res.statusText} for ${url}`);
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    const totalPages = Number(res.headers.get('x-wp-totalpages') || page);
    if (page >= totalPages) break;
  }
  return all;
}

async function main() {
  const existing = JSON.parse(await readFile(POSTS_FILE, 'utf8'));
  const existingSlugs = new Set(existing.map((p) => p.slug));

  const live = await fetchAllPosts();
  console.log(`Live site: ${live.length} posts · local: ${existing.length} posts`);

  const missing = live
    .filter((p) => p.slug && !existingSlugs.has(p.slug) && !EXCLUDED_SLUGS.has(p.slug))
    .map((p) => {
      const content = htmlToParagraphs(p.content?.rendered ?? '');
      return {
        title: decodeEntities((p.title?.rendered ?? '').trim()),
        slug: p.slug,
        excerpt: makeExcerpt(content),
        content,
        date: String(p.date).slice(0, 10), // YYYY-MM-DD
      };
    })
    .filter((p) => p.content.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date)); // newest first

  if (missing.length === 0) {
    console.log('✓ Already up to date — no new posts to add.');
    return;
  }

  console.log(`\n${missing.length} new post(s) found:`);
  for (const p of missing) console.log(`  • [${p.date}] ${p.title}  (/${p.slug}/)`);

  if (dryRun) {
    console.log('\n--dry-run: no changes written.');
    return;
  }

  const merged = [...missing, ...existing];
  await writeFile(POSTS_FILE, JSON.stringify(merged, null, 2) + '\n');
  console.log(`\n✓ Added ${missing.length} post(s). posts.json now has ${merged.length} entries.`);
  console.log('  Review with `git diff`, rebuild, then commit when it looks right.');
}

main().catch((err) => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
