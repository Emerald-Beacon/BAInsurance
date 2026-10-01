# Multi-Line Quote & Lead Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's single generic contact form with a line-specific quote journey — a `/quote/` hub plus eight landing pages — that delivers structured, triage-ready leads to the sales team by email.

**Architecture:** One data module (`src/data/quote-lines.ts`) defines fourteen coverage lines and their intake questions; everything else generates from it. A single Netlify form renders every line's fields into static HTML (non-selected lines `hidden` + `disabled`), and a dependency-free vanilla controller turns that plain form into a stepped wizard when JavaScript runs. Pure logic lives in `src/lib/` and is unit-tested; Astro components are verified by asserting against built HTML in `dist/`.

**Tech Stack:** Astro 6.1.7, Tailwind 4.2.2, TypeScript (`astro/tsconfigs/strict`), Vitest (new), Netlify Forms. Node 25.1.0 / npm 11.6.2. No JavaScript framework, no serverless functions.

**Spec:** `docs/superpowers/specs/2026-09-30-quote-lead-capture-design.md`

## Global Constraints

- **No JavaScript framework.** No React, Preact, Svelte, or Vue may be added. The controller is vanilla TypeScript bundled by Astro.
- **No serverless functions.** The site remains a static build; `netlify.toml` gains no `[functions]` config.
- **`npm install` on this machine requires a cache override:** `npm install --cache /tmp/npm-cache-bai`. Plain `npm install` fails on a root-owned cache directory.
- **Every line field name is prefixed with its line id** (`boat-type`, not `type`). Enforced by test in Task 1.
- **Only step 2 fields are `required`.** Every line-specific detail field is optional. `tcpa-consent` is never `required`.
- **Non-selected line fieldsets are rendered `hidden` AND `disabled`.** Disabled controls register with Netlify at deploy but are not submitted.
- **Brand colors are `#016490` (brand), `#014d6e` (brand-dark), `#7ebee7` (brand-light), `#f4f8fb` (mist).** Tailwind theme tokens already exist in `src/styles/global.css`.
- **The CMS TPMO disclaimer ships with literal `[N]` and `[M]` placeholders.** Do not invent values. Task 12 adds the launch gate that blocks release while they remain.
- **The SOA-intent capture must never be described in UI copy as a Scope of Appointment.** Spec §8.3.

## Review Focus

Five failure modes the spec implies but that no task's primary deliverable would naturally exercise. Each has a test assigned to the task that owns the code.

1. **Switching coverage line after filling detail fields** leaves the previous line's fieldset enabled, so an auto lead arrives carrying boat answers. → test in Task 7.
2. **Free text containing quotes, newlines, or `&`** (`notes`, business names) corrupts the composed lead sheet or the URL-encoded beacon body. → tests in Task 5 and Task 8.
3. **A landing page submitted with JavaScript disabled** must still carry `coverage-line`; if that value is only set by the controller, the lead arrives with no coverage line at all. → test in Task 10.
4. **`checkbox-group` fields submit multiple values under one name** (`commercial-coverages`, `group-interest`, `medicare-soa-products`); the summary composer must join them rather than render `[object Object]` or only the last value. → test in Task 5.
5. **`crypto.randomUUID` is unavailable** in insecure contexts and older Safari; an unguarded call throws during controller init and takes the entire wizard down, including the plain-form fallback. → test in Task 3.

## Spec Deltas

Two deliberate departures from the approved spec. Both are narrower than the spec text, neither changes behavior the user approved.

1. **Spec §8.2** describes a data-integrity test that "fails while the placeholder tokens are present." Implemented instead as a separate `npm run check:launch` script (Task 12). A permanently-red `npm test` would make TDD unusable for every subsequent task. The gate's function — you cannot ship Medicare without the numbers — is preserved.
2. **Spec §9.2's** example lead sheet header shows a city (`Bountiful 84010`). No city field is collected and adding one costs friction for no agent benefit. The header renders `LINE — Name — ZIP`.

## File Structure

**Created:**

| Path | Responsibility |
|---|---|
| `vitest.config.ts` | Test runner config |
| `src/data/quote-lines.ts` | The 14 line definitions — types, fields, SEO copy, FAQs |
| `src/lib/lead-context.ts` | Lead id generation, UTM/referrer parsing |
| `src/lib/quote-validation.ts` | Phone normalisation, ZIP rules, step-2 validation |
| `src/lib/lead-summary.ts` | Form values → readable lead sheet text |
| `src/components/quote/Field.astro` | Renders one `Field` by type |
| `src/components/quote/QuoteWizard.astro` | Form shell, all steps, all fieldsets |
| `src/scripts/quote-wizard.ts` | Controller: navigation, enable/disable, summary, analytics |
| `src/scripts/quote-partial.ts` | Abandonment beacon |
| `src/pages/quote/index.astro` | Hub |
| `src/pages/quote/[line].astro` | The 8 landing pages |
| `scripts/check-launch.mjs` | Launch gate: TPMO placeholders must be resolved |
| `tests/*.test.ts` | Unit tests per lib module, plus build-output assertions |

**Modified:** `package.json`, `src/pages/thank-you.astro`, `src/pages/contact-us.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/pages/index.astro`, `src/pages/personal.astro`, `src/pages/business.astro`, `src/pages/health.astro`, `src/pages/our-team.astro`, `src/pages/[slug].astro`, `public/llms.txt`.

**Testing approach.** `src/lib/*` is pure and unit-tested with Vitest directly. Astro components have no component-test harness in this repo and none is added; they are verified by `npm run build` followed by assertions against the generated HTML in `dist/` (`tests/build-output.test.ts`). The Netlify round-trip cannot be tested locally at all and is covered by the deploy-preview checklist in spec §12.

---

### Task 1: Vitest harness and the line data model

**Files:**
- Create: `vitest.config.ts`, `src/data/quote-lines.ts`, `tests/quote-lines.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing.
- Produces: `Field`, `FieldType`, `LineSeo`, `Faq`, `Line` types; `LINES: Line[]`; `LANDING_LINES: Line[]`; `lineById(id: string): Line | undefined`; `CATEGORY_LABELS: Record<Line['category'], string>`.

- [ ] **Step 1: Install Vitest**

```bash
npm install --save-dev --cache /tmp/npm-cache-bai vitest
```

- [ ] **Step 2: Add the test script and Vitest config**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 3: Write the failing integrity test**

Create `tests/quote-lines.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { LINES, LANDING_LINES, lineById } from '../src/data/quote-lines';

