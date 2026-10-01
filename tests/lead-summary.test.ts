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
    expect(out).not.toContain('Coverage needed');
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
