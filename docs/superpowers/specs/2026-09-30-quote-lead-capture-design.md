# Multi-Line Quote & Lead Capture — Design

**Date:** 2026-09-30
**Status:** Approved design, pending implementation plan
**Scope:** Workstream 1 of 2. The SEO audit is a separate spec.

---

## 1. Problem

`bowthorpeinsurance.com` has exactly one lead path: a single Netlify form on
`/contact-us/` with a six-option coverage dropdown and a free-text box. Every CTA
on the site funnels into it — the header "Get a Quote" button, the footer, the
homepage, and all 22 coverage cards across `/personal/`, `/business/`, and
`/health/`.

The result is that a visitor shopping boat coverage and a visitor shopping
workers' compensation produce identical lead records: a name, an email, and a
dropdown value. The sales team cannot triage, prioritise, or prepare. Every lead
requires a discovery call before it can be quoted.

## 2. Goals

1. Capture line-specific intake detail across the fourteen coverage lines the
   agency sells (eight with landing pages, six hub-only — §5.4), without adding
   friction that costs completions.
2. Deliver leads to the sales team as a readable lead sheet, not a field dump.
3. Never lose a visitor who supplied contact details and then abandoned.
4. Record consent state per lead, with Medicare handled to its own standard.
5. Produce eight indexable landing pages with genuinely distinct content, as
   assets the SEO workstream can then optimise.

## 3. Non-goals

- **No CRM or agency-management-system integration.** Explicitly scoped out.
  Leads are delivered by email, as today.
- **No serverless functions.** The site stays a static Astro build on Netlify.
- **No JavaScript framework.** The repo ships zero today; it continues to.
- **No rating or real-time premium quoting.** This captures leads; humans quote.
- **No SEO content optimisation.** Structural schema baseline only — see §14.

## 4. Decisions and rationale

| Decision | Rationale |
|---|---|
| Static Astro + Netlify Forms, email delivery | User constraint. No new infrastructure. |
| One universal form, progressive disclosure, vanilla JS | Avoids a framework dependency and 8× duplicated Netlify notification config. ~150 lines of controller. |
| Contact captured at step 2, detail steps optional | Resolves "as much information as possible" against "as seamless as possible" — a workable lead is guaranteed; detail is upside. |
| Hub + 8 landing pages (not 12+) | A page per line, templated, produces thin doorway pages that Google demotes. Eight lines have real distinct Utah-specific content. |
| Detail steps are the progressive enhancement | Falls out of the Netlify build-time field-parsing constraint. Yields a genuine no-JS fallback for free. |
| TCPA consent optional, not required | Consent must be freely given; conditioning submission on it is the pattern that gets challenged. |
| Partial-lead capture via a second form | Contact info arrives at step 2, so abandonment after step 2 is a real lead being lost today. |

## 5. Architecture

### 5.1 Single source of truth

`src/data/quote-lines.ts` is the only file edited to change what the site asks.
The wizard, line selector, eight landing pages, their schema, sitemap entries,
and `llms.txt` service list all derive from it.

```ts
export type FieldType =
  | 'text' | 'tel' | 'email' | 'number' | 'date'
  | 'select' | 'radio' | 'checkbox-group' | 'textarea';

export interface Field {
  name: string;            // full submitted name, e.g. 'boat-type'
  label: string;
  type: FieldType;
  options?: string[];      // select | radio | checkbox-group
  placeholder?: string;
  help?: string;
  required?: boolean;      // only ever true in the universal contact step
}

export interface Line {
  id: string;              // 'boat'
  label: string;           // 'Boat & Watercraft'
  category: 'personal' | 'business' | 'health';
  landingPage: boolean;
  slug?: string;           // '/quote/boat/' — required when landingPage
  seo?: { title: string; description: string; h1: string; intro: string };
  fields: Field[];
  faqs?: { q: string; a: string }[];
}
```

**Field naming convention:** every line field is prefixed with its line id
(`boat-type`, `auto-vehicle-count`). This prevents collisions across lines in a
single flat Netlify form, and makes the registered field set self-documenting.
A data-integrity test asserts uniqueness (§13).

### 5.2 File layout