describe('quote-lines data integrity', () => {
  it('defines fourteen lines', () => {
    expect(LINES).toHaveLength(14);
  });

  it('gives every line a unique id', () => {
    const ids = LINES.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('prefixes every field name with its line id', () => {
    for (const line of LINES) {
      for (const field of line.fields) {
        expect(field.name.startsWith(`${line.id}-`)).toBe(true);
      }
    }
  });

  it('keeps every field name globally unique', () => {
    const names = LINES.flatMap((l) => l.fields.map((f) => f.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it('gives select, radio and checkbox-group fields options', () => {
    const needsOptions = ['select', 'radio', 'checkbox-group'];
    for (const line of LINES) {
      for (const field of line.fields) {
        if (needsOptions.includes(field.type)) {
          expect(field.options, `${field.name} needs options`).toBeTruthy();
          expect(field.options!.length).toBeGreaterThan(1);
        }
      }
    }
  });

  it('exposes exactly eight landing lines, each with a slug', () => {
    expect(LANDING_LINES).toHaveLength(8);
    for (const line of LANDING_LINES) {
      expect(line.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('looks a line up by id', () => {
    expect(lineById('boat')?.label).toBe('Boat & Watercraft');
    expect(lineById('nope')).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run the test and confirm it fails**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "../src/data/quote-lines"`.

- [ ] **Step 5: Create the data module**

Create `src/data/quote-lines.ts`. Types first:

```ts
export type FieldType =
  | 'text' | 'tel' | 'email' | 'number' | 'date'
  | 'select' | 'radio' | 'checkbox-group' | 'textarea';

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  help?: string;
}

export interface LineSeo {
  title: string;
  description: string;
  h1: string;
  intro: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Line {
  id: string;
  label: string;
  category: 'personal' | 'business' | 'health';
  landingPage: boolean;
  slug?: string;
  seo?: LineSeo;
  fields: Field[];
  faqs?: Faq[];
}

export const CATEGORY_LABELS: Record<Line['category'], string> = {
  personal: 'Personal',
  business: 'Business',
  health: 'Health & Medicare',
};
```

Then `export const LINES: Line[] = [...]` containing all fourteen. Landing lines get `landingPage: true` and a `slug`; `seo` and `faqs` are added in Task 2. Field inventory is spec §7.4 verbatim. The eight landing lines, in this order:

```ts
{
  id: 'auto', label: 'Auto', category: 'personal',
  landingPage: true, slug: 'auto',
  fields: [
    { name: 'auto-vehicle-count', label: 'How many vehicles?', type: 'select', options: ['1', '2', '3 or more'] },
    { name: 'auto-vehicle-1', label: 'Vehicle 1 — year, make, model', type: 'text', placeholder: '2021 Toyota RAV4' },
    { name: 'auto-additional-vehicles', label: 'Additional vehicles', type: 'textarea', placeholder: 'One per line' },
    { name: 'auto-driver-count', label: 'How many drivers?', type: 'select', options: ['1', '2', '3', '4 or more'] },
    { name: 'auto-incidents-3yr', label: 'Accidents or violations in the last 3 years?', type: 'radio', options: ['None', '1', '2 or more', 'Not sure'] },
    { name: 'auto-sr22-needed', label: 'Do you need an SR-22?', type: 'radio', options: ['Yes', 'No', 'Not sure'] },
    { name: 'auto-current-carrier', label: 'Current carrier', type: 'text', placeholder: 'e.g. Progressive' },
    { name: 'auto-current-premium', label: 'Current premium', type: 'text', placeholder: 'e.g. $142/mo' },
    { name: 'auto-renewal-date', label: 'Policy renews on', type: 'date' },
  ],
},
```

Follow the identical shape for `home`, `boat`, `rv`, `atv`, `commercial`, `medicare`, and `small-group-health`, taking every field name, label, and option list from spec §7.4. Slugs: `auto`, `home`, `boat`, `rv`, `atv`, `commercial`, `medicare`, `small-group-health`.

**One exception.** Spec §7.4 lists `medicare-soa-timestamp` among the Medicare fields. It is **not** a `Field` and must not appear in `fields` — it is written by the controller, and rendering it would put a raw timestamp input in front of the visitor. It is declared as a hidden context field in Task 6 and populated in Task 7.

Then the six hub-only lines, with `landingPage: false`, no `slug`, and `fields: []`:

```ts
{ id: 'umbrella', label: 'Umbrella', category: 'personal', landingPage: false, fields: [] },
{ id: 'motorcycle', label: 'Motorcycle', category: 'personal', landingPage: false, fields: [] },
{ id: 'renters', label: 'Renters or Condo', category: 'personal', landingPage: false, fields: [] },
{ id: 'life', label: 'Life Insurance', category: 'personal', landingPage: false, fields: [] },
{ id: 'individual-health', label: 'Individual Health Plan', category: 'health', landingPage: false, fields: [] },
{ id: 'workers-comp', label: "Workers' Compensation", category: 'business', landingPage: false, fields: [] },
```

Finally the derived exports:

```ts
export const LANDING_LINES: Line[] = LINES.filter((l) => l.landingPage);

export function lineById(id: string): Line | undefined {
  return LINES.find((l) => l.id === id);
}
```

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `npm test`
Expected: PASS — 7 tests.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/data/quote-lines.ts tests/quote-lines.test.ts
git commit -m "feat: add quote line data model and Vitest harness"
```

---

### Task 2: Landing-page SEO copy

**Files:**
- Modify: `src/data/quote-lines.ts`, `tests/quote-lines.test.ts`

**Interfaces:**
- Consumes: `Line`, `LineSeo`, `Faq`, `LANDING_LINES` from Task 1.
- Produces: populated `seo` and `faqs` on all eight landing lines.

- [ ] **Step 1: Write the failing completeness test**

Append to `tests/quote-lines.test.ts`:

```ts
describe('landing page copy', () => {
  it('gives every landing line complete SEO copy', () => {
    for (const line of LANDING_LINES) {
      expect(line.seo, `${line.id} needs seo`).toBeTruthy();
      expect(line.seo!.title.length).toBeGreaterThan(20);
      expect(line.seo!.description.length).toBeGreaterThan(70);
      expect(line.seo!.description.length).toBeLessThan(161);
      expect(line.seo!.h1.length).toBeGreaterThan(10);
      expect(line.seo!.intro.length).toBeGreaterThan(200);
    }
  });

  it('gives every landing line at least two FAQs', () => {
    for (const line of LANDING_LINES) {
      expect(line.faqs?.length ?? 0).toBeGreaterThanOrEqual(2);
    }
  });

  it('writes distinct intro copy for every landing line', () => {
    const intros = LANDING_LINES.map((l) => l.seo!.intro);
    expect(new Set(intros).size).toBe(intros.length);
    for (const intro of intros) {
      const others = intros.filter((i) => i !== intro);
      for (const other of others) {
        const shared = intro.slice(0, 120);
        expect(other.includes(shared)).toBe(false);
      }
    }
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test`
Expected: FAIL — `auto needs seo`.

- [ ] **Step 3: Write the copy**

Add `seo` and `faqs` to each of the eight landing lines. Copy must be genuinely distinct per spec §14 — templated near-duplicates produce doorway pages. Anchor each to Utah specifics drawn from `rankless/03-gaps.md` and `rankless/04-strategy.md`. Example for `boat`:

```ts
seo: {
  title: 'Utah Boat & Watercraft Insurance Quote',
  description: 'Get a boat, jet ski, or pontoon insurance quote from an independent Bountiful, Utah agency. We compare carriers for Bear Lake, Lake Powell, and Utah Lake boaters.',
  h1: 'Boat & Watercraft Insurance Quote',
  intro: 'Utah does not require liability insurance to register a boat, which is exactly why so many owners discover their coverage gap after an accident. Homeowners policies typically cap watercraft coverage at a low limit and often exclude anything above a modest horsepower threshold — which rules out most ski boats on Utah water. Tell us what you run and where you run it, and we will compare carriers who actually write Bear Lake, Lake Powell, and Jordanelle risks.',
},
faqs: [
  { q: 'Is boat insurance required in Utah?', a: 'Utah does not mandate liability insurance for recreational watercraft registration. Marinas, slip contracts, and lenders frequently do require it, and Lake Powell concessionaires have their own requirements. Being uninsured on the water leaves you personally exposed for injury and property damage claims.' },
  { q: 'Does my homeowners policy already cover my boat?', a: 'Usually only partially. Most homeowners forms include a small watercraft limit with horsepower and length restrictions, so a jet ski or a ski boat is commonly excluded or severely underinsured. We will read your current form and tell you exactly where it stops.' },
],
```

Write the equivalent, non-templated, for `auto` (lead with SR-22 and Utah's low minimum limits), `home` (earthquake and the Wasatch Fault; flood and Bountiful's CRS discount), `rv` (full-time occupancy changes the form required), `atv` (Utah OHV registration and street-legal conversion), `commercial` (Davis County, certificate-of-insurance demands, hard-to-place risks), `medicare` (Utah enrollment windows; the TPMO disclaimer renders separately in Task 10), and `small-group-health` (Utah small-group renewal timing).

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test`
Expected: PASS — 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/data/quote-lines.ts tests/quote-lines.test.ts
git commit -m "feat: add landing page SEO copy and FAQs for the eight quote lines"
```

---

### Task 3: Lead context — id generation and UTM parsing

Covers **Review Focus #5**: `crypto.randomUUID` is absent in insecure contexts and older Safari. An unguarded call throws during controller init and kills the plain-form fallback along with the wizard.

**Files:**
- Create: `src/lib/lead-context.ts`, `tests/lead-context.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `makeLeadId(): string`; `parseUtm(search: string): Record<string, string>`; `UTM_KEYS: readonly string[]`; `interface LeadContext { leadId: string; sourcePath: string; referrer: string; utm: Record<string, string> }`.

- [ ] **Step 1: Write the failing tests**

Create `tests/lead-context.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeLeadId, parseUtm, UTM_KEYS } from '../src/lib/lead-context';

afterEach(() => vi.unstubAllGlobals());

describe('makeLeadId', () => {
  it('returns an 8-character id', () => {
    expect(makeLeadId()).toHaveLength(8);
  });

  it('returns distinct ids across calls', () => {
    const ids = new Set(Array.from({ length: 200 }, makeLeadId));
    expect(ids.size).toBeGreaterThan(190);
  });

  it('falls back when crypto.randomUUID is missing', () => {
    vi.stubGlobal('crypto', {});
    expect(() => makeLeadId()).not.toThrow();
    expect(makeLeadId()).toHaveLength(8);
  });

  it('falls back when crypto itself is undefined', () => {
    vi.stubGlobal('crypto', undefined);
    expect(() => makeLeadId()).not.toThrow();
    expect(makeLeadId()).toHaveLength(8);
  });

  it('falls back when randomUUID throws', () => {
    vi.stubGlobal('crypto', { randomUUID: () => { throw new Error('insecure context'); } });
    expect(() => makeLeadId()).not.toThrow();
    expect(makeLeadId()).toHaveLength(8);
  });
});

describe('parseUtm', () => {
  it('extracts all five utm keys', () => {
    const utm = parseUtm('?utm_source=google&utm_medium=cpc&utm_campaign=boat&utm_term=utah+boat&utm_content=v2');
    expect(utm).toEqual({
      utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'boat',
      utm_term: 'utah boat', utm_content: 'v2',
    });
  });

  it('omits keys that are absent', () => {
    expect(parseUtm('?utm_source=google')).toEqual({ utm_source: 'google' });
  });

  it('omits keys that are present but empty', () => {
    expect(parseUtm('?utm_source=&utm_medium=cpc')).toEqual({ utm_medium: 'cpc' });
  });

  it('returns an empty object for an empty query string', () => {
    expect(parseUtm('')).toEqual({});
    expect(parseUtm('?')).toEqual({});
  });

  it('ignores non-utm parameters', () => {
    expect(parseUtm('?line=boat&gclid=abc')).toEqual({});
  });

  it('truncates absurdly long values to 200 characters', () => {
    const utm = parseUtm(`?utm_campaign=${'x'.repeat(500)}`);
    expect(utm.utm_campaign).toHaveLength(200);
  });

  it('survives a malformed query string', () => {
    expect(() => parseUtm('?%%%&&&==')).not.toThrow();
  });

  it('exposes the five keys it reads', () => {
    expect(UTM_KEYS).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test -- lead-context`
Expected: FAIL — `Failed to resolve import "../src/lib/lead-context"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/lead-context.ts`:

```ts
export const UTM_KEYS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
] as const;

export interface LeadContext {
  leadId: string;
  sourcePath: string;
  referrer: string;
  utm: Record<string, string>;
}

/**
 * Short, human-quotable id shared between a partial lead and its later
 * completion. crypto.randomUUID is unavailable over plain http and in older
 * Safari, and throwing here would take down the whole controller — including
 * the no-JS fallback — so every failure path lands on Math.random.
 */
export function makeLeadId(): string {
  try {
    const c = globalThis.crypto;
    if (c && typeof c.randomUUID === 'function') {
      return c.randomUUID().replace(/-/g, '').slice(0, 8);
    }
  } catch {
    // fall through
  }
  return Math.random().toString(36).slice(2, 10).padEnd(8, '0');
}

export function parseUtm(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const params = new URLSearchParams(search);
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) out[key] = value.slice(0, 200);
    }
  } catch {
    // a malformed query string yields no attribution, never an exception
  }
  return out;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- lead-context`
Expected: PASS — 14 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lead-context.ts tests/lead-context.test.ts
git commit -m "feat: add lead id generation and UTM parsing"
```

---

### Task 4: Contact-step validation

**Files:**
- Create: `src/lib/quote-validation.ts`, `tests/quote-validation.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `normalizePhone(raw: string): string`; `isValidZip(zip: string): boolean`; `isUtahZip(zip: string): boolean`; `validateContactStep(values: Record<string, string>): FieldError[]`; `interface FieldError { name: string; message: string }`.

- [ ] **Step 1: Write the failing tests**

Create `tests/quote-validation.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  normalizePhone, isValidZip, isUtahZip, validateContactStep,
} from '../src/lib/quote-validation';

describe('normalizePhone', () => {
  it('formats ten digits', () => {
    expect(normalizePhone('8015550100')).toBe('(801) 555-0100');
  });

  it('strips punctuation before formatting', () => {
    expect(normalizePhone('801.555.0100')).toBe('(801) 555-0100');
    expect(normalizePhone('801-555-0100')).toBe('(801) 555-0100');
    expect(normalizePhone(' (801) 555 0100 ')).toBe('(801) 555-0100');
  });

  it('drops a leading US country code', () => {
    expect(normalizePhone('+1 801 555 0100')).toBe('(801) 555-0100');
    expect(normalizePhone('18015550100')).toBe('(801) 555-0100');
  });

  it('returns the trimmed original when it cannot format', () => {
    expect(normalizePhone('  555-0100 ')).toBe('555-0100');
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone('not a phone')).toBe('not a phone');
  });
});

describe('isValidZip', () => {
  it('accepts exactly five digits', () => {
    expect(isValidZip('84010')).toBe(true);
    expect(isValidZip(' 84010 ')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isValidZip('8401')).toBe(false);
    expect(isValidZip('840101')).toBe(false);
    expect(isValidZip('84010-1234')).toBe(false);
    expect(isValidZip('abcde')).toBe(false);
    expect(isValidZip('')).toBe(false);
  });
});

describe('isUtahZip', () => {
  it('accepts Utah ZIP codes', () => {
    expect(isUtahZip('84010')).toBe(true); // Bountiful
    expect(isUtahZip('84001')).toBe(true); // range floor
    expect(isUtahZip('84791')).toBe(true); // range ceiling
  });

  it('rejects out-of-state ZIP codes', () => {
    expect(isUtahZip('83401')).toBe(false); // Idaho Falls
    expect(isUtahZip('90210')).toBe(false);
    expect(isUtahZip('84792')).toBe(false);
  });

  it('rejects malformed input rather than throwing', () => {
    expect(isUtahZip('abcde')).toBe(false);
    expect(isUtahZip('')).toBe(false);
  });
});

describe('validateContactStep', () => {
  const valid = {
    'first-name': 'Jane', 'last-name': 'Smith',
    email: 'jane@example.com', phone: '8015550100', zip: '84010',
  };

  it('passes a complete contact step', () => {
    expect(validateContactStep(valid)).toEqual([]);
  });

  it('reports each missing required field by name', () => {
    const errors = validateContactStep({});
    expect(errors.map((e) => e.name).sort()).toEqual(
      ['email', 'first-name', 'last-name', 'phone', 'zip'],
    );
  });

  it('treats whitespace-only values as missing', () => {
    const errors = validateContactStep({ ...valid, 'first-name': '   ' });
    expect(errors).toHaveLength(1);
    expect(errors[0].name).toBe('first-name');
  });

  it('rejects a malformed email', () => {
    const errors = validateContactStep({ ...valid, email: 'jane@' });
    expect(errors.map((e) => e.name)).toEqual(['email']);
  });

  it('rejects a phone that is not ten digits', () => {
    const errors = validateContactStep({ ...valid, phone: '555-0100' });
    expect(errors.map((e) => e.name)).toEqual(['phone']);
  });

  it('rejects a malformed ZIP', () => {
    const errors = validateContactStep({ ...valid, zip: '840' });
    expect(errors.map((e) => e.name)).toEqual(['zip']);
  });

  it('accepts a valid out-of-state ZIP — it is a soft note, not an error', () => {
    expect(validateContactStep({ ...valid, zip: '83401' })).toEqual([]);
  });

  it('never requires consent', () => {
    expect(validateContactStep({ ...valid, 'tcpa-consent': '' })).toEqual([]);
  });

  it('gives every error a human-readable message', () => {
    for (const error of validateContactStep({})) {
      expect(error.message.length).toBeGreaterThan(5);
    }
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test -- quote-validation`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/quote-validation.ts`:

```ts
export interface FieldError {
  name: string;
  message: string;
}

function digitsOf(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

export function normalizePhone(raw: string): string {
  const ten = digitsOf(raw);
  if (ten.length !== 10) return raw.trim();
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

export function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip.trim());
}

/** Utah ZIP codes run 84001–84791. Used for a soft note, never to reject. */
export function isUtahZip(zip: string): boolean {
  if (!isValidZip(zip)) return false;
  const n = Number(zip.trim());
  return n >= 84001 && n <= 84791;
}

const REQUIRED: { name: string; label: string }[] = [
  { name: 'first-name', label: 'first name' },
  { name: 'last-name', label: 'last name' },
  { name: 'email', label: 'email address' },
  { name: 'phone', label: 'phone number' },
  { name: 'zip', label: 'ZIP code' },
];

export function validateContactStep(values: Record<string, string>): FieldError[] {
  const errors: FieldError[] = [];

  for (const { name, label } of REQUIRED) {
    if (!(values[name] ?? '').trim()) {
      errors.push({ name, message: `Please enter your ${label}.` });
    }
  }

  const named = new Set(errors.map((e) => e.name));

  const email = (values.email ?? '').trim();
  if (email && !named.has('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ name: 'email', message: 'That email address does not look right.' });
  }

  const phone = (values.phone ?? '').trim();
  if (phone && !named.has('phone') && digitsOf(phone).length !== 10) {
    errors.push({ name: 'phone', message: 'Please enter a 10-digit phone number.' });
  }

  const zip = (values.zip ?? '').trim();
  if (zip && !named.has('zip') && !isValidZip(zip)) {
    errors.push({ name: 'zip', message: 'Please enter a 5-digit ZIP code.' });
  }

  return errors;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- quote-validation`
Expected: PASS — 17 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/quote-validation.ts tests/quote-validation.test.ts
git commit -m "feat: add contact step validation and phone normalisation"
```

---

### Task 5: The lead sheet composer

Covers **Review Focus #2** (free text with quotes, newlines, ampersands) and **Review Focus #4** (`checkbox-group` multi-value fields).

**Files:**
- Create: `src/lib/lead-summary.ts`, `tests/lead-summary.test.ts`

**Interfaces:**
- Consumes: `Line` from `src/data/quote-lines`.
- Produces: `composeLeadSummary(input: SummaryInput): string`; `interface SummaryInput { line: Line; values: Record<string, string | string[]>; consent: { given: boolean; timestamp?: string }; context: { sourcePath: string; utm: Record<string, string>; leadId: string } }`.

- [ ] **Step 1: Write the failing tests**

Create `tests/lead-summary.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { composeLeadSummary } from '../src/lib/lead-summary';
import { lineById } from '../src/data/quote-lines';

const boat = lineById('boat')!;
const commercial = lineById('commercial')!;

const base = {
  line: boat,
  values: {
    'first-name': 'Jane', 'last-name': 'Smith',
    email: 'jane@example.com', phone: '(801) 555-0100', zip: '84010',
    'contact-method': 'Text', 'best-time': 'Afternoon',
  } as Record<string, string | string[]>,
  consent: { given: true, timestamp: '2026-09-30 14:22 MDT' },
  context: { sourcePath: '/quote/boat/', utm: {}, leadId: '3f9a2c14' },
};

describe('composeLeadSummary', () => {
  it('leads with coverage, name and ZIP', () => {
    expect(composeLeadSummary(base).split('\n')[0])
      .toBe('BOAT & WATERCRAFT — Jane Smith — 84010');
  });

  it('records consent with its timestamp', () => {
    expect(composeLeadSummary(base)).toContain('☑ Consented to phone/text 2026-09-30 14:22 MDT');
  });

  it('flags a lead with no consent prominently on line two', () => {
    const out = composeLeadSummary({ ...base, consent: { given: false } });
    expect(out.split('\n')[1]).toBe('⚠ EMAIL ONLY — no phone/text consent');
  });

  it('includes contact details and preferences', () => {
    const out = composeLeadSummary(base);
    expect(out).toContain('(801) 555-0100 · jane@example.com · prefers Text, Afternoon');
  });

  it('omits fields that are empty', () => {
    const out = composeLeadSummary({
      ...base,
      values: { ...base.values, 'boat-length': '', 'boat-engine-hp': '   ' },
    });
    expect(out).not.toContain('Length');
    expect(out).not.toContain('Engine');
  });

  it('renders line fields under their labels', () => {
    const out = composeLeadSummary({
      ...base,
      values: { ...base.values, 'boat-type': 'Pontoon', 'boat-length': '23 ft' },
    });
    expect(out).toContain('Pontoon');
    expect(out).toContain('23 ft');
  });

  it('joins checkbox-group values rather than dropping all but one', () => {
    const out = composeLeadSummary({
      ...base,
      line: commercial,
      values: {
        ...base.values,
        'commercial-coverages': ['General liability', 'Cyber liability', 'Surety bond'],
      },
    });
    expect(out).toContain('General liability, Cyber liability, Surety bond');
    expect(out).not.toContain('[object Object]');
  });

  it('renders a single-element array without a trailing separator', () => {
    const out = composeLeadSummary({
      ...base, line: commercial,
      values: { ...base.values, 'commercial-coverages': ['Cyber liability'] },
    });
    expect(out).toContain('Cyber liability');
    expect(out).not.toContain('Cyber liability,');
  });

  it('omits an empty array', () => {
    const out = composeLeadSummary({
      ...base, line: commercial,
      values: { ...base.values, 'commercial-coverages': [] },
    });
    expect(out).not.toContain('Coverages needed');
  });

  it('preserves quotes, ampersands and unicode in free text', () => {
    const out = composeLeadSummary({
      ...base,
      values: { ...base.values, notes: `It's a 23" beam — "Ski & Ski" — naïve guess` },
    });
    expect(out).toContain(`It's a 23" beam — "Ski & Ski" — naïve guess`);
  });

  it('indents multi-line free text so the sheet stays readable', () => {
    const out = composeLeadSummary({
      ...base,
      values: { ...base.values, notes: 'Line one\nLine two\nLine three' },
    });
    expect(out).toContain('Line one');
    expect(out).toContain('Line three');
    expect(out).not.toMatch(/\n{3,}/);
  });

  it('closes with source, attribution and lead id', () => {
    const out = composeLeadSummary({
      ...base,
      context: {
        sourcePath: '/quote/boat/', leadId: '3f9a2c14',
        utm: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'boat-insurance-utah' },
      },
    });
    expect(out).toContain('Source: /quote/boat/ · google / cpc / boat-insurance-utah');
    expect(out).toContain('Lead ID: 3f9a2c14');
  });

  it('omits the attribution segment when there is no UTM data', () => {
    const out = composeLeadSummary(base);
    expect(out).toContain('Source: /quote/boat/');
    expect(out).not.toContain('·  ·');
  });

  it('never emits a trailing blank line', () => {
    expect(composeLeadSummary(base).endsWith('\n')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test -- lead-summary`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/lead-summary.ts`:

```ts
import type { Line } from '../data/quote-lines';

export interface SummaryInput {
  line: Line;
  values: Record<string, string | string[]>;
  consent: { given: boolean; timestamp?: string };
  context: { sourcePath: string; utm: Record<string, string>; leadId: string };
}

/** Arrays come from checkbox groups; a bare join keeps them legible. */
function render(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.filter((v) => v.trim()).join(', ');
  return (value ?? '').trim();
}

export function composeLeadSummary({ line, values, consent, context }: SummaryInput): string {
  const get = (name: string) => render(values[name]);
  const blocks: string[] = [];

  const name = `${get('first-name')} ${get('last-name')}`.trim();
  const header = [`${line.label.toUpperCase()} — ${name} — ${get('zip')}`];
  header.push(
    consent.given
      ? `☑ Consented to phone/text ${consent.timestamp ?? 'timestamp unavailable'}`
      : '⚠ EMAIL ONLY — no phone/text consent',
  );
  blocks.push(header.join('\n'));

  const prefs = [get('contact-method'), get('best-time')].filter(Boolean).join(', ');
  const contact = [get('phone'), get('email')].filter(Boolean).join(' · ');
  blocks.push(prefs ? `${contact} · prefers ${prefs}` : contact);

  const detail = line.fields
    .map((field) => {
      const value = get(field.name);
      return value ? `${field.label}: ${value.replace(/\n+/g, ' / ')}` : '';
    })
    .filter(Boolean);
  if (detail.length) blocks.push(detail.join('\n'));

  const notes = get('notes');
  if (notes) blocks.push(`"${notes.replace(/\n+/g, '\n')}"`);

  const heard = get('heard-about-us');
  if (heard) blocks.push(`Heard about us: ${heard}`);

  const attribution = ['utm_source', 'utm_medium', 'utm_campaign']
    .map((k) => context.utm[k])
    .filter(Boolean)
    .join(' / ');
  blocks.push(
    [
      `Source: ${context.sourcePath}${attribution ? ` · ${attribution}` : ''}`,
      `Lead ID: ${context.leadId}`,
    ].join('\n'),
  );

  return blocks.filter(Boolean).join('\n\n');
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- lead-summary`
Expected: PASS — 14 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lead-summary.ts tests/lead-summary.test.ts
git commit -m "feat: compose readable lead sheet from submitted values"
```

---

### Task 6: Form markup — the no-JavaScript baseline

The deliverable here is a form that works completely with JavaScript disabled. Do not write any controller code in this task.

**Files:**
- Create: `src/components/quote/Field.astro`, `src/components/quote/TpmoDisclaimer.astro`, `src/components/quote/QuoteWizard.astro`

**Interfaces:**
- Consumes: `LINES`, `CATEGORY_LABELS`, `Field`, `Line` from `src/data/quote-lines`.
- Produces: `<QuoteWizard line?={string} />`. When `line` is passed, that line's fieldset is server-rendered enabled and visible and `coverage-line` is emitted as a hidden input; when omitted, a radio group renders and every line fieldset is `hidden disabled`.

- [ ] **Step 1: Create `Field.astro`**

```astro
---
import type { Field } from '../../data/quote-lines';
interface Props { field: Field }
const { field } = Astro.props;
const base = 'w-full px-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#016490] focus:border-transparent text-sm';
---
<div class="quote-field">
  {field.type === 'radio' || field.type === 'checkbox-group' ? (
    <fieldset>
      <legend class="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</legend>
      <div class="flex flex-wrap gap-2">
        {field.options!.map((opt) => (
          <label class="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm cursor-pointer hover:border-[#016490]">
            <input
              type={field.type === 'radio' ? 'radio' : 'checkbox'}
              name={field.name}
              value={opt}
              class="accent-[#016490]"
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </fieldset>
  ) : (
    <>
      <label class="block text-sm font-medium text-slate-700 mb-1.5" for={field.name}>{field.label}</label>
      {field.type === 'select' ? (
        <select id={field.name} name={field.name} class={base}>
          <option value="">Select…</option>
          {field.options!.map((opt) => <option>{opt}</option>)}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea id={field.name} name={field.name} rows="3" placeholder={field.placeholder} class={`${base} resize-none`}></textarea>
      ) : (
        <input type={field.type} id={field.name} name={field.name} placeholder={field.placeholder} class={base} />
      )}
    </>
  )}
  {field.help && <p class="mt-1 text-xs text-slate-400">{field.help}</p>}
</div>
```

- [ ] **Step 2: Create `TpmoDisclaimer.astro`**

`[N]` and `[M]` are deliberate. Do not invent numbers — Task 12 adds the gate that blocks launch while they remain.

```astro
---
---
<div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-slate-700" data-tpmo>
  <p>
    We do not offer every plan available in your area. Currently we represent
    <strong>[N]</strong> organizations which offer <strong>[M]</strong> products in your
    area. Please contact Medicare.gov, 1-800-MEDICARE, or your local State Health
    Insurance Program to get information on all of your options.
  </p>
</div>
```

- [ ] **Step 3: Create `QuoteWizard.astro`**

```astro
---
import { LINES, CATEGORY_LABELS, type Line } from '../../data/quote-lines';
import Field from './Field.astro';
import TpmoDisclaimer from './TpmoDisclaimer.astro';

interface Props { line?: string }
const { line } = Astro.props;
const active: Line | undefined = line ? LINES.find((l) => l.id === line) : undefined;
const categories = ['personal', 'business', 'health'] as const;
const withFields = LINES.filter((l) => l.fields.length > 0);
const CONTEXT_FIELDS = [
  'lead-id', 'consent-timestamp', 'consent-version', 'source-path', 'referrer',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'render-time',
  'medicare-soa-timestamp',
];
const input = 'w-full px-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#016490] focus:border-transparent text-sm';
---
<form
  name="quote"
  id="quote-form"
  method="POST"
  action="/thank-you/"
  data-netlify="true"
  netlify-honeypot="bot-field"
  data-active-line={active?.id ?? ''}
  class="space-y-8"
>
  <input type="hidden" name="form-name" value="quote" />
  <!-- First in document order so it leads the notification email. -->
  <textarea name="lead-summary" id="lead-summary" class="hidden" aria-hidden="true" tabindex="-1"></textarea>
  <p class="hidden"><label>Don't fill this out: <input name="bot-field" /></label></p>
  {CONTEXT_FIELDS.map((name) => <input type="hidden" name={name} id={`ctx-${name}`} />)}

  <div id="quote-errors" role="alert" aria-live="polite" class="hidden rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800"></div>

  {active
    ? <input type="hidden" name="coverage-line" value={active.id} />
    : (
      <section class="quote-step" data-step="1" data-active>
        <h2 class="text-xl font-bold text-slate-900 mb-1">What would you like a quote for?</h2>
        <p class="text-sm text-slate-500 mb-5">Pick the closest match — an agent will sort out the details.</p>
        {categories.map((cat) => (
          <fieldset class="mb-5">
            <legend class="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{CATEGORY_LABELS[cat]}</legend>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LINES.filter((l) => l.category === cat).map((l) => (
                <label class="flex items-center gap-2 px-3 py-3 border border-slate-200 rounded-lg bg-white text-sm cursor-pointer hover:border-[#016490] has-[:checked]:border-[#016490] has-[:checked]:bg-[#f4f8fb]">
                  <input type="radio" name="coverage-line" value={l.id} required class="accent-[#016490]" />
                  <span>{l.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button type="button" class="quote-next mt-2 px-6 py-3 bg-[#016490] hover:bg-[#014d6e] text-white font-bold rounded-lg text-sm" data-goto="2">Continue</button>
      </section>
    )}

  <section class="quote-step" data-step="2" data-active>
    <h2 class="text-xl font-bold text-slate-900 mb-5">How can we reach you?</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><label class="block text-sm font-medium text-slate-700 mb-1.5" for="first-name">First Name *</label><input type="text" id="first-name" name="first-name" required class={input} /></div>
      <div><label class="block text-sm font-medium text-slate-700 mb-1.5" for="last-name">Last Name *</label><input type="text" id="last-name" name="last-name" required class={input} /></div>
      <div><label class="block text-sm font-medium text-slate-700 mb-1.5" for="email">Email *</label><input type="email" id="email" name="email" required class={input} /></div>
      <div><label class="block text-sm font-medium text-slate-700 mb-1.5" for="phone">Phone *</label><input type="tel" id="phone" name="phone" required class={input} placeholder="(801) 555-0100" /></div>
      <div><label class="block text-sm font-medium text-slate-700 mb-1.5" for="zip">ZIP Code *</label><input type="text" id="zip" name="zip" required inputmode="numeric" maxlength="5" class={input} placeholder="84010" /><p id="zip-note" class="mt-1 text-xs text-amber-600 hidden">We're a Utah agency — we may refer you to a partner outside Utah.</p></div>
      <div><label class="block text-sm font-medium text-slate-700 mb-1.5" for="contact-method">Preferred contact</label><select id="contact-method" name="contact-method" class={input}><option>Phone</option><option>Text</option><option>Email</option></select></div>
      <div><label class="block text-sm font-medium text-slate-700 mb-1.5" for="best-time">Best time to reach you</label><select id="best-time" name="best-time" class={input}><option value="">No preference</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></div>
    </div>

    <label class="mt-5 flex gap-3 items-start text-xs text-slate-500 leading-relaxed cursor-pointer">
      <input type="checkbox" id="tcpa-consent" name="tcpa-consent" value="yes" class="mt-0.5 accent-[#016490]" />
      <span>You may contact me by phone, text, or email about my quote — including with an autodialer or prerecorded message. Consent is not required to get a quote. Message and data rates may apply. Reply STOP to opt out of texts.</span>
    </label>

    <div class="mt-6 flex flex-col gap-3">
      <button type="button" class="quote-next px-6 py-4 bg-[#016490] hover:bg-[#014d6e] text-white font-bold rounded-lg text-sm" data-goto="3">Continue — 60 seconds for a faster, more accurate quote</button>
      <button type="submit" class="text-sm text-slate-500 underline hover:text-[#016490]">Just have an agent call me</button>
    </div>
  </section>

  {withFields.map((l) => (
    <fieldset
      class="quote-step quote-line-fields"
      data-step="3"
      data-line={l.id}
      data-active={l.id === active?.id ? '' : undefined}
      hidden={l.id !== active?.id}
      disabled={l.id !== active?.id}
    >
      <legend class="text-xl font-bold text-slate-900 mb-1">A few details about your {l.label.toLowerCase()}</legend>
      <p class="text-sm text-slate-500 mb-5">Every question here is optional. Skip anything you don't know.</p>
      {l.id === 'medicare' && <div class="mb-5"><TpmoDisclaimer /></div>}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {l.fields.map((field) => <Field field={field} />)}
      </div>
      <button type="button" class="quote-next mt-6 px-6 py-3 bg-[#016490] hover:bg-[#014d6e] text-white font-bold rounded-lg text-sm" data-goto="4">Continue</button>
    </fieldset>
  ))}

  <section class="quote-step" data-step="4" data-active>
    <h2 class="text-xl font-bold text-slate-900 mb-5">Anything else we should know?</h2>
    <textarea id="notes" name="notes" rows="4" class={`${input} resize-none`} placeholder="Tell us anything that would help us quote accurately…"></textarea>
    <div class="mt-4">
      <label class="block text-sm font-medium text-slate-700 mb-1.5" for="heard-about-us">How did you hear about us?</label>
      <select id="heard-about-us" name="heard-about-us" class={input}>
        <option value="">Select…</option><option>Google</option><option>Referral</option><option>Social media</option><option>Existing client</option><option>Other</option>
      </select>
    </div>
    <button type="submit" class="mt-6 w-full py-4 bg-[#016490] hover:bg-[#014d6e] text-white font-bold rounded-lg text-sm">Send My Quote Request</button>
    <p class="mt-3 text-xs text-slate-400 text-center">A licensed agent will follow up within one business day.</p>
  </section>
</form>

<style>
  /* Only once the controller has taken over does the form become stepped.
     Without JS every section stays visible and the form submits as one page. */
  form[data-wizard-ready] .quote-step:not([data-active]) { display: none; }
</style>
```

- [ ] **Step 4: Verify the build succeeds**

Run: `npm run build`
Expected: build completes with no errors. (No page renders the component yet — this step only proves the components compile.)

- [ ] **Step 5: Commit**

```bash
git add src/components/quote/
git commit -m "feat: add quote form markup with no-JS baseline"
```

---

### Task 7: The wizard controller

Covers **Review Focus #1**: changing the coverage line must clear and disable the previously selected line's fields, or an auto lead arrives carrying boat answers.

**Files:**
- Create: `src/scripts/quote-wizard.ts`, `tests/quote-wizard.test.ts`
- Modify: `src/components/quote/QuoteWizard.astro` (add the `<script>` block), `package.json` (add `jsdom`)

**Interfaces:**
- Consumes: `composeLeadSummary`, `validateContactStep`, `normalizePhone`, `isValidZip`, `isUtahZip`, `makeLeadId`, `parseUtm`, `lineById`.
- Produces: `initQuoteWizard(form: HTMLFormElement): void`; `applyLineSelection(form: HTMLFormElement, lineId: string): void`; `collectValues(form: HTMLFormElement): Record<string, string | string[]>`.

- [ ] **Step 1: Install jsdom**

```bash
npm install --save-dev --cache /tmp/npm-cache-bai jsdom
```

- [ ] **Step 2: Write the failing tests**

Create `tests/quote-wizard.test.ts`:

```ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { applyLineSelection, collectValues } from '../src/scripts/quote-wizard';

function buildForm(): HTMLFormElement {
  document.body.innerHTML = `
    <form id="quote-form">
      <input name="first-name" value="Jane" />
      <fieldset class="quote-line-fields" data-line="auto" hidden disabled>
        <input name="auto-vehicle-1" />
        <input type="checkbox" name="auto-sr22-needed" value="Yes" />
      </fieldset>
      <fieldset class="quote-line-fields" data-line="boat" hidden disabled>
        <input name="boat-length" />
        <select name="boat-type"><option value=""></option><option value="Pontoon">Pontoon</option></select>
        <textarea name="boat-notes"></textarea>
      </fieldset>
      <fieldset class="quote-line-fields" data-line="commercial" hidden disabled>
        <input type="checkbox" name="commercial-coverages" value="General liability" />
        <input type="checkbox" name="commercial-coverages" value="Cyber liability" />
      </fieldset>
    </form>`;
  return document.getElementById('quote-form') as HTMLFormElement;
}

describe('applyLineSelection', () => {
  let form: HTMLFormElement;
  beforeEach(() => { form = buildForm(); });

  const set = (id: string) => form.querySelector<HTMLFieldSetElement>(`[data-line="${id}"]`)!;

  it('enables and reveals the selected line', () => {
    applyLineSelection(form, 'boat');
    expect(set('boat').disabled).toBe(false);
    expect(set('boat').hidden).toBe(false);
  });

  it('leaves every other line disabled and hidden', () => {
    applyLineSelection(form, 'boat');
    expect(set('auto').disabled).toBe(true);
    expect(set('auto').hidden).toBe(true);
  });

  it('clears the previous line when the selection changes', () => {
    applyLineSelection(form, 'boat');
    (form.querySelector('[name="boat-length"]') as HTMLInputElement).value = '23 ft';
    (form.querySelector('[name="boat-type"]') as HTMLSelectElement).value = 'Pontoon';
    (form.querySelector('[name="boat-notes"]') as HTMLTextAreaElement).value = 'ski boat';

    applyLineSelection(form, 'auto');

    expect((form.querySelector('[name="boat-length"]') as HTMLInputElement).value).toBe('');
    expect((form.querySelector('[name="boat-type"]') as HTMLSelectElement).value).toBe('');
    expect((form.querySelector('[name="boat-notes"]') as HTMLTextAreaElement).value).toBe('');
  });

  it('unchecks checkboxes on the abandoned line', () => {
    applyLineSelection(form, 'commercial');
    const boxes = form.querySelectorAll<HTMLInputElement>('[name="commercial-coverages"]');
    boxes.forEach((b) => { b.checked = true; });
    applyLineSelection(form, 'auto');
    boxes.forEach((b) => expect(b.checked).toBe(false));
  });

  it('never clears fields outside the line fieldsets', () => {
    applyLineSelection(form, 'boat');
    applyLineSelection(form, 'auto');
    expect((form.querySelector('[name="first-name"]') as HTMLInputElement).value).toBe('Jane');
  });

  it('disables every line when given an unknown id', () => {
    applyLineSelection(form, 'nope');
    form.querySelectorAll<HTMLFieldSetElement>('.quote-line-fields')
      .forEach((f) => expect(f.disabled).toBe(true));
  });
});

describe('collectValues', () => {
  it('omits fields inside disabled fieldsets', () => {
    const form = buildForm();
    applyLineSelection(form, 'boat');
    (form.querySelector('[name="boat-length"]') as HTMLInputElement).value = '23 ft';
    const values = collectValues(form);
    expect(values['boat-length']).toBe('23 ft');
    expect(values['auto-vehicle-1']).toBeUndefined();
  });

  it('gathers repeated checkbox names into an array', () => {
    const form = buildForm();
    applyLineSelection(form, 'commercial');
    form.querySelectorAll<HTMLInputElement>('[name="commercial-coverages"]')
      .forEach((b) => { b.checked = true; });
    expect(collectValues(form)['commercial-coverages'])
      .toEqual(['General liability', 'Cyber liability']);
  });

  it('returns a single checked box as a one-element array', () => {
    const form = buildForm();
    applyLineSelection(form, 'commercial');
    (form.querySelector('[value="Cyber liability"]') as HTMLInputElement).checked = true;
    expect(collectValues(form)['commercial-coverages']).toEqual(['Cyber liability']);
  });
});
```

- [ ] **Step 3: Run the tests and confirm they fail**

Run: `npm test -- quote-wizard`
Expected: FAIL — module not found.

- [ ] **Step 4: Write the controller**

Create `src/scripts/quote-wizard.ts`:

```ts
import { composeLeadSummary } from '../lib/lead-summary';
import { validateContactStep, normalizePhone, isValidZip, isUtahZip } from '../lib/quote-validation';
import { makeLeadId, parseUtm, UTM_KEYS } from '../lib/lead-context';
import { lineById } from '../data/quote-lines';

type Values = Record<string, string | string[]>;

const lineSets = (form: HTMLFormElement) =>
  Array.from(form.querySelectorAll<HTMLFieldSetElement>('.quote-line-fields'));

/** Clearing the abandoned line is what keeps an auto lead free of boat answers. */
export function applyLineSelection(form: HTMLFormElement, lineId: string): void {
  for (const set of lineSets(form)) {
    const selected = set.dataset.line === lineId;
    if (!selected) {
      for (const el of Array.from(set.elements) as HTMLElement[]) {
        if (el instanceof HTMLInputElement) {
          if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
          else el.value = '';
        } else if (el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
          el.value = '';
        }
      }
    }
    set.disabled = !selected;
    set.hidden = !selected;
    if (selected) set.setAttribute('data-active', '');
    else set.removeAttribute('data-active');
  }
  form.dataset.activeLine = lineId;
}

export function collectValues(form: HTMLFormElement): Values {
  const values: Values = {};
  for (const [key, raw] of new FormData(form).entries()) {
    const value = String(raw);
    const existing = values[key];
    if (existing === undefined) values[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else values[key] = [existing, value];
  }
  // A checkbox group with one box ticked must still read as a list.
  for (const set of lineSets(form)) {
    if (set.disabled) continue;
    const groups = new Set(
      Array.from(set.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')).map((b) => b.name),
    );
    for (const name of groups) {
      const v = values[name];
      if (typeof v === 'string') values[name] = [v];
    }
  }
  return values;
}

export function initQuoteWizard(form: HTMLFormElement): void {
  const errorBox = form.querySelector<HTMLElement>('#quote-errors');
  const ctx = (name: string) => form.querySelector<HTMLInputElement>(`#ctx-${name}`);
  const setCtx = (name: string, value: string) => { const el = ctx(name); if (el) el.value = value; };

  setCtx('lead-id', makeLeadId());
  setCtx('source-path', window.location.pathname);
  setCtx('referrer', document.referrer.slice(0, 300));
  setCtx('render-time', String(Date.now()));
  const utm = parseUtm(window.location.search);
  for (const key of UTM_KEYS) setCtx(key, utm[key] ?? '');

  const steps = Array.from(form.querySelectorAll<HTMLElement>('.quote-step'));
  const preset = form.dataset.activeLine || '';
  let current = preset ? 2 : 1;

  const visibleSteps = (): HTMLElement[] =>
    steps.filter((s) => {
      const n = Number(s.dataset.step);
      if (n !== 3) return true;
      return s.dataset.line === (form.dataset.activeLine || '');
    });

  function show(step: number): void {
    current = step;
    for (const s of visibleSteps()) {
      const isActive = Number(s.dataset.step) === step;
      if (isActive) s.setAttribute('data-active', '');
      else s.removeAttribute('data-active');
    }
    for (const s of steps) {
      if (Number(s.dataset.step) === 3 && s.dataset.line !== (form.dataset.activeLine || '')) {
        s.removeAttribute('data-active');
      }
    }
    const heading = form.querySelector<HTMLElement>('.quote-step[data-active] h2, .quote-step[data-active] legend');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus();
    track('QuoteStep', { step, line: form.dataset.activeLine || '' });
  }

  function showErrors(messages: string[]): void {
    if (!errorBox) return;
    errorBox.innerHTML = messages.map((m) => `<p>${m}</p>`).join('');
    errorBox.classList.toggle('hidden', messages.length === 0);
  }

  function track(event: string, params: Record<string, unknown>): void {
    const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
    if (typeof fbq === 'function') fbq('trackCustom', event, params);
  }

  form.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target?.name === 'coverage-line') applyLineSelection(form, target.value);
  });

  const phone = form.querySelector<HTMLInputElement>('#phone');
  phone?.addEventListener('blur', () => { phone.value = normalizePhone(phone.value); });

  const zip = form.querySelector<HTMLInputElement>('#zip');
  const zipNote = form.querySelector<HTMLElement>('#zip-note');
  zip?.addEventListener('blur', () => {
    const outOfState = isValidZip(zip.value) && !isUtahZip(zip.value);
    zipNote?.classList.toggle('hidden', !outOfState);
  });

  form.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.quote-next');
    if (!btn) return;
    const goto = Number(btn.dataset.goto);

    if (current === 1) {
      const chosen = form.querySelector<HTMLInputElement>('input[name="coverage-line"]:checked');
      if (!chosen) { showErrors(['Please choose what you would like a quote for.']); return; }
      applyLineSelection(form, chosen.value);
    }

    if (current === 2) {
      const values = collectValues(form) as Record<string, string>;
      const errors = validateContactStep(values);
      if (errors.length) {
        showErrors(errors.map((err) => err.message));
        form.querySelector<HTMLElement>(`[name="${errors[0].name}"]`)?.focus();
        return;
      }
      const hasFields = (lineById(form.dataset.activeLine || '')?.fields.length ?? 0) > 0;
      showErrors([]);
      show(hasFields ? goto : 4);
      return;
    }

    showErrors([]);
    show(goto);
  });

  form.addEventListener('submit', (event) => {
    // Spec §11's time floor. No human fills five required fields in 3 seconds.
    const rendered = Number(ctx('render-time')?.value ?? 0);
    if (rendered && Date.now() - rendered < 3000) {
      event.preventDefault();
      showErrors(['Please take a moment to review your answers, then submit again.']);
      return;
    }

    const consentEl = form.querySelector<HTMLInputElement>('#tcpa-consent');
    const given = Boolean(consentEl?.checked);
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Denver' });
    if (given) {
      setCtx('consent-timestamp', timestamp);
      setCtx('consent-version', '2026-09-30-v1');
    }
    // Records which Medicare products the visitor agreed to discuss, and when.
    // This is interest, not a CMS Scope of Appointment — see spec §8.3.
    if (form.querySelectorAll('input[name="medicare-soa-products"]:checked').length > 0) {
      setCtx('medicare-soa-timestamp', timestamp);
    }
    const lineId = form.dataset.activeLine || '';
    const line = lineById(lineId);
    if (line) {
      const summary = form.querySelector<HTMLTextAreaElement>('#lead-summary');
      if (summary) {
        summary.value = composeLeadSummary({
          line,
          values: collectValues(form),
          consent: { given, timestamp: given ? timestamp : undefined },
          context: {
            sourcePath: window.location.pathname,
            utm: parseUtm(window.location.search),
            leadId: ctx('lead-id')?.value ?? '',
          },
        });
      }
      form.action = `/thank-you/?line=${encodeURIComponent(lineId)}`;
    }
  });

  if (preset) applyLineSelection(form, preset);
  form.setAttribute('data-wizard-ready', '');
  show(current);
}
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npm test -- quote-wizard`
Expected: PASS — 9 tests.

- [ ] **Step 6: Wire the controller into the component**

Append to `src/components/quote/QuoteWizard.astro`, after the `</form>` tag and before the `<style>` block:

```astro
<script>
  import { initQuoteWizard } from '../../scripts/quote-wizard';
  const form = document.getElementById('quote-form');
  if (form instanceof HTMLFormElement) {
    try {
      initQuoteWizard(form);
    } catch (error) {
      // The plain form still submits; never let a controller fault break it.
      console.error('[quote] wizard init failed; plain form retained', error);
    }
  }
</script>
```

- [ ] **Step 7: Verify the build succeeds**

Run: `npm run build && npm test`
Expected: build succeeds, all tests pass.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/scripts/quote-wizard.ts src/components/quote/QuoteWizard.astro tests/quote-wizard.test.ts
git commit -m "feat: add wizard controller with line switching and summary composition"
```

---

### Task 8: Partial lead capture

Covers the second half of **Review Focus #2**: free text containing `&`, `=`, quotes, newlines, or unicode must survive URL encoding into the beacon body.

**Files:**
- Create: `src/scripts/quote-partial.ts`, `tests/quote-partial.test.ts`
- Modify: `src/scripts/quote-wizard.ts`

**Interfaces:**
- Consumes: nothing. `collectValues` is injected as a callback rather than imported — `quote-wizard.ts` imports `armPartialCapture`, so importing back would create a module cycle.
- Produces: `buildPartialBody(values: Record<string, string | string[]>, leadId: string): string`; `armPartialCapture(form: HTMLFormElement, isReady: () => boolean, collect: () => Record<string, string | string[]>): void`.

- [ ] **Step 1: Write the failing tests**

Create `tests/quote-partial.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildPartialBody } from '../src/scripts/quote-partial';

const parse = (body: string) => new URLSearchParams(body);

describe('buildPartialBody', () => {
  it('identifies itself as the partial form', () => {
    expect(parse(buildPartialBody({}, 'abc12345')).get('form-name')).toBe('quote-partial');
  });

  it('carries the lead id so a later completion can be matched', () => {
    expect(parse(buildPartialBody({}, 'abc12345')).get('lead-id')).toBe('abc12345');
  });

  it('round-trips ordinary values', () => {
    const body = buildPartialBody({ 'first-name': 'Jane', zip: '84010' }, 'abc12345');
    expect(parse(body).get('first-name')).toBe('Jane');
    expect(parse(body).get('zip')).toBe('84010');
  });

  it('round-trips ampersands and equals signs without splitting the body', () => {
    const body = buildPartialBody({ notes: 'Ski & Ski = fun' }, 'abc12345');
    expect(parse(body).get('notes')).toBe('Ski & Ski = fun');
  });

  it('round-trips quotes, newlines and unicode', () => {
    const notes = `It's a 23" beam\nnaïve — “quoted”`;
    expect(parse(buildPartialBody({ notes }, 'abc12345')).get('notes')).toBe(notes);
  });

  it('round-trips a plus sign as a plus sign, not a space', () => {
    expect(parse(buildPartialBody({ notes: 'a + b' }, 'abc12345')).get('notes')).toBe('a + b');
  });

  it('joins array values into one comma-separated entry', () => {
    const body = buildPartialBody({ 'commercial-coverages': ['General liability', 'Cyber liability'] }, 'abc12345');
    expect(parse(body).get('commercial-coverages')).toBe('General liability, Cyber liability');
  });

  it('omits empty values', () => {
    const body = buildPartialBody({ notes: '', zip: '84010', tags: [] }, 'abc12345');
    expect(parse(body).has('notes')).toBe(false);
    expect(parse(body).has('tags')).toBe(false);
  });

  it('never includes the honeypot or the form-name from the real form', () => {
    const body = buildPartialBody({ 'bot-field': 'x', 'form-name': 'quote' }, 'abc12345');
    expect(parse(body).get('form-name')).toBe('quote-partial');
    expect(parse(body).has('bot-field')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test -- quote-partial`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/scripts/quote-partial.ts`:

```ts
const EXCLUDED = new Set(['form-name', 'bot-field', 'lead-summary']);

export function buildPartialBody(
  values: Record<string, string | string[]>,
  leadId: string,
): string {
  const params = new URLSearchParams();
  params.set('form-name', 'quote-partial');
  params.set('lead-id', leadId);
  for (const [key, raw] of Object.entries(values)) {
    if (EXCLUDED.has(key) || key === 'lead-id') continue;
    const value = Array.isArray(raw) ? raw.filter((v) => v.trim()).join(', ') : raw;
    if (value && value.trim()) params.set(key, value);
  }
  return params.toString();
}

/**
 * Fires once, when the page goes away with a usable contact block that was
 * never submitted. Netlify accepts a urlencoded POST to any path so long as
 * form-name names a registered form.
 */
export function armPartialCapture(
  form: HTMLFormElement,
  isReady: () => boolean,
  collect: () => Record<string, string | string[]>,
): void {
  let sent = false;

  const send = () => {
    if (sent || !isReady()) return;
    sent = true;
    const leadId = form.querySelector<HTMLInputElement>('#ctx-lead-id')?.value ?? '';
    const body = buildPartialBody(collect(), leadId);
    const blob = new Blob([body], { type: 'application/x-www-form-urlencoded' });
    if (typeof navigator.sendBeacon === 'function') navigator.sendBeacon('/', blob);
  };

  form.addEventListener('submit', () => { sent = true; });
  window.addEventListener('pagehide', send);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') send();
  });
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- quote-partial`
Expected: PASS — 9 tests.

- [ ] **Step 5: Arm it from the controller**

In `src/scripts/quote-wizard.ts`, add the import at the top:

```ts
import { armPartialCapture } from './quote-partial';
```

and immediately before the final `show(current);` line in `initQuoteWizard`:

```ts
  // A visitor who gave us a name and number and then left is a real lead.
  armPartialCapture(
    form,
    () => validateContactStep(collectValues(form) as Record<string, string>).length === 0,
    () => collectValues(form),
  );
```

- [ ] **Step 6: Declare the partial form for Netlify**

Netlify only registers forms it finds in built HTML, and `quote-partial` is never rendered. Add this hidden declaration to `src/pages/quote/index.astro` in Task 9 — note it now so it is not forgotten:

```html
<form name="quote-partial" data-netlify="true" hidden>
  <input type="hidden" name="form-name" value="quote-partial" />
  <input type="text" name="lead-id" /><input type="text" name="coverage-line" />
  <input type="text" name="first-name" /><input type="text" name="last-name" />
  <input type="email" name="email" /><input type="tel" name="phone" />
  <input type="text" name="zip" /><input type="text" name="contact-method" />
  <input type="text" name="best-time" /><input type="text" name="tcpa-consent" />
  <input type="text" name="source-path" /><input type="text" name="utm_source" />
  <input type="text" name="utm_medium" /><input type="text" name="utm_campaign" />
</form>
```

- [ ] **Step 7: Run the full suite and build**

Run: `npm test && npm run build`
Expected: all tests pass, build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/scripts/quote-partial.ts src/scripts/quote-wizard.ts tests/quote-partial.test.ts
git commit -m "feat: capture partial leads on abandonment"
```

---

### Task 9: The `/quote/` hub page

**Files:**
- Create: `src/pages/quote/index.astro`

**Interfaces:**
- Consumes: `QuoteWizard` from Task 6, `Layout` from `src/layouts/Layout.astro`.
- Produces: the route `/quote/`, and the `quote-partial` form declaration from Task 8 Step 6.

- [ ] **Step 1: Create the page**

```astro
---
import Layout from '../../layouts/Layout.astro';
import QuoteWizard from '../../components/quote/QuoteWizard.astro';

const SITE = 'https://bowthorpeinsurance.com';
const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${SITE}/quote/#webpage`,
  name: 'Get an Insurance Quote',
  url: `${SITE}/quote/`,
  about: { '@id': `${SITE}/#agency` },
};
---
<Layout
  title="Get a Quote"
  description="Request an insurance quote from B&A Insurance Producers in Bountiful, Utah. Home, auto, boat, RV, ATV, commercial, Medicare, and group health. A licensed agent follows up within one business day."
  schema={pageSchema}
>
  <section class="bg-[#016490] text-white py-16">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <p class="text-[#7ebee7] font-semibold text-sm uppercase tracking-widest mb-3">Free &amp; No Obligation</p>
      <h1 class="text-4xl sm:text-5xl font-extrabold mb-4">Get a Quote</h1>
      <p class="text-white/80 text-xl max-w-2xl">Tell us what you need covered. We compare carriers on your behalf — you are never charged for our help.</p>
    </div>
  </section>

  <section class="py-16 bg-white">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-[#f4f8fb] rounded-2xl p-6 sm:p-10">
        <QuoteWizard />
      </div>
      <p class="mt-8 text-center text-sm text-slate-500">
        Prefer to talk? Call <a href="tel:8014872300" class="font-semibold text-[#016490] hover:underline">(801) 487-2300</a> and reach a licensed agent directly.
      </p>
    </div>
  </section>

  <!-- Registers the partial-capture form with Netlify at deploy time. It is
       never shown; the beacon in quote-partial.ts posts to it. -->
  <form name="quote-partial" data-netlify="true" hidden>
    <input type="hidden" name="form-name" value="quote-partial" />
    <input type="text" name="lead-id" /><input type="text" name="coverage-line" />
    <input type="text" name="first-name" /><input type="text" name="last-name" />
    <input type="email" name="email" /><input type="tel" name="phone" />
    <input type="text" name="zip" /><input type="text" name="contact-method" />
    <input type="text" name="best-time" /><input type="text" name="tcpa-consent" />
    <input type="text" name="source-path" /><input type="text" name="utm_source" />
    <input type="text" name="utm_medium" /><input type="text" name="utm_campaign" />
  </form>
</Layout>
```

- [ ] **Step 2: Verify the page builds and renders every line**

Run: `npm run build && grep -c 'name="coverage-line"' dist/quote/index.html`
Expected: build succeeds; count is 14 (one radio per line).

- [ ] **Step 3: Commit**

```bash
git add src/pages/quote/index.astro
git commit -m "feat: add /quote/ hub page"
```

---

### Task 10: The eight landing pages

Covers **Review Focus #3**: a landing page submitted with JavaScript disabled must still carry `coverage-line`.

**Files:**
- Create: `src/pages/quote/[line].astro`, `tests/build-output.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `LANDING_LINES` from Task 1, `QuoteWizard` from Task 6.
- Produces: routes `/quote/auto/`, `/quote/home/`, `/quote/boat/`, `/quote/rv/`, `/quote/atv/`, `/quote/commercial/`, `/quote/medicare/`, `/quote/small-group-health/`.

- [ ] **Step 1: Create the dynamic route**

```astro
---
import Layout from '../../layouts/Layout.astro';
import QuoteWizard from '../../components/quote/QuoteWizard.astro';
import { LANDING_LINES, type Line } from '../../data/quote-lines';

export function getStaticPaths() {
  return LANDING_LINES.map((line) => ({ params: { line: line.slug! }, props: { line } }));
}

interface Props { line: Line }
const { line } = Astro.props;
const seo = line.seo!;
const SITE = 'https://bowthorpeinsurance.com';
const url = `${SITE}/quote/${line.slug}/`;

const pageSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Service',
      '@id': `${url}#service`,
      name: seo.h1,
      serviceType: line.label,
      url,
      provider: { '@id': `${SITE}/#agency` },
      areaServed: { '@type': 'State', name: 'Utah' },
    },
    ...(line.faqs?.length
      ? [{
          '@type': 'FAQPage',
          mainEntity: line.faqs.map(({ q, a }) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
          })),
        }]
      : []),
  ],
};

const breadcrumbs = [
  { name: 'Home', url: `${SITE}/` },
  { name: 'Get a Quote', url: `${SITE}/quote/` },
  { name: line.label, url },
];
---
<Layout title={seo.title} description={seo.description} schema={pageSchema} breadcrumbs={breadcrumbs}>
  <section class="bg-[#016490] text-white py-16">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <p class="text-[#7ebee7] font-semibold text-sm uppercase tracking-widest mb-3">Free &amp; No Obligation</p>
      <h1 class="text-4xl sm:text-5xl font-extrabold mb-4">{seo.h1}</h1>
      <p class="text-white/80 text-lg max-w-2xl leading-relaxed">{seo.intro}</p>
    </div>
  </section>

  <section class="py-16 bg-white">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-[#f4f8fb] rounded-2xl p-6 sm:p-10">
        <QuoteWizard line={line.id} />
      </div>
      <p class="mt-8 text-center text-sm text-slate-500">
        Prefer to talk? Call <a href="tel:8014872300" class="font-semibold text-[#016490] hover:underline">(801) 487-2300</a>.
      </p>
    </div>
  </section>

  {line.faqs?.length && (
    <section class="py-16 bg-[#f4f8fb]">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl font-bold text-slate-900 text-center mb-8">{line.label} FAQs</h2>
        <div class="space-y-4">
          {line.faqs.map(({ q, a }) => (
            <details class="bg-white rounded-xl border border-slate-100 shadow-sm group">
              <summary class="flex items-center justify-between px-6 py-5 cursor-pointer font-semibold text-slate-900 list-none">
                {q}
                <svg class="w-5 h-5 text-[#016490] shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <p class="px-6 pb-5 text-sm text-slate-600 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )}
</Layout>
```

- [ ] **Step 2: Add the build-output test script**

In `package.json` scripts:

```json
"test:build": "astro build && vitest run tests/build-output.test.ts"
```

- [ ] **Step 3: Write the failing build-output test**

Create `tests/build-output.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { LANDING_LINES, LINES } from '../src/data/quote-lines';

const html = (path: string) => readFileSync(path, 'utf8');
const hasDist = existsSync('dist/quote/index.html');

describe.skipIf(!hasDist)('built quote pages', () => {
  it('builds a page for every landing line', () => {
    for (const line of LANDING_LINES) {
      expect(existsSync(`dist/quote/${line.slug}/index.html`), `${line.slug} missing`).toBe(true);
    }
  });

  it('pre-selects the coverage line server-side, so a no-JS submit still carries it', () => {
    for (const line of LANDING_LINES) {
      const page = html(`dist/quote/${line.slug}/index.html`);
      expect(page).toMatch(
        new RegExp(`<input[^>]*type="hidden"[^>]*name="coverage-line"[^>]*value="${line.id}"`),
      );
    }
  });

  it('renders the selected line fieldset enabled and every other one disabled', () => {
    const page = html('dist/quote/boat/index.html');
    expect(page).toMatch(/data-line="boat"(?![^>]*disabled)/);
    expect(page).toMatch(/data-line="auto"[^>]*disabled/);
  });

  it('registers every line field somewhere in the built form', () => {
    const page = html('dist/quote/index.html');
    for (const line of LINES) {
      for (const field of line.fields) {
        expect(page.includes(`name="${field.name}"`), `${field.name} not registered`).toBe(true);
      }
    }
  });

  it('places the lead summary before the contact fields in document order', () => {
    const page = html('dist/quote/index.html');
    expect(page.indexOf('name="lead-summary"')).toBeLessThan(page.indexOf('name="first-name"'));
  });

  it('declares the partial-capture form for Netlify', () => {
    expect(html('dist/quote/index.html')).toContain('name="quote-partial"');
  });

  it('shows the TPMO disclaimer only on the Medicare page', () => {
    expect(html('dist/quote/medicare/index.html')).toContain('data-tpmo');
    expect(html('dist/quote/boat/index.html')).not.toContain('data-tpmo');
  });

  it('never marks a line detail field as required', () => {
    const page = html('dist/quote/boat/index.html');
    const boatFieldset = page.slice(page.indexOf('data-line="boat"'), page.indexOf('data-step="4"'));
    expect(boatFieldset).not.toContain('required');
  });

  it('emits FAQPage schema on every landing page', () => {
    for (const line of LANDING_LINES) {
      expect(html(`dist/quote/${line.slug}/index.html`)).toContain('"FAQPage"');
    }
  });
});
```

- [ ] **Step 4: Run it and confirm it fails**

Run: `npm run test:build`
Expected: FAIL — the landing pages do not exist until Step 1's file is in place; if Step 1 is already done, expect failures only where the implementation is wrong.

- [ ] **Step 5: Run it and confirm it passes**

Run: `npm run test:build`
Expected: PASS — 9 tests.

- [ ] **Step 6: Commit**

```bash
git add src/pages/quote/[line].astro tests/build-output.test.ts package.json
git commit -m "feat: add eight quote landing pages with Service and FAQ schema"
```

---

### Task 11: Tailored thank-you page

**Files:**
- Modify: `src/pages/thank-you.astro`

**Interfaces:**
- Consumes: `lineById` from `src/data/quote-lines`.
- Produces: no new exports. `/thank-you/?line=<id>` renders line-aware copy and fires `Lead` with `content_category`.

- [ ] **Step 1: Add the line-aware elements**

In `src/pages/thank-you.astro`, replace the paragraph that currently reads
`Your message has been received. A licensed agent will follow up within one business day.`
with:

```astro
      <p class="text-white/80 mt-4 text-lg" id="thanks-copy">Your message has been received. A licensed agent will follow up within one business day.</p>
```

- [ ] **Step 2: Replace the existing script block**

Replace the whole `<script>` block at the bottom of the file with:

```astro
  <script>
    import { lineById } from '../data/quote-lines';

    const params = new URLSearchParams(window.location.search);
    const line = lineById(params.get('line') ?? '');

    if (line) {
      const copy = document.getElementById('thanks-copy');
      if (copy) {
        copy.textContent =
          `Your ${line.label.toLowerCase()} request has been received. An agent who handles ${line.label.toLowerCase()} will follow up within one business day.`;
      }
    }

    const fbq = (window as any).fbq;
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', line ? { content_category: line.id } : {});
    }
  </script>
```

- [ ] **Step 3: Verify the build and the no-parameter fallback**

Run: `npm run build && grep -c 'thanks-copy' dist/thank-you/index.html`
Expected: build succeeds; count is at least 1. The static HTML must still contain the original generic sentence, so a visitor with JavaScript disabled sees correct copy.

- [ ] **Step 4: Commit**

```bash
git add src/pages/thank-you.astro
git commit -m "feat: tailor thank-you copy and Lead event to the coverage line"
```

---

### Task 12: Repoint every CTA, deep-link coverage cards, add the launch gate

**Files:**
- Create: `scripts/check-launch.mjs`
- Modify: `src/scripts/quote-wizard.ts`, `tests/quote-wizard.test.ts`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/pages/index.astro`, `src/pages/personal.astro`, `src/pages/business.astro`, `src/pages/health.astro`, `src/pages/our-team.astro`, `src/pages/[slug].astro`, `src/pages/contact-us.astro`, `public/llms.txt`, `package.json`

**Interfaces:**
- Consumes: `LINES`, `lineById`, `LANDING_LINES`.
- Produces: `quoteHref(lineId: string): string` exported from `src/data/quote-lines.ts`.

- [ ] **Step 1: Write the failing tests for `quoteHref` and query-param preselection**

Append to `tests/quote-lines.test.ts`:

```ts
import { quoteHref } from '../src/data/quote-lines';

describe('quoteHref', () => {
  it('links landing lines to their own page', () => {
    expect(quoteHref('boat')).toBe('/quote/boat/');
    expect(quoteHref('small-group-health')).toBe('/quote/small-group-health/');
  });

  it('links hub-only lines to the hub with a preselect parameter', () => {
    expect(quoteHref('umbrella')).toBe('/quote/?line=umbrella');
    expect(quoteHref('life')).toBe('/quote/?line=life');
  });

  it('falls back to the bare hub for an unknown line', () => {
    expect(quoteHref('nope')).toBe('/quote/');
  });
});
```

Append to `tests/quote-wizard.test.ts`:

```ts
import { presetFromQuery } from '../src/scripts/quote-wizard';

describe('presetFromQuery', () => {
  it('reads a known line from the query string', () => {
    expect(presetFromQuery('?line=umbrella')).toBe('umbrella');
  });

  it('ignores an unknown line', () => {
    expect(presetFromQuery('?line=nope')).toBe('');
  });

  it('ignores a missing parameter', () => {
    expect(presetFromQuery('')).toBe('');
    expect(presetFromQuery('?utm_source=google')).toBe('');
  });

  it('survives a malformed query string', () => {
    expect(() => presetFromQuery('?%%%')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npm test`
Expected: FAIL — `quoteHref` and `presetFromQuery` are not exported.

- [ ] **Step 3: Add `quoteHref` to the data module**

Append to `src/data/quote-lines.ts`:

```ts
/** Landing lines get their own page; everything else preselects on the hub. */
export function quoteHref(lineId: string): string {
  const line = lineById(lineId);
  if (!line) return '/quote/';
  return line.landingPage ? `/quote/${line.slug}/` : `/quote/?line=${line.id}`;
}
```

- [ ] **Step 4: Add query-param preselection to the controller**

In `src/scripts/quote-wizard.ts`, add this exported helper above `initQuoteWizard`:

```ts
export function presetFromQuery(search: string): string {
  try {
    const id = new URLSearchParams(search).get('line') ?? '';
    return lineById(id) ? id : '';
  } catch {
    return '';
  }
}
```

Then in `initQuoteWizard`, replace:

```ts
  const preset = form.dataset.activeLine || '';
  let current = preset ? 2 : 1;
```

with:

```ts
  const preset = form.dataset.activeLine || presetFromQuery(window.location.search);
  let current = preset ? 2 : 1;
  if (preset && !form.dataset.activeLine) {
    const radio = form.querySelector<HTMLInputElement>(`input[name="coverage-line"][value="${preset}"]`);
    if (radio) radio.checked = true;
  }
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `npm test`
Expected: PASS — all suites green.

- [ ] **Step 6: Repoint the header and footer**

`src/components/Header.astro` — both "Get a Quote" buttons currently point at `/contact-us/#quote`. Change both `href="/contact-us/#quote"` to `href="/quote/"`. Leave the `Contact` nav entry pointing at `/contact-us/`.

`src/components/Footer.astro` — in the list containing `Blog &amp; Resources` (around line 39), add as the first item:

```astro
          <li><a href="/quote/" class="hover:text-white transition-colors">Get a Quote</a></li>
```

Leave the Services-column anchors (`/health/#medicare`, `/personal/#auto`, `/personal/#home`) unchanged — those are informational navigation, not CTAs.

- [ ] **Step 7: Repoint the page-level CTAs**

- `src/pages/index.astro:84` — `href="/contact-us/"` → `href="/quote/"` ("Get a Free Quote")
- `src/pages/index.astro:298` — `href="/contact-us/"` → `href="/quote/"` ("Get a Free Quote")
- `src/pages/our-team.astro` — the single `/contact-us/` CTA → `/quote/`
- `src/pages/[slug].astro:94` — `href="/contact-us/"` → `href="/quote/"` ("Get a Free Quote"). Leave line 108's "Contact Us" button pointing at `/contact-us/`.
- `src/pages/personal.astro` — hero "Get a Personal Quote" → `/quote/`; closing CTA → `/quote/`
- `src/pages/business.astro` — hero and closing CTAs → `/quote/commercial/`
- `src/pages/health.astro` — hero and closing CTAs → `/quote/`

- [ ] **Step 8: Deep-link the coverage cards**

`src/pages/personal.astro` — the `coverages` array already carries an `id` per entry, and the footer links to `#auto` and `#home`, so **keep `id={id}` on the card div**. Import `quoteHref` and add a link inside each card, after the description paragraph:

```astro
---
import { quoteHref } from '../data/quote-lines';
---
            <a href={quoteHref(id)} class="mt-3 inline-block text-sm font-semibold text-[#016490] hover:underline">Get a quote →</a>
```

The eight `id` values (`home`, `auto`, `umbrella`, `motorcycle`, `boat`, `rv`, `atv`, `life`) match line ids in `quote-lines.ts` exactly, so `quoteHref` resolves each without a mapping table.

`src/pages/business.astro` — its `coverages` entries have no `id`. Add `line: 'commercial'` to every entry except Workers' Compensation, which gets `line: 'workers-comp'`, then add the same link using `quoteHref(line)`.

`src/pages/health.astro` — its `plans` entries have no `id`. Add `line:` to each: Individual Health Plans → `individual-health`, Group Health Insurance → `small-group-health`, Medicare Supplement / Medicare Advantage / Medicare Part D → `medicare`, Life Insurance → `life`. Keep `id="medicare"` on the grid container — the footer links to it. Add the same link using `quoteHref(line)`.

- [ ] **Step 9: Retitle the contact form**

In `src/pages/contact-us.astro`, change the form heading from
`Request a Quote or Ask a Question` to `Ask a Question or Service Your Policy`,
and change the paragraph beneath it to:

```astro
            <p class="text-slate-500 text-sm mb-6">Already insured with us, or not ready for a quote? Send us a note. Looking for pricing? <a href="/quote/" class="font-semibold text-[#016490] hover:underline">Get a quote instead →</a></p>
```

Leave the form itself, its `name="contact"`, and all its fields untouched.

- [ ] **Step 10: Update `public/llms.txt`**

Under `## Services`, add:

```
## Quotes

- [Get a Quote](https://bowthorpeinsurance.com/quote/): line-specific quote request for any coverage we write
- [Auto Insurance Quote](https://bowthorpeinsurance.com/quote/auto/) — including SR-22 and high-risk
- [Home Insurance Quote](https://bowthorpeinsurance.com/quote/home/) — including earthquake and flood
- [Boat & Watercraft Quote](https://bowthorpeinsurance.com/quote/boat/)
- [RV & Motorhome Quote](https://bowthorpeinsurance.com/quote/rv/)
- [ATV & Off-Road Quote](https://bowthorpeinsurance.com/quote/atv/)
- [Commercial Insurance Quote](https://bowthorpeinsurance.com/quote/commercial/)
- [Medicare Plan Quote](https://bowthorpeinsurance.com/quote/medicare/)
- [Small Group Health Quote](https://bowthorpeinsurance.com/quote/small-group-health/)
```

- [ ] **Step 11: Add the launch gate**

Create `scripts/check-launch.mjs`:

```js
// Blocks release while the CMS TPMO disclaimer still carries its placeholders.
// Kept out of `npm test` deliberately: a permanently-red suite is useless.
import { readFileSync, existsSync } from 'node:fs';

const page = 'dist/quote/medicare/index.html';

if (!existsSync(page)) {
  console.error('✗ dist/quote/medicare/index.html not found — run `npm run build` first.');
  process.exit(1);
}

const html = readFileSync(page, 'utf8');
const unresolved = ['[N]', '[M]'].filter((token) => html.includes(token));

if (unresolved.length) {
  console.error(
    `✗ LAUNCH BLOCKED: the TPMO disclaimer still contains ${unresolved.join(' and ')}.\n` +
    '  CMS requires the real count of organizations and products represented.\n' +
    '  Fill them in at src/components/quote/TpmoDisclaimer.astro.',
  );
  process.exit(1);
}

console.log('✓ TPMO disclaimer resolved.');
```

Add to `package.json` scripts:

```json
"check:launch": "node scripts/check-launch.mjs"
```

- [ ] **Step 12: Confirm the gate fires**

Run: `npm run build && npm run check:launch`
Expected: exit code 1 with `LAUNCH BLOCKED: the TPMO disclaimer still contains [N] and [M].` **This failure is correct** — it stays failing until the agency supplies the numbers.

- [ ] **Step 13: Confirm no CTA still points at the old quote anchor**

Run: `grep -rn 'contact-us/#quote' src/ || echo "clean"`
Expected: `clean`.

- [ ] **Step 14: Run everything**

Run: `npm test && npm run test:build`
Expected: all suites pass.

- [ ] **Step 15: Commit**

```bash
git add src/ public/llms.txt scripts/check-launch.mjs package.json tests/
git commit -m "feat: repoint CTAs to the quote flow and add the TPMO launch gate"
```

---

## After the plan

Spec §12's deploy-preview checklist is the remaining verification and **cannot be done locally** — it needs a real Netlify deploy. Work through it before considering this shipped, and treat item 2 (every submitted field appears in the Netlify dashboard) as the one most likely to surprise us.

The three open items in spec §15 are owned by the agency, not by the implementer: the TPMO `[N]`/`[M]` values, E&O sign-off on the consent copy, and confirmation of the Netlify plan's submission cap before partial capture ships.
