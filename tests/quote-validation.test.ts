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
    expect(isUtahZip('84010')).toBe(true);
    expect(isUtahZip('84001')).toBe(true);
    expect(isUtahZip('84791')).toBe(true);
  });

  it('rejects out-of-state ZIP codes', () => {
    expect(isUtahZip('83401')).toBe(false);
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