| Path | Purpose | New? |
|---|---|---|
| `src/data/quote-lines.ts` | Line definitions — the content surface | new |
| `src/lib/lead-summary.ts` | Pure: form data → lead sheet text | new |
| `src/lib/quote-validation.ts` | Pure: per-step validation rules | new |
| `src/components/quote/QuoteWizard.astro` | Form shell, steps, all fieldsets | new |
| `src/components/quote/Field.astro` | Renders one `Field` by type | new |
| `src/scripts/quote-wizard.ts` | Controller: navigation, validation, summary, partial capture | new |
| `src/pages/quote/index.astro` | Hub — all lines selectable | new |
| `src/pages/quote/[line].astro` | 8 landing pages via `getStaticPaths` | new |
| `src/pages/thank-you.astro` | Reads `?line=`, tailors copy, fires `Lead` | modified |
| `src/pages/contact-us.astro` | Retitled; form retained unchanged | modified |
| `src/components/Header.astro` | CTA → `/quote/` (3 refs) | modified |
| `src/components/Footer.astro` | Quote links → `/quote/` (1 ref) | modified |
| `src/pages/index.astro` | CTAs → `/quote/` (2 refs) | modified |
| `src/pages/personal.astro` | Coverage cards deep-link (2 refs) | modified |
| `src/pages/business.astro` | Coverage cards deep-link (2 refs) | modified |
| `src/pages/health.astro` | Coverage cards deep-link (2 refs) | modified |
| `src/pages/our-team.astro` | CTA → `/quote/` (1 ref) | modified |
| `src/pages/[slug].astro` | Blog post CTA → `/quote/` (2 refs) | modified |
| `public/llms.txt` | Add quote routes | modified |

### 5.3 Progressive enhancement model

Netlify registers form fields by parsing built HTML at deploy time. Every field
must therefore exist in the markup. The consequence is exploited rather than
worked around: **the optional detail steps are the progressive enhancement.**

- **Without JavaScript:** the form renders as a single plain form — coverage
  selector, name, email, phone, ZIP, contact preference, consent, notes, submit.
  This equals today's capability and can never be broken by a script error.
- **With JavaScript:** the controller sets `data-wizard-ready` on the form
  (inside a `try`/`catch`; on throw, the plain form remains), which activates
  the stepped CSS, and enables the selected line's detail fieldset.

Non-selected line fieldsets are rendered `hidden` **and** `disabled`. Disabled
controls are registered by Netlify at deploy but are not submitted by the
browser, so lead records contain only the relevant line's fields.

On a landing page (`/quote/boat/`), that line's fieldset is server-rendered
already enabled and visible. `/quote/boat/` is therefore a complete, working
boat intake form on a single page with JavaScript disabled.

### 5.4 Routes

**Hub:** `/quote/` — all lines selectable, all fieldsets present.

**Landing pages (8):**

| Route | Line |
|---|---|
| `/quote/auto/` | Auto |
| `/quote/home/` | Homeowners |
| `/quote/boat/` | Boat & Watercraft |
| `/quote/rv/` | RV & Motorhome |
| `/quote/atv/` | ATV / UTV / Off-road |
| `/quote/commercial/` | Commercial / Business |
| `/quote/medicare/` | Medicare |
| `/quote/small-group-health/` | Small group health |

**Selectable in the wizard, no landing page:** umbrella, motorcycle,
renters/condo, individual health, life, workers' compensation.

Line selection chosen against `rankless/03-gaps.md` and `04-strategy.md`: boat is
a term the site already ranks for; ATV, SR-22 (auto), earthquake and flood
(home), and Davis County commercial are identified open gaps.

## 6. Step flow

1. **Coverage** — radio cards grouped Personal / Business / Health.
   Pre-selected and skipped entirely on landing pages.
2. **Contact** — required fields. Ends with two actions:
   - Primary: *"Continue — 60 seconds for a faster, more accurate quote"*
   - Secondary (plain text, submits immediately): *"Just have an agent call me"*
3. **Detail** — the selected line's fields. Every field optional.
4. **Anything else** — free-text notes, "how did you hear about us", submit.

## 7. Field inventory

### 7.1 Universal — step 2

