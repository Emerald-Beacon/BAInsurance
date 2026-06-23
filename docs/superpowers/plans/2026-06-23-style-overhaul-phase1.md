# Style Overhaul — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the new design system (Fraunces serif + Inter, refined-blue tokens, subtle CSS motion, self-hosted fonts) and apply it to the shared Header/Footer and a fully redesigned homepage, as the reviewable proof before interior-page rollout.

**Architecture:** Tailwind v4 with a token-driven `@theme` block in `global.css`. Fonts are self-hosted (variable woff2 vendored into `public/fonts/`) with hand-written `@font-face` and `<link rel="preload">` in `Layout.astro`; the Google Fonts link is removed. Motion is a progressive-enhancement layer: content is visible by default, and a tiny inline IntersectionObserver in `Layout.astro` adds scroll reveals only when JS runs and motion is permitted. Output stays fully static.

**Tech Stack:** Astro 6, Tailwind CSS v4 (`@tailwindcss/vite`), Fontsource variable fonts (vendored), no new runtime JS dependencies.

## Global Constraints

- Node `>=22.12.0` (from `package.json` `engines`).
- Output stays fully static — no SSR, no new runtime JS libraries.
- All content server-rendered and present in HTML without JavaScript.
- Preserve unchanged: all meta tags, `<link rel="canonical">`, sitemap, and JSON-LD schema in `Layout.astro`.
- No layout shift: every `<img>` keeps explicit `width`/`height`; fonts use `font-display: swap` with the two critical faces preloaded.
- Motion must honor `prefers-reduced-motion: reduce` and degrade to fully-visible content with JS disabled.
- Brand anchor color `#016490` is retained; palette stays within the refined-blue set (no new hue).
- Every task ends with `npm run build` passing before commit.

---

### Task 1: Self-host fonts + design tokens + base typography

**Files:**
- Modify: `package.json` (add devDependencies)
- Create: `public/fonts/fraunces-variable.woff2`, `public/fonts/inter-variable.woff2`
- Modify: `src/styles/global.css`
- Modify: `src/layouts/Layout.astro:76-78` (font `<link>`s), `:86` (body inline font)

**Interfaces:**
- Produces: CSS custom properties `--font-serif`, `--font-sans`; color tokens `--color-navy` `#013A52`, `--color-ink` `#15212B`, `--color-bg` `#F5F7F9`, `--color-line` `#E5EBF0` (plus retained `--color-brand` `#016490`, `--color-brand-dark` `#014d6e`, `--color-brand-light` `#7EBEE7`, `--color-mist` `#f4f8fb`, `--color-gray` `#879096`). Base `h1`–`h3` render in Fraunces. These tokens/utilities are consumed by Tasks 3, 4, and 5.

- [ ] **Step 1: Install Fontsource variable font packages**

```bash
cd "/Users/jeffgiles/App Projects/BAInsurance"
npm install -D @fontsource-variable/fraunces @fontsource-variable/inter
```

- [ ] **Step 2: Locate the vendored variable woff2 files**

```bash
ls node_modules/@fontsource-variable/fraunces/files/ | grep 'latin.*normal.woff2'
ls node_modules/@fontsource-variable/inter/files/ | grep 'latin.*normal.woff2'
```

Expected: a Fraunces "full normal" (opsz/wght axes) latin woff2 such as `fraunces-latin-full-normal.woff2`, and an Inter latin normal woff2 such as `inter-latin-wght-normal.woff2`. Note the exact filenames for the next step.

- [ ] **Step 3: Copy the variable woff2 files into `public/fonts/`**

Use the exact filenames found in Step 2. Example (adjust names to match):

```bash
mkdir -p "/Users/jeffgiles/App Projects/BAInsurance/public/fonts"
cp node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2 public/fonts/fraunces-variable.woff2
cp node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2 public/fonts/inter-variable.woff2
```

Verify: `ls -la public/fonts/` shows both files at non-zero size.

- [ ] **Step 4: Rewrite `src/styles/global.css` with @font-face, tokens, and base type**

Replace the entire contents of `src/styles/global.css` with:

```css
@import "tailwindcss";

/* Self-hosted variable fonts (replaces Google Fonts) */
@font-face {
  font-family: 'Fraunces';
  font-style: normal;
  font-weight: 300 700;
  font-display: swap;
  src: url('/fonts/fraunces-variable.woff2') format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400 800;
  font-display: swap;
  src: url('/fonts/inter-variable.woff2') format('woff2');
}

@theme {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-serif: 'Fraunces', Georgia, 'Times New Roman', serif;

  --color-navy: #013A52;
  --color-brand: #016490;
  --color-brand-dark: #014d6e;
  --color-brand-light: #7EBEE7;
  --color-ink: #15212B;
  --color-bg: #F5F7F9;
  --color-line: #E5EBF0;
  --color-mist: #f4f8fb;
  --color-gray: #879096;
}

html {
  scroll-behavior: smooth;
}

body {
  color: var(--color-ink);
  font-family: var(--font-sans);
}

/* Headlines carry the serif character */
h1, h2, h3 {
  font-family: var(--font-serif);
  font-optical-sizing: auto;
}
```

