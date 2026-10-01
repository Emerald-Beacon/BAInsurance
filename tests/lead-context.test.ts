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