| Name | Type | Required | Notes |
|---|---|---|---|
| `coverage-line` | radio | yes | Step 1; pre-set on landing pages |
| `first-name` | text | yes | |
| `last-name` | text | yes | |
| `email` | email | yes | |
| `phone` | tel | yes | Normalised to `(801) 555-0100` on blur |
| `zip` | text | yes | `[0-9]{5}`; non-Utah ZIP shows a soft note, still accepted |
| `contact-method` | select | no | Phone / Text / Email — default Phone |
| `best-time` | select | no | Morning / Afternoon / Evening / Anytime |
| `tcpa-consent` | checkbox | **no** | Unchecked by default — see §8 |

### 7.2 Universal — step 4

| Name | Type | Notes |
|---|---|---|
| `notes` | textarea | "Anything else we should know?" |
| `heard-about-us` | select | Google / Referral / Social / Existing client / Other |

### 7.3 Hidden context (JS-populated)

`lead-id` (`crypto.randomUUID`), `consent-timestamp`, `consent-version`,
`source-path`, `referrer`, `utm-source`, `utm-medium`, `utm-campaign`,
`utm-term`, `utm-content`, `render-time` (spam time-trap), `lead-summary`.

Plus static: `form-name`, `bot-field` (honeypot, existing pattern).

### 7.4 Per line

**Auto** — `auto-vehicle-count` (1 / 2 / 3+) · `auto-vehicle-1` (year/make/model)
· `auto-additional-vehicles` (textarea) · `auto-driver-count` ·
`auto-incidents-3yr` (None / 1 / 2+ / Not sure) · `auto-sr22-needed` (Yes / No /
Not sure) · `auto-current-carrier` · `auto-current-premium` ·
`auto-renewal-date`

**Home** — `home-address` · `home-year-built` · `home-sqft` · `home-roof-age` ·
`home-value` (rebuild cost or purchase price) · `home-claims-5yr` (None / 1 / 2+)
· `home-current-carrier` · `home-renewal-date` · `home-earthquake-interest`
(Yes / No / Tell me more) · `home-flood-interest` (Yes / No / Tell me more)

**Boat** — `boat-type` (Boat / PWC–jet ski / Pontoon / Sailboat / Other) ·
`boat-year-make-model` · `boat-length` · `boat-engine-hp` · `boat-value` ·
`boat-storage` (Trailer at home / Marina slip / Storage facility / Other) ·
`boat-primary-water` (Utah Lake / Bear Lake / Lake Powell / Jordanelle / Other)

**RV** — `rv-type` (Class A / Class B / Class C / Travel trailer / Fifth wheel /
Pop-up) · `rv-year-make-model` · `rv-value` · `rv-full-time` (Yes / No /
Seasonally) · `rv-storage` · `rv-towed-vehicle`

**ATV/OHV** — `atv-type` (ATV / UTV–side-by-side / Dirt bike / Snowmobile) ·
`atv-unit-count` · `atv-year-make-model` · `atv-value` · `atv-street-legal`
(Yes / No / Not sure) · `atv-riding-location` (Public land / Private property /
Both)

**Commercial** — `commercial-business-name` · `commercial-industry` ·
`commercial-years-in-business` · `commercial-employee-count` ·
`commercial-revenue-range` · `commercial-coverages` (checkbox-group: General
liability / Commercial property / Commercial auto / Workers' compensation /
Professional liability (E&O) / Cyber liability / Surety bond / BOP / Umbrella) ·
`commercial-current-carrier` · `commercial-renewal-date` ·
`commercial-coi-required` (Yes / No / Not sure)

**Medicare** — `medicare-dob` · `medicare-status` (Currently on Medicare /
Turning 65 within 12 months / Not yet eligible) · `medicare-ab-effective-date` ·
`medicare-interest` (Supplement / Advantage / Part D / Not sure) ·
`medicare-prescriptions` (Yes / No) · `medicare-providers-to-keep` (textarea) ·
`medicare-soa-products` (checkbox-group, see §8.3) · `medicare-soa-timestamp`

**Small group health** — `group-business-name` · `group-eligible-employees` ·
`group-currently-offering` (Yes / No) · `group-current-carrier` ·
`group-renewal-date` · `group-priority` (Lowest cost / Broadest network /
Low deductibles / Dental & vision included) · `group-interest` (checkbox-group:
Medical / Dental / Vision / Life / Disability)

Six fields are deliberate additions rather than standard intake:
`auto-sr22-needed`, `home-earthquake-interest`, `home-flood-interest`,
`atv-street-legal`, `rv-full-time`, and `commercial-coi-required`. Each is either
a high-intent buying signal or maps to a content gap in `rankless/03-gaps.md`, so
the aggregate answers double as content research.

