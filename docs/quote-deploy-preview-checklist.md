# Quote Flow — Deploy Preview Verification

Run this against a **Netlify deploy preview**, not a local build. Nothing below
can be verified locally: Netlify registers form fields by parsing built HTML at
deploy time, and only a real submission proves what it kept.

Preview URL: `_______________________________`   Date: `____________`

---

## 0. Before you start

- [ ] `npm run build && npm run check:launch` passes locally
      *(it fails today by design — the TPMO disclaimer still has `[N]` and `[M]`)*
- [ ] Netlify shows **two** forms for this deploy: `quote` and `quote-partial`
- [ ] A notification email address is configured on **both** forms

---

## 1. The assumption most likely to be wrong

Spec §12.1. Every line's fields render into every quote page as `hidden disabled`
markup. If Netlify skips disabled inputs at parse time, those fields are dropped
from submissions — silently.

- [ ] Submit one complete lead from **each** of the 9 pages (hub + 8 landing)
- [ ] For each, open the Netlify dashboard record and confirm **every field you
      filled** is present, not just the contact block

**If fields are missing:** no data is lost — `lead-summary` carries the whole
lead as text. Report which fields vanished; the fix is field-level fidelity, not
a redesign.

| Page | Submitted | All fields present |
|---|---|---|
| `/quote/` | ☐ | ☐ |
| `/quote/auto/` | ☐ | ☐ |
| `/quote/home/` | ☐ | ☐ |
| `/quote/boat/` | ☐ | ☐ |
| `/quote/rv/` | ☐ | ☐ |
| `/quote/atv/` | ☐ | ☐ |
| `/quote/commercial/` | ☐ | ☐ |
| `/quote/medicare/` | ☐ | ☐ |
| `/quote/small-group-health/` | ☐ | ☐ |

---

## 2. The email your team actually opens

- [ ] The notification email leads with the lead sheet, not a field dump
- [ ] Its first line reads `COVERAGE — NAME — ZIP` and is legible in the inbox
      preview pane
- [ ] Empty fields are absent, not listed blank

> Netlify's subject line is not configurable without a serverless function,
> which is out of scope. The first line of the body is the mitigation.

---

## 3. The no-JavaScript path

Disable JS (DevTools → Settings → Debugger → Disable JavaScript), reload.

- [ ] `/quote/boat/` renders as one long form, every question visible
- [ ] It submits successfully
- [ ] The record carries `coverage-line = boat` **(spec §12 Review Focus #3 —
      if this is empty, the lead is unusable)**
- [ ] `/thank-you/` renders its generic copy without error

---

## 4. Partial capture

- [ ] Open `/quote/auto/`, fill name/email/phone/ZIP, press Continue, then
      **close the tab without submitting**
- [ ] A `quote-partial` record arrives
- [ ] Repeat, but complete the submission — confirm `quote` and `quote-partial`
      share the same `lead-id`
- [ ] Switch to another tab and back, then submit normally. Confirm you get
      **one** `quote` record and **no** spurious partial

---

## 5. Consent and Medicare

- [ ] Submit with the consent box **unchecked** — the lead sheet opens with
      `⚠ EMAIL ONLY — no phone/text consent`
- [ ] Submit with it **checked** — a consent timestamp is recorded
- [ ] The consent box is **not** required to submit *(if the form blocks you,
      that is a compliance defect — report it)*
- [ ] `/quote/medicare/` shows the TPMO disclaimer **above the form**
- [ ] Nothing anywhere describes the SOA capture as a Scope of Appointment

---

## 6. Journey and tracking

- [ ] Submitting from `/quote/boat/` lands on `/thank-you/?line=boat` and the
      copy names watercraft **(spec §12.2 — confirms query params survive
      Netlify's redirect)**
- [ ] Meta Pixel fires `Lead` with `content_category` set to the line
- [ ] `QuoteStep` events fire as you advance

---

## 7. Spot checks

- [ ] Every page passes on a phone-width viewport
- [ ] Tab through the form: focus moves to each step's heading on advance
- [ ] Submit step 2 with a blank email — the error is announced, focus lands on
      the offending field
- [ ] Enter an out-of-state ZIP (e.g. `83401`) — a soft note appears and the
      form still submits

---

## Sign-off

Verified by: `____________________`  Date: `____________`

Blockers found: `____________________________________________`
