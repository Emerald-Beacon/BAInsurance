# Autonomous Publishing Runbook — B&A Insurance Producers

**Source of truth for the auto-blog.** The live prompt runs in a Claude cloud routine (see IDs below); this file is the human-readable mirror. Adapted from the Emerald Beacon `blog-autopilot` house pattern for this **Astro / `posts.json`** site (not the static-HTML pattern).

---

## Schedule
- **Cadence:** 1 post / week, **Tuesdays**.
- **Cron (UTC):** `0 16 * * 2` → **10:00 AM Mountain (MDT) / 9:00 AM (MST)**, always a Tuesday.
- **Mode:** Auto-push to `main` (site deploys on push). **No human review gate** — the guardrails below are the only safety net.
- **Model:** `claude-opus-4-8` (legally sensitive vertical: insurance + Medicare).

## Routine
- **Name:** `B&A Insurance — Auto Blog (Tue)`
- **Routine ID:** _(filled in on creation, Step 6)_
- **Repo / source:** `https://github.com/Emerald-Beacon/BAInsurance` · branch `main`
- **Live domain:** https://bowthorpeinsurance.com
- **Environment ID:** `env_017YKRuTNwzNA6UzzKQyYZy9`
- **Allowed tools:** Bash, Read, Write, Edit, Glob, Grep, WebSearch, WebFetch

## How the queue works (idempotent)
Each run publishes the **first queue slug that is not yet present in `src/data/posts.json`.** So a missed or double run self-heals: it never republishes an existing slug, and it never skips ahead. When the queue is exhausted, the run exits without publishing and pings for a calendar refresh.

## This site's integration points (Astro — one file does most of it)
A new post is **one object appended to `src/data/posts.json`.** Everything else regenerates at build:
- `src/pages/blog/index.astro` — listing (sorts by date desc; shows hero image if present)
- `src/pages/rss.xml.js` — RSS feed
- `astro.config.mjs` `@astrojs/sitemap` — sitemap + `<lastmod>`
- `src/pages/[slug].astro` — renders the post + `Article` JSON-LD + breadcrumbs; uses the hero image for `og:image` and schema image
- Hero image file → `public/images/blog/<slug>.jpg`
- `public/llms.txt` — **static, not per-post.** Leave as-is (blog referenced generically). Do not edit per run.

**Post object schema:**
```json
{
  "title": "Title Case, no site name",
  "slug": "kebab-case-matches-queue",
  "excerpt": "1–2 sentence summary, plain text.",
  "content": "Body prose. Paragraphs separated by single newlines. PLAIN TEXT ONLY — no markdown, no HTML, no inline links (the template escapes them). CTAs are supplied by the template.",
  "date": "YYYY-MM-DD (the run date)",
  "image": "/images/blog/<slug>.jpg",
  "imageAlt": "Descriptive alt text, no 'image of'",
  "imageCredit": "Photo by <Name> on Unsplash"
}
```
Older posts have no `image` field — that's fine, the templates fall back gracefully. Never touch existing entries.

## Imagery
- Self-hosted Unsplash. The routine queries Unsplash for a **landscape** photo matching the topic, downloads it to `public/images/blog/<slug>.jpg`, triggers the Unsplash `download_location` endpoint (required by their API terms), and records `imageCredit`.
- **The Unsplash Access Key is inlined in the live routine prompt only. It must NEVER be committed to this repo.**

---

## ⛔ Guardrails (insurance + Medicare = YMYL, auto-published, no review)

**FACTS block — the only agency facts the agent may state, verbatim:**
- B&A Insurance Producers (Bowthorpe & Associates), independent "Trusted Choice" agency in Bountiful, Utah, serving Utah since the early 1980s (founded 1982 by Dennis Bowthorpe; owned by his daughter Sharie and her spouse George since 2005).
- Office: 1075 S. 500 W., Ste. 100, Bountiful, UT 84010 · Phone: (801) 487-2300 · Email: info@bowthorpeinsurance.com
- Hours: Mon–Thu 8:30am–4:30pm, Fri 8:30am–3:00pm.
- Represents 20+ top-rated carriers; represents the client, not any single insurer; quotes and guidance are free.
- Serves all of Utah incl. Bountiful, Salt Lake City, Ogden, Provo.