- [ ] **Step 5: Wire fonts into `src/layouts/Layout.astro`**

Remove the three Google Fonts lines (currently `src/layouts/Layout.astro:76-78`):

```html
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
```

Replace them with preload links for the two self-hosted faces:

```html
    <link rel="preload" href="/fonts/inter-variable.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/fraunces-variable.woff2" as="font" type="font/woff2" crossorigin />
```

Then change the body tag (currently `src/layouts/Layout.astro:86`) from:

```html
  <body class="antialiased" style="font-family: 'Inter', system-ui, sans-serif;">
```

to:

```html
  <body class="antialiased">
```

(Body font now comes from `global.css`.)

- [ ] **Step 6: Build and verify**

Run: `npm run build`
Expected: build completes, "117 page(s) built", no errors.

Then visually verify on the dev server (`npm run dev`): homepage headings render in a serif (Fraunces), body text in Inter, no network request to `fonts.googleapis.com` (check browser Network tab), and no flash of invisible text beyond a brief swap.

- [ ] **Step 7: Commit**

```bash
cd "/Users/jeffgiles/App Projects/BAInsurance"
git add package.json package-lock.json public/fonts/ src/styles/global.css src/layouts/Layout.astro
git commit -m "$(cat <<'EOF'
Self-host fonts and add refined design tokens

Add Fraunces (serif headlines) + Inter (body), self-hosted as variable
woff2 and preloaded; remove the Google Fonts link. Introduce refined-blue
color tokens and base serif headline styling.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Subtle motion system (progressive enhancement)

**Files:**
- Modify: `src/styles/global.css` (append motion CSS)
- Modify: `src/layouts/Layout.astro` (add inline reveal script before `</body>`)

**Interfaces:**
- Produces: a `.reveal` utility class (consumed by Tasks 4 and 5). Elements with `class="reveal"` are fully visible by default; when the document has `js-motion` on `<html>` they start hidden and animate to visible on scroll via an `is-visible` class.

- [ ] **Step 1: Append motion CSS to `src/styles/global.css`**

Add at the end of the file:

```css
/* Scroll-reveal motion — progressive enhancement.
   Visible by default; hidden only when JS enables motion. */