## 8. Consent and compliance

### 8.1 TCPA

Checkbox, unchecked by default, **not required to submit**:

> ☐ You may contact me by phone, text, or email about my quote — including with
> an autodialer or prerecorded message. Consent is not required to get a quote.
> Message and data rates may apply. Reply STOP to opt out of texts.

- Checked → `consent-timestamp` and `consent-version` recorded into the lead.
- Unchecked → lead sheet opens with `⚠ EMAIL ONLY — no phone/text consent`.

### 8.2 CMS TPMO disclaimer

Rendered above the form on `/quote/medicare/` and within the Medicare detail
step. Prescribed text with two agency-specific values:

> We do not offer every plan available in your area. Currently we represent
> **[N]** organizations which offer **[M]** products in your area. Please contact
> Medicare.gov, 1-800-MEDICARE, or your local State Health Insurance Program to
> get information on all of your options.

`[N]` and `[M]` ship as loud placeholders. **The Medicare route is not
launch-ready until they are supplied** — enforced by a data-integrity test that
fails while the placeholder tokens are present.

### 8.3 Scope-of-appointment intent

`medicare-soa-products` records which product types the visitor agreed to
discuss, with `medicare-soa-timestamp`.

**This is explicitly not a CMS-compliant Scope of Appointment**, and no UI copy
will describe it as one. It is a documented record of stated interest that the
agent uses to complete a real SOA before the appointment.

### 8.4 Review gate

TCPA wording, the TPMO disclaimer, and the SOA-intent copy require sign-off from
the agency's E&O carrier or compliance contact before launch.

## 9. Submission pipeline

### 9.1 Two Netlify forms

**`quote`** — the real submission. Carries the universal set, consent record,
hidden context, `lead-summary`, and the active line's fields.

**`quote-partial`** — abandonment capture. Sent via `navigator.sendBeacon` to
`/` as `application/x-www-form-urlencoded` including `form-name=quote-partial`.

Fires only when **all** hold: step 2 validated, form not submitted, beacon not
already sent. Triggered on `pagehide` and on `visibilitychange` → `hidden`.
Shares `lead-id` with the full submission so a later completion can be matched
and the partial discarded.

### 9.2 The lead sheet

`lead-summary` is a hidden textarea composed by `src/lib/lead-summary.ts` at
submit time. It is placed first in the form markup, because Netlify's
notification email is understood to list fields in document order (an assumption
— §12). It reads:

```
BOAT & WATERCRAFT — Jane Smith — Bountiful 84010
☑ Consented to phone/text 2026-09-30 14:22 MDT

(801) 555-0100 · jane@example.com · prefers text, afternoons

2019 Malibu Wakesetter · 23 ft · 450 HP · ~$78,000
Stored on trailer at home · primarily Bear Lake
Currently with Progressive, renews 2026-11-14

"Just bought it, need coverage before we take it out."

Source: /quote/boat/ · google / cpc / boat-insurance-utah
Lead ID: 3f9a2c14
```

Empty fields are omitted entirely. The composer is a pure function and is the
most heavily unit-tested piece of the build.

**This design also de-risks the one unverified assumption** (§12): if Netlify
fails to register some `hidden`/`disabled` fields, the summary still carries the
complete lead. Field-level fidelity would degrade; no information would be lost.

### 9.3 Email subject

Netlify's notification subject line is not configurable without a serverless
function, which is out of scope. Mitigation: the summary's first line is
`COVERAGE — NAME — CITY ZIP`, which is what most mail clients show as the
preview snippet.

## 10. Thank-you and analytics

