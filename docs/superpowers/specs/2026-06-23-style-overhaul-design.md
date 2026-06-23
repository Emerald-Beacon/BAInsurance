# B&A Insurance — Style Overhaul Design

**Date:** 2026-06-23
**Status:** Approved (design), pending implementation plan
**Scope owner:** Jeff Giles

## Goal

Elevate the B&A Insurance Producers site from a competent template into a design
that feels like a real, rooted family business — warm, trustworthy, and quietly
modern — without sacrificing the site's speed, SEO, or clean professionalism.

This is a **confident refinement**, not a redesign: the existing structure,
content, and information architecture stay intact. We raise the craft level of
type, color, motion, and shared components.

## Direction (decisions locked)

| Dimension | Decision |
| --- | --- |
| Ambition | Confident refinement — keep structure/SEO, elevate craft |
| Typography | Warm editorial serif headlines (**Fraunces**) + clean sans body (**Inter**) |
| Palette | Refined blues only — deepen and add cohesion, no new hue |
| Motion | Subtle & tasteful, CSS-only, `prefers-reduced-motion` safe, no JS libraries |
| Scope | Phased: design system + homepage first, then interior pages |

## Non-negotiable constraints

These are guardrails the implementation must honor and that we verify before
calling any phase done:

1. **Fast.** No net regression in page weight or render performance. Font
   strategy must be a net improvement (see Typography). No new JS dependencies.
2. **SEO-safe.** Output stays fully static. All content is server-rendered and
   present in the HTML without JavaScript. Existing meta, canonical, sitemap,
   and JSON-LD schema are preserved unchanged.
3. **No layout shift (CLS).** Explicit dimensions on all images; `font-display: swap`
   with preloaded critical fonts.
4. **Progressive enhancement.** Motion only *enhances*. With JS disabled or
   `prefers-reduced-motion`, all content is fully visible immediately.
5. **Accessible.** Maintain semantic HTML, focus states, color contrast (brand
   blue and navy on white/light backgrounds meet WCAG AA for text).

## 1. Design tokens (`src/styles/global.css`)

All visual decisions flow from a small token set so the system stays consistent
and the interior-page rollout is mechanical.

### Type tokens

- **Headlines:** Fraunces (variable serif). Applied to `h1`–`h3` and display
  text. Eyebrow/label text (the small uppercase tracking-widest lines) stays in
  the sans for contrast.
- **Body / UI:** Inter (already in use).
- Define CSS variables / Tailwind v4 `@theme` font families:
  - `--font-serif: 'Fraunces', Georgia, 'Times New Roman', serif;`
  - `--font-sans: 'Inter', system-ui, sans-serif;`

### Color tokens (refined blues)

Replace the current `@theme` block with:

```
--color-navy:        #013A52   /* deep anchor: dark sections, deepest headlines */
--color-brand:       #016490   /* primary brand blue (unchanged) */
--color-brand-dark:  #014d6e   /* existing hover/darker brand (retained) */
--color-brand-light: #7EBEE7   /* accent (unchanged) */
--color-ink:         #15212B   /* body text — slightly deeper than today's slate */
--color-bg:          #F5F7F9   /* near-neutral section background (replaces mist usage) */
--color-mist:        #f4f8fb   /* retained for existing references during transition */
--color-line:        #E5EBF0   /* refined card/section borders */
--color-gray:        #879096   /* retained */
```

Notes:
- `--color-mist` and `--color-brand-dark` are retained so existing class usage
  does not break mid-transition; new work prefers `--color-bg`, `--color-line`,
  `--color-navy`, and `--color-ink`.
- Body text color moves from `#1e293b` to `--color-ink` (`#15212B`).

## 2. Typography delivery & performance

**Self-host both fonts via Fontsource; remove the Google Fonts `<link>`.**

- Add dev dependencies: `@fontsource-variable/fraunces` and `@fontsource/inter`
  (or `@fontsource-variable/inter`).
- Import the needed weights/axes in the global stylesheet or Layout.
- **Preload** the two critical font files (Fraunces display weight used by the
  hero H1, Inter regular body) as `woff2` with `rel="preload"`.
