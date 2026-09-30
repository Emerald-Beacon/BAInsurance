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