Before submit, the controller appends `?line=<id>` to the form `action`. The
existing `/thank-you/` page reads it and tailors its copy ("an agent who handles
watercraft will call you"). With JavaScript off, no parameter is appended and the
existing generic copy renders unchanged.

Meta Pixel:
- `Lead` on `/thank-you/` with `content_category: <line>` (extends the existing
  `Lead` call rather than replacing it).
- `trackCustom('QuoteStep', { step, line })` on each advance, to expose drop-off.
  This is the measurement that tells us whether nine questions was too many.

## 11. Validation, spam, accessibility

**Validation** — native Constraint Validation API, evaluated per step before
advancing. Messages rendered into an `aria-live="polite"` region; focus moved to
the first invalid control. Only step 2 has required fields.

**Spam** — existing `bot-field` honeypot, plus a `render-time` floor rejecting
submissions faster than a human could produce. Netlify's built-in filtering
stays enabled.

**Accessibility** — each step is a `fieldset` with a `legend`; focus moves to the
step heading on advance; progress is announced; radio cards are real radios and
fully keyboard-operable. The wizard is a form, not a custom widget.

## 12. Verification

Two assumptions in this design are unverified and must be confirmed against a
real deploy before launch:

1. **Netlify registers fields present in `hidden`/`disabled` markup at deploy
   time.** Mitigated by §9.2, not assumed.
2. **Query parameters survive Netlify's post-submission redirect** to the
   `action` URL (§10).
3. **The notification email orders fields by document order**, placing the lead
   sheet first (§9.2). If it does not, the sheet is still present, just lower in
   the email.

**Deploy-preview checklist** — on a Netlify deploy preview, not locally:

- [ ] Submit one complete lead per line (9 submissions: hub + 8 landing pages)
- [ ] Confirm every submitted field appears in the Netlify dashboard record
- [ ] Confirm the notification email renders the lead sheet first and readably
- [ ] Confirm `?line=` survives the redirect and the thank-you copy adapts
- [ ] Submit with JavaScript disabled; confirm the lead arrives
- [ ] Abandon after step 2; confirm a `quote-partial` record arrives
- [ ] Complete after a partial; confirm both share a `lead-id`
- [ ] Confirm a lead with `tcpa-consent` unchecked is flagged EMAIL ONLY

## 13. Testing

The repo has no test framework today. Vitest is added as a dev dependency, and
the pure modules are developed test-first:

- `lead-summary.ts` — composition, empty-field omission, consent flagging,
  ordering, unicode/quote escaping
- `quote-validation.ts` — per-step rules, phone normalisation, ZIP pattern,
  non-Utah ZIP soft-warning behaviour
- UTM parsing — presence, absence, malformed query strings
- **Data integrity over `quote-lines.ts`** — field names globally unique; every
  field name prefixed with its line id; every `landingPage: true` line has a
  slug and complete `seo` copy; no TPMO placeholder tokens remain

The Netlify round-trip is not unit-testable and is covered by §12 instead.

*Note: `npm install` on this machine requires the `--cache <tmp>` workaround.*

## 14. SEO baseline (structural only)

Delivered as part of this workstream because it is cheaper to build in than bolt
on. **Content optimisation is workstream 2 and is not in this spec.**

- `Service` + `FAQPage` schema per landing page, generated from `quote-lines.ts`
- Breadcrumbs via existing `Layout` props (Home > Quote > Line)
- Sitemap entries automatic via the existing `@astrojs/sitemap` integration
- `public/llms.txt` updated with the quote routes
- Coverage cards on `/personal/`, `/business/`, `/health/` link down into the
  matching landing page or hub-with-line

Each landing page requires genuinely distinct `seo.intro` copy. Templated
near-duplicate copy across eight pages would produce doorway pages and actively
harm the SEO workstream. This is a content requirement, not a code requirement.

## 15. Open items

| Item | Owner | Blocks |
|---|---|---|
| TPMO disclaimer `[N]` and `[M]` values | Agency | `/quote/medicare/` launch |
| E&O sign-off on TCPA + Medicare copy | Agency | Launch |
| Netlify plan submission cap | Agency | Partial capture (§9.1) |

**On the submission cap:** partial capture can nearly double submission volume,
since an abandonment and a later completion are two records. The plan's limit
and current usage must be confirmed. If the cap is tight, ship without partial
capture and add it once volume is understood.

## 16. Success criteria

1. Every "Get a Quote" CTA on the site leads to a line-appropriate intake.
2. Every lead record contains, at minimum: coverage line, name, email, phone,
   ZIP, and consent state.
3. A lead submitted with JavaScript disabled arrives successfully.
4. A visitor who completes step 2 and abandons still produces a lead record.
5. The notification email is triageable without opening the Netlify dashboard.
6. All eight landing pages carry unique, non-templated copy.
7. All pure modules have unit tests; §12 checklist passes on a deploy preview.
