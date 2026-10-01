import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { LANDING_LINES, LINES, MEDICARE_LIVE } from '../src/data/quote-lines';

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

  it('declares every universal field the beacon can send', () => {
    const page = html('dist/quote/index.html');
    const decl = page.slice(page.indexOf('name="quote-partial"'));
    // Netlify drops fields it never parsed, so an undeclared field is sent and lost.
    for (const field of [
      'lead-id', 'coverage-line', 'first-name', 'last-name', 'email', 'phone', 'zip',
      'contact-method', 'best-time', 'tcpa-consent', 'consent-timestamp', 'consent-version',
      'notes', 'source-path', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term',
    ]) {
      expect(decl.includes(`name="${field}"`), `${field} undeclared on quote-partial`).toBe(true);
    }
  });

  it.skipIf(MEDICARE_LIVE)('publishes no Medicare page or disclaimer while the counts are unfilled', () => {
    expect(existsSync('dist/quote/medicare/index.html')).toBe(false);
    expect(html('dist/quote/index.html')).not.toContain('data-tpmo');
    expect(html('dist/health/index.html')).not.toContain('href="/quote/medicare/"');
  });

  it.skipIf(!MEDICARE_LIVE)('renders the TPMO disclaimer above the form on the Medicare landing page', () => {
    const page = html('dist/quote/medicare/index.html');
    expect(page.indexOf('data-tpmo')).toBeLessThan(page.indexOf('name="quote"'));
    expect(page.match(/data-tpmo/g)).toHaveLength(2); // above the form, and in the step
  });

  it.skipIf(!MEDICARE_LIVE)('keeps the TPMO disclaimer out of view on non-Medicare pages', () => {
    // Every line's fieldset is rendered on every page, so the disclaimer is in
    // the DOM everywhere. What matters is that it is never reachable.
    const page = html('dist/quote/boat/index.html');
    const marks = [...page.matchAll(/data-tpmo/g)];
    expect(marks).toHaveLength(1);
    for (const mark of marks) {
      const open = page.lastIndexOf('<fieldset class="quote-step quote-line-fields"', mark.index);
      const tag = page.slice(open, page.indexOf('>', open));
      expect(tag).toContain('data-line="medicare"');
      expect(tag).toContain('disabled');
    }
  });

  it('never marks a line detail field as required', () => {
    const page = html('dist/quote/boat/index.html');
    const detail = page.slice(page.indexOf('data-line="boat"'), page.indexOf('data-step="4"'));
    // an attribute inside a tag, not the word: one label reads "...being required of you?"
    expect(detail).not.toMatch(/<(?:input|select|textarea)[^>]*\srequired[\s/>]/);
  });

  it('emits FAQPage schema on every landing page', () => {
    for (const line of LANDING_LINES) {
      expect(html(`dist/quote/${line.slug}/index.html`)).toContain('"FAQPage"');
    }
  });
});

// Not gated on dist: this is about what the deploy is obliged to run.
describe('launch gate', () => {
  it('wires check:launch into the Netlify build command', () => {
    expect(existsSync('netlify.toml'), 'netlify.toml missing — the Netlify UI build command cannot be enforced from the repo').toBe(true);
    expect(readFileSync('netlify.toml', 'utf8')).toMatch(/command\s*=\s*"[^"]*check:launch/);
  });
});