**Hard rules — every post:**
1. **No specific prices, premiums, rates, or dollar figures.** Stay qualitative ("premiums vary", "often costs less than you'd expect"). No "$X/month", no specific deductible amounts.
2. **No fabricated statistics.** Cite a real, linkable, authoritative source (e.g., Utah Insurance Dept, NAIC, III, CMS, FEMA) or stay qualitative. Never invent percentages or study results.
3. **No coverage guarantees.** Coverage always "depends on your policy" — use *may / typically / often / generally*. Never "will be covered", "always covered", "guaranteed", "fully protected".
4. **Never invent** people, agents, credentials, awards, partnerships, specific carrier relationships, client stories/testimonials, hours, or contact details. Use the FACTS block only.
5. **No advice framed as applying to the reader's specific situation.** General education only; close by inviting a conversation with a licensed B&A agent.
6. **Utah legal facts must be accurate** (e.g., workers' comp generally required for employers; auto liability minimums exist). If unsure of a current number, stay general and point to the Utah Insurance Department — do not state a specific figure.

**Medicare-specific (CMS marketing rules) — for any Health/Medicare post:**
- **Educational only.** Explain how the *system* and enrollment windows work. Do **not** name, rank, compare, or describe the benefits/premiums of any specific Medicare Advantage, Part D, or Supplement plan or carrier.
- **No superlatives** about plans ("best", "top", "#1", "most popular").
- **No implication of Medicare/CMS/government endorsement.**
- Note that plans and benefits vary by person and area, and to speak with a licensed agent. Enrollment dates (AEP Oct 15–Dec 7; ACA OE Nov 1–Jan 15) may be stated as factual dates.

**Routed to human-authored only (agent must NOT write these):**
- Specific Medicare plan comparisons or plan/premium specifics.
- Anything requiring current-year pricing or premium numbers.
- Tax, legal, or investment advice.
- Claims-outcome predictions for a specific scenario.

If the next queue item cannot be written without breaking a hard rule, **skip it, log why, and move to the following queue item.**

---

## The queue (see EDITORIAL-CALENDAR-2026-H2.md for rationale)

1. `utah-atv-utv-insurance-what-riders-need-to-know`
2. `motorcycle-insurance-in-utah-coverage-guide`
3. `earthquake-insurance-utah-wasatch-fault-guide`
4. `renters-insurance-in-utah-what-it-covers-and-why-it-matters`
5. `what-is-the-medicare-annual-enrollment-period`
6. `does-homeowners-insurance-cover-water-damage`
7. `home-inventory-checklist-for-insurance-claims`
8. `rideshare-and-delivery-driver-insurance-in-utah`
9. `questions-to-ask-before-choosing-a-medicare-plan`
10. `how-to-winterize-your-home-and-protect-your-insurance`
11. `flood-insurance-in-utah-do-you-need-it`
12. `scheduled-personal-property-insuring-jewelry-and-valuables`
13. `aca-marketplace-open-enrollment-in-utah-a-timeline`
14. `winter-driving-and-your-auto-insurance-in-utah`
15. `frozen-pipes-and-water-damage-claims-in-winter`
16. `holiday-liability-hosting-guests-and-your-home-insurance`
17. `snowmobile-insurance-in-utah-what-to-know-before-the-season`
18. `does-auto-insurance-cover-rental-cars`
19. `insurance-moves-to-make-before-the-year-ends`
20. `identity-theft-protection-and-your-insurance`
21. `short-term-vs-long-term-disability-insurance`
22. `how-much-life-insurance-do-i-really-need`
23. `commercial-auto-vs-personal-auto-for-business-use`
24. `gap-insurance-for-new-cars-is-it-worth-it`
25. `nonprofit-and-church-insurance-basics-in-utah`
26. `new-year-insurance-checklist-for-growing-families`

Titles/keywords for each are in the editorial calendar.

---

## To change things
- **Pause/resume/reschedule:** update the routine via `RemoteTrigger` (`update` action) or in claude.ai → Automations.
- **Add topics:** append slugs to the queue above *and* in the live routine prompt, after verifying no collision with `src/data/posts.json`.
- **Change cadence:** edit the cron (`0 16 * * 2`). Remember cron is UTC.
- **Rotate the Unsplash key:** update it in the live routine prompt only — never in the repo.

## Commit note
These repos commit only when asked. This runbook + calendar were committed on request; the routine prompt (with the Unsplash key) lives only in the cloud routine.

---

## Appendix — live cloud-agent prompt (key redacted)
The routine runs the prompt below with `<UNSPLASH_ACCESS_KEY>` replaced by the real key. Kept here, version-controlled and key-free, for review.

```
You are the autonomous blog publisher for B&A Insurance Producers (https://bowthorpeinsurance.com),
an independent insurance agency in Bountiful, Utah. Repo is already checked out. Publish ONE new blog
post end-to-end, then stop. Work carefully — this publishes live with no human review.

STEP 1 — Pick the topic (idempotent).
- Read src/data/posts.json (array of {title,slug,excerpt,content,date,...}).
- Walk this ordered QUEUE and select the FIRST slug NOT already present in posts.json:
  [the 26 slugs above, in order]
- If a slug's topic cannot be written without breaking a GUARDRAIL, skip it and take the next.
- If every queue slug already exists, STOP and report "queue exhausted — refresh calendar". Do not invent topics.

STEP 2 — Research (light).
- Use WebSearch/WebFetch only to confirm factual, non-price details (e.g., Utah enrollment dates, whether a
  coverage is legally required). Prefer authoritative sources (Utah Insurance Dept, NAIC, III, CMS, FEMA).
- Do NOT lift text. Do NOT collect prices or statistics you cannot attribute to a linkable authoritative source.

STEP 3 — Write the article (obey ALL guardrails below).
- 900–1400 words, helpful and plain-spoken, Utah/Bountiful voice where natural.
- PLAIN TEXT ONLY: paragraphs separated by single newline characters. No markdown, no HTML, no inline links,
  no headings markup — just prose paragraphs (the template renders each line as a <p>). CTAs are template-supplied.
- Write a 1–2 sentence excerpt (plain text).

STEP 4 — Source a hero image (Unsplash, self-hosted).
- Query Unsplash for a relevant LANDSCAPE photo:
  curl -s "https://api.unsplash.com/search/photos?query=<topic>&orientation=landscape&per_page=5" \
    -H "Authorization: Client-ID <UNSPLASH_ACCESS_KEY>"
- Choose the best result. Download the "regular" (or "full") URL to public/images/blog/<slug>.jpg.
- Trigger the download endpoint (required by Unsplash API terms):
  curl -s "<links.download_location>" -H "Authorization: Client-ID <UNSPLASH_ACCESS_KEY>" >/dev/null
- Record imageCredit = "Photo by <user.name> on Unsplash". Write imageAlt describing the scene (no "image of").

STEP 5 — Insert into posts.json SAFELY (do not hand-edit; use python3 to keep valid JSON):
  python3 - <<'PY'
  import json
  p='src/data/posts.json'; d=json.load(open(p))
  post={"title":..., "slug":..., "excerpt":..., "content":..., "date":"<YYYY-MM-DD today>",
        "image":"/images/blog/<slug>.jpg", "imageAlt":..., "imageCredit":...}
  assert not any(x['slug']==post['slug'] for x in d), "slug exists"
  d.append(post)
  json.dump(d, open(p,'w'), indent=2, ensure_ascii=False)
  PY
- Use the real run date from `date +%F`.

STEP 6 — Validate.
- Run: npm ci --no-audit --no-fund && npm run build   (must succeed; it validates JSON + renders the new page).
- If build fails, fix and rebuild. Do not push a broken build.

STEP 7 — Publish.
- git add -A && git commit -m "Add blog post: <title>" && git push origin main.
- Include the standard co-author trailer.

STEP 8 — Verify live (site deploys on push; allow time).
- Poll https://bowthorpeinsurance.com/<slug>/ until HTTP 200 (retry with sleeps, up to ~10 min).
- Confirm the page renders, the hero image resolves, and the Article JSON-LD contains the new slug.

STEP 9 — Report: slug published, image credit, which queue position, any guardrail skips, and live URL status.

GUARDRAILS (hard — see runbook): no prices/premiums/dollar figures; no fabricated stats (linkable authoritative
source or qualitative); no coverage guarantees (use may/typically/often); never invent people, credentials,
awards, partnerships, carrier relationships, testimonials, hours, or contact info — use the FACTS block verbatim;
general education only, close by inviting a chat with a licensed B&A agent. MEDICARE: educational only, never name
/rank/compare specific plans or carriers, no superlatives, no gov endorsement, note plans vary + see a licensed
agent; enrollment dates may be stated. Route to human-only: specific Medicare plan comparisons, current-year
pricing, tax/legal/investment advice, claims-outcome predictions.

FACTS BLOCK (verbatim): [the FACTS block above]
```
```
```