- Set `font-display: swap` on all faces.
- **Remove** the `preconnect` to fonts.googleapis/gstatic and the
  `<link href="https://fonts.googleapis.com/...">` from `Layout.astro`.

Rationale: self-hosting eliminates a render-blocking third-party stylesheet and
an extra DNS/TLS round trip, improving LCP and removing a third-party dependency
— a net speed/SEO win versus today, which is what makes adding a second font
family safe.

Keep Fraunces lean: import only the axes/weights actually used (e.g. a display
weight ~600 and a normal ~400/500). Avoid loading the full variable range if it
meaningfully increases transfer size; subset to Latin.

## 3. Motion system

- A small **inline** IntersectionObserver script (no external library) toggles an
  `is-visible` class on elements marked to animate as they enter the viewport.
- CSS defines the reveal: target starts at `opacity: 0; translateY(~16px)` and
  transitions to visible. Hover lifts on cards via existing transition utilities.
- **Progressive enhancement contract:** elements are visible by default. The
  enhancement script adds the "pre-animation" hidden state only when JS runs and
  motion is allowed, then reveals on scroll. Therefore:
  - No JS → everything visible (crawler- and fallback-safe).
  - `prefers-reduced-motion: reduce` → script no-ops / CSS shows content
    immediately, no transforms.
- Implemented once (shared CSS + a tiny script in the Layout or a small
  component) so all pages inherit it.

## 4. Shared components

### Header (`src/components/Header.astro`)
- Keep: sticky positioning, logo, nav links, mobile menu, "Get a Quote" CTA.
- Refine: nav active/hover states against the new tokens; add a subtle
  border/shadow that strengthens on scroll; restyle the CTA button; tighten
  spacing/typography. Mobile menu behavior unchanged.

### Footer (`src/components/Footer.astro`)
- Keep: structure, all links, contact info, legal/Medicare disclaimer, schema-
  irrelevant content.
- Refine: section headings adopt the type system; spacing and hierarchy polished;
  colors aligned to refined tokens.

## 5. Homepage redesign (`src/pages/index.astro`) — the proof

Same content and section order, elevated to the new system:

- **Hero:** serif H1; refined sans eyebrow; cleaner photo treatment (navy offset
  frame replacing the light-blue one); refined trust chips. Hero image keeps
  `fetchpriority="high"` and explicit dimensions.
- **Trust bar:** restyled to tokens.
- **Services grid:** keep the existing inline SVG line-icon cards; add hover lift
  and scroll reveal; refine borders/spacing with new tokens.
- **Why Choose Us:** **replace the four emoji (🔍 🤝 ⚡ 📍) with refined inline
  SVG line icons.** Keep the stat tiles; refine styling. (Highest-impact
  "less templated" change.)
- **About callout:** keep the photo-background treatment; refine overlay/type.
- **FAQ:** keep `<details>` semantics (good for SEO/no-JS); refine styling.
- **CTA:** restyled to tokens.

## 6. Phasing

- **Phase 1 (this round):** tokens + self-hosted fonts + Header + Footer + full
  homepage. **User reviews the real rendered result before rollout.**
- **Phase 2:** `personal`, `business`, `health`.
- **Phase 3:** `about`, `our-team`, `contact-us`, `blog`, `newsletters`,
  `privacy-policy`, `[slug]` (blog post template).

Each phase ends with a production build (`npm run build`) confirmed green before
it is considered done.

## 7. Verification (per phase)

- `npm run build` completes with no errors; static output intact.
- Visual review of rendered pages (dev server / built output).
- Spot-check: content present in HTML with JS disabled; no console errors;
  `prefers-reduced-motion` shows content without animation; no obvious CLS.
- Confirm meta/canonical/sitemap/JSON-LD unchanged.

## Out of scope

- Content/copy rewrites (text stays as-is unless a change is incidental to layout).
- New pages or new information architecture.
- Responsive image pipeline / `<Image>` component migration (possible future
  enhancement; not required for this overhaul).
- Color hue additions beyond the refined-blue palette.