.reveal {
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
html.js-motion .reveal {
  opacity: 0;
  transform: translateY(16px);
}
html.js-motion .reveal.is-visible {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  html.js-motion .reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

- [ ] **Step 2: Add the inline reveal script to `src/layouts/Layout.astro`**

Immediately before the closing `</body>` tag (after `<Footer />`), add:

```html
    <script is:inline>
      (function () {
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (reduce.matches) return;
        document.documentElement.classList.add('js-motion');
        var els = document.querySelectorAll('.reveal');
        if (!('IntersectionObserver' in window) || !els.length) {
          els.forEach(function (el) { el.classList.add('is-visible'); });
          return;
        }
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
        els.forEach(function (el) { io.observe(el); });
      })();
    </script>
```

- [ ] **Step 3: Smoke-test the mechanism**

Temporarily add `class="reveal"` to one section on the homepage, run `npm run dev`, and confirm: the section fades/rises in on scroll; with JS disabled the section is fully visible; with OS "reduce motion" on it appears without animation. Remove the temporary class (Task 5 applies `reveal` properly).

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 5: Commit**

```bash
cd "/Users/jeffgiles/App Projects/BAInsurance"
git add src/styles/global.css src/layouts/Layout.astro
git commit -m "$(cat <<'EOF'
Add subtle scroll-reveal motion system

CSS-only reveal driven by a tiny inline IntersectionObserver. Content is
visible by default; motion is added only when JS runs and reduced-motion
is not requested.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Refine the Header

**Files:**
- Modify: `src/components/Header.astro`

**Interfaces:**
- Consumes: color tokens and serif type from Task 1.
- Produces: no new interface; visual refinement only. Nav structure, links, mobile toggle behavior, and the `#menu-btn`/`#mobile-menu` script remain functionally unchanged.

- [ ] **Step 1: Refine the desktop nav active/hover states and CTA**

In `src/components/Header.astro`, keep the structure but update classes to use tokens and a more refined treatment. Change the active/inactive nav link classes (currently lines 27-31) so the active state uses the brand color on the light background and hover is subtler:

```astro
            class={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              current.startsWith(href)
                ? 'text-[var(--color-brand)] bg-[var(--color-bg)]'
                : 'text-slate-700 hover:text-[var(--color-brand)] hover:bg-[var(--color-bg)]'
            }`}
```

Update the "Get a Quote" desktop CTA (currently line 36) to a slightly more refined button:

```astro
        <a href="/contact-us/#quote" class="ml-3 px-5 py-2.5 bg-[var(--color-brand)] hover:bg-[var(--color-navy)] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors">
          Get a Quote
        </a>
```

- [ ] **Step 2: Add a scroll-aware border/shadow to the sticky header**

Change the `<header>` opening tag (line 14) to use a refined border token and a transition:

```astro
<header id="site-header" class="bg-white sticky top-0 z-50 border-b border-[var(--color-line)] transition-shadow">
```

Add this small inline script at the end of the file (after the existing mobile-menu `<script>`), to deepen the shadow once the page is scrolled:

```html
<script is:inline>
  (function () {
    var header = document.getElementById('site-header');
    if (!header) return;
    var onScroll = function () {
      if (window.scrollY > 8) header.classList.add('shadow-md');
      else header.classList.remove('shadow-md');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();
</script>
```

- [ ] **Step 3: Align mobile menu link colors to tokens**

Update the mobile nav link class (currently line 57) and mobile CTA (line 61) to match:

```astro
        <a href={href} class="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-[var(--color-brand)] hover:bg-[var(--color-bg)] rounded">
          {label}
        </a>
```

```astro
      <a href="/contact-us/#quote" class="block mt-2 px-5 py-3 bg-[var(--color-brand)] text-white text-sm font-semibold text-center rounded-lg">
        Get a Quote
      </a>
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: build completes, no errors.

Visually verify: header looks refined; nav active state highlights the current page; shadow appears after scrolling; mobile menu still opens/closes.

- [ ] **Step 5: Commit**

```bash
cd "/Users/jeffgiles/App Projects/BAInsurance"
git add src/components/Header.astro
git commit -m "$(cat <<'EOF'
Refine header styling and add scroll shadow

Align nav and CTA to the refined-blue tokens, add a scroll-aware shadow on
the sticky header. Nav structure and mobile toggle behavior unchanged.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Refine the Footer

**Files:**
- Modify: `src/components/Footer.astro`

**Interfaces:**
- Consumes: color tokens and serif type from Task 1.
- Produces: no new interface; visual refinement only. All links, contact info, and the legal/Medicare disclaimer remain unchanged.

- [ ] **Step 1: Anchor the footer in navy and refine section headings**

In `src/components/Footer.astro`, change the `<footer>` background (line 5) from brand to the deeper navy for a more grounded base:

```astro
<footer class="bg-[var(--color-navy)] text-white">
```

The three section heading `<h3>` elements (lines 22, 35, 48) currently use `text-[#7ebee7]`. They will now render in Fraunces automatically (from Task 1 base styles); keep the accent color and refine to:

```astro
        <h3 class="font-serif text-sm font-semibold uppercase tracking-wider text-[var(--color-brand-light)] mb-4">
```

Apply the same change to all three headings ("Our Services", "Company", "Contact").

- [ ] **Step 2: Refine the brand blurb and accent colors to tokens**

Update the brand-column paragraph (line 12) and the "Trusted Choice" line to use tokens consistently:

```astro
        <p class="text-[var(--color-brand-light)] text-sm leading-relaxed">
          Independent insurance agency serving Utah families and businesses since the early 1980s.
        </p>
```

Ensure the small SVG icons in the Contact column keep `text-[var(--color-brand-light)]` (replace the hard-coded `text-[#7ebee7]` on lines 51, 55, 59, 63).

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: build completes, no errors.

Visually verify: footer now sits on navy, headings are serif + accent blue, all links present and legible, disclaimer intact.

- [ ] **Step 4: Commit**

```bash
cd "/Users/jeffgiles/App Projects/BAInsurance"
git add src/components/Footer.astro
git commit -m "$(cat <<'EOF'
Refine footer to navy base and serif headings

Anchor the footer in the deeper navy, align accents to tokens, and apply
serif section headings. Links and disclaimer unchanged.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Redesign the homepage

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: color tokens + serif type (Task 1), `.reveal` utility (Task 2).
- Produces: the reviewable homepage proof. Content and section order unchanged.

- [ ] **Step 1: Refine the hero photo frame to a navy offset**

In `src/pages/index.astro`, replace the decorative frame div (currently line 41) so the offset frame uses navy instead of light blue:

```astro
            <div class="absolute inset-0 translate-x-5 translate-y-5 rounded-2xl bg-[var(--color-navy)] border border-white/10"></div>
```

Leave the hero `<img>` (lines 42-49) unchanged — it keeps `fetchpriority="high"` and explicit `width`/`height`.

- [ ] **Step 2: Replace the "Why Choose Us" emoji with inline SVG line icons**

In the "Why Choose Us" section, the data array (currently lines 138-142) uses emoji in an `icon` field. Replace the array so each item carries an SVG path `d` string instead, and render an inline `<svg>` instead of the emoji `<div>`.

Change the array to:

```astro
          {[
            { title: 'We Shop for You', d: 'M21 21l-5.2-5.2m1.7-4.3a6 6 0 11-12 0 6 6 0 0112 0z', desc: 'Access to dozens of top carriers means we compare so you get the right coverage at the best rate.' },
            { title: 'No Carrier Bias', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'As an independent agency, we work for you — not the insurance company. Your interests come first.' },
            { title: 'Fast, Personal Claims Support', d: 'M13 10V3L4 14h7v7l9-11h-7z', desc: 'When something goes wrong, we\'re on your side helping navigate the claims process quickly.' },
            { title: 'Local Utah Expertise', d: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z', desc: 'We understand Utah\'s unique risks, regulations, and communities because we\'ve been here for decades.' },
          ].map(({ title, d, desc }) => (
            <div class="reveal flex gap-4 bg-white rounded-xl p-5 shadow-sm border border-[var(--color-line)] transition-shadow hover:shadow-md">
              <div class="w-11 h-11 shrink-0 rounded-lg bg-[var(--color-bg)] flex items-center justify-center">
                <svg class="w-6 h-6 text-[var(--color-brand)]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d={d} /></svg>
              </div>
              <div>
                <h3 class="font-semibold text-[var(--color-ink)] mb-1">{title}</h3>
                <p class="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
```

- [ ] **Step 3: Add scroll reveals and token alignment to remaining sections**

Apply `reveal` to the major section inner wrappers so they animate in, and align section backgrounds to `--color-bg`. Specifically:

- Services grid section (line 70): change `bg-white` heading block `<div class="text-center mb-14">` to `<div class="text-center mb-14 reveal">`, and add `reveal` to each of the three service `<a>` cards (lines 79, 88, 97).
- "Why Choose Us" section (line 111): change `bg-[#f4f8fb]` to `bg-[var(--color-bg)]`; add `reveal` to the left text `<div>` (line 114).
- About callout section (line 158): add `reveal` to the inner `<div class="relative rounded-3xl overflow-hidden text-white">` (line 160).
- FAQ section (line 186): change `bg-[#f4f8fb]` to `bg-[var(--color-bg)]`; add `reveal` to the heading block `<div class="text-center mb-12">` (line 188).
- CTA section (line 213): add `reveal` to `<div class="max-w-3xl ... text-center">` (line 214).

Also update the service cards' hover border (lines 79, 88, 97) from `hover:border-[#7ebee7]` to `hover:border-[var(--color-brand-light)]` and base border `border-slate-100` to `border-[var(--color-line)]`, and lift them on hover by adding `hover:-translate-y-1` to the existing `transition-all` classes.

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: build completes, "117 page(s) built", no errors.

Visually verify on `npm run dev`: hero has a navy offset frame and serif headline; "Why Choose Us" shows clean line icons (no emoji); sections fade/rise on scroll; cards lift on hover; with JS disabled all content is visible; reduced-motion shows everything statically. Confirm no console errors and no layout shift.

- [ ] **Step 5: Commit**

```bash
cd "/Users/jeffgiles/App Projects/BAInsurance"
git add src/pages/index.astro
git commit -m "$(cat <<'EOF'
Redesign homepage with refined type, icons, and motion

Serif hero with navy offset frame, replace Why-Choose-Us emoji with inline
SVG line icons, align sections to refined-blue tokens, and add subtle
scroll reveals and card hover lifts. Content and section order unchanged.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 1 completion check

Before declaring Phase 1 done and handing back for review:

- [ ] `npm run build` is green and still reports 117 pages.
- [ ] Homepage, Header, and Footer reflect the new type, palette, and motion.
- [ ] No request to `fonts.googleapis.com` remains; both fonts load from `/fonts/`.
- [ ] All content visible with JavaScript disabled.
- [ ] `prefers-reduced-motion` shows content without animation.
- [ ] Meta tags, canonical, sitemap, and JSON-LD in `Layout.astro` are unchanged.
- [ ] No console errors; no visible layout shift on load.

## Self-review notes (author)

- **Spec coverage:** tokens (Task 1), self-hosted/preloaded fonts + Google link removal (Task 1), motion w/ reduced-motion + no-JS (Task 2), Header (Task 3), Footer (Task 4), homepage incl. emoji→SVG (Task 5), performance/SEO guardrails (Global Constraints + completion check). All spec sections mapped.
- **Verification model:** static frontend — no unit tests exist or are warranted; verification is build success + visual/no-JS/reduced-motion checks, per the spec's verification section.
- **Type consistency:** `.reveal` / `js-motion` / `is-visible` class names are used identically in Task 2 (definition) and Task 5 (consumption). Token names match Task 1 definitions throughout.
