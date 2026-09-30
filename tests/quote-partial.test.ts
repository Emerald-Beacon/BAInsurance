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
