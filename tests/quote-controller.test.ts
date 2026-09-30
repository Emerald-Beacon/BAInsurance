// @vitest-environment jsdom
// Drives the REAL controller against the REAL built HTML. The unit tests cover
// pure helpers; this file covers step navigation, which is where the defects were.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { initQuoteWizard } from '../src/scripts/quote-wizard';

const hasDist = existsSync('dist/quote/index.html');

function load(page: string): HTMLFormElement {
  const html = readFileSync(page, 'utf8');
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  document.body.innerHTML = parsed.body.innerHTML;
  const form = document.getElementById('quote-form') as HTMLFormElement;
  initQuoteWizard(form);
  return form;
}

const steps = (form: HTMLFormElement) =>
  Array.from(form.querySelectorAll<HTMLElement>('.quote-step[data-active]'))
    .map((s) => (s.dataset.line ? `${s.dataset.step}:${s.dataset.line}` : s.dataset.step!));

function pick(form: HTMLFormElement, line: string) {
  const radio = form.querySelector<HTMLInputElement>(`input[name="coverage-line"][value="${line}"]`)!;
  radio.checked = true;
  radio.dispatchEvent(new Event('change', { bubbles: true }));
}

function fillContact(form: HTMLFormElement) {
  const v: Record<string, string> = {
    'first-name': 'Jane', 'last-name': 'Smith', email: 'jane@example.com',
    phone: '8015550100', zip: '84010',
  };
  for (const [name, value] of Object.entries(v)) {
    form.querySelector<HTMLInputElement>(`[name="${name}"]`)!.value = value;
  }
}

describe.skipIf(!hasDist)('quote wizard on /quote/', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('starts on step 1 with nothing else revealed', () => {
    expect(steps(load('dist/quote/index.html'))).toEqual(['1']);
  });

  it('does not reveal the detail step when a line is picked at step 1', () => {
    const form = load('dist/quote/index.html');
    pick(form, 'commercial');
    expect(steps(form)).toEqual(['1']);
  });

  it('cannot skip the contact step via a prematurely revealed detail button', () => {
    const form = load('dist/quote/index.html');
    pick(form, 'commercial');
    form.querySelector<HTMLElement>('[data-line="commercial"] .quote-next')?.click();
    expect(steps(form)).not.toContain('4');
    expect(form.checkValidity()).toBe(false);
  });

  it('advances 1 -> 2 -> 3 -> 4 in order', () => {
    const form = load('dist/quote/index.html');
    pick(form, 'commercial');
    form.querySelector<HTMLElement>('.quote-step[data-step="1"] .quote-next')!.click();
    expect(steps(form)).toEqual(['2']);
    fillContact(form);
    form.querySelector<HTMLElement>('.quote-step[data-step="2"] .quote-next')!.click();
    expect(steps(form)).toEqual(['3:commercial']);
    form.querySelector<HTMLElement>('[data-line="commercial"] .quote-next')!.click();
    expect(steps(form)).toEqual(['4']);
  });

  it('does not steal focus or scroll on initial render', () => {
    load('dist/quote/index.html');
    expect(document.activeElement?.tagName).toBe('BODY');
  });

  it('does not report a QuoteStep before the visitor acts', () => {
    const fbq = vi.fn();
    (window as unknown as { fbq: unknown }).fbq = fbq;
    load('dist/quote/index.html');
    expect(fbq).not.toHaveBeenCalled();
    delete (window as unknown as { fbq?: unknown }).fbq;
  });
});

describe.skipIf(!hasDist)('quote wizard on a landing page', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('starts on the contact step with the line preset', () => {
    const form = load('dist/quote/boat/index.html');
    expect(steps(form)).toEqual(['2']);
    expect(form.dataset.activeLine).toBe('boat');
  });

  it('does not steal focus on initial render', () => {
    load('dist/quote/boat/index.html');
    expect(document.activeElement?.tagName).toBe('BODY');
  });
});

describe.skipIf(!hasDist)('consent and partial capture', () => {
  let bodies: Promise<string>[] = [];
  beforeEach(() => {
    document.body.innerHTML = '';
    bodies = [];
    (navigator as unknown as { sendBeacon: unknown }).sendBeacon = (_url: string, blob: Blob) => {
      bodies.push(blob.text());
      return true;
    };
  });
  // Every load() leaves a pagehide listener on window for the rest of the file, so
  // a call count proves nothing. Ask whether THIS form's lead reached the wire.
  const sentFor = async (leadId: string) =>
    (await Promise.all(bodies)).some((b) => b.includes(`lead-id=${leadId}`));
  const submit = (form: HTMLFormElement) =>
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

  it('records the consent timestamp as soon as the box is ticked', () => {
    const form = load('dist/quote/boat/index.html');
    const box = form.querySelector<HTMLInputElement>('#tcpa-consent')!;
    box.checked = true;
    box.dispatchEvent(new Event('change', { bubbles: true }));
    expect(form.querySelector<HTMLInputElement>('#ctx-consent-timestamp')!.value).not.toBe('');
    expect(form.querySelector<HTMLInputElement>('#ctx-consent-version')!.value).not.toBe('');
  });

  it('clears the consent record when the box is unticked again', () => {
    const form = load('dist/quote/boat/index.html');
    const box = form.querySelector<HTMLInputElement>('#tcpa-consent')!;
    box.checked = true;
    box.dispatchEvent(new Event('change', { bubbles: true }));
    box.checked = false;
    box.dispatchEvent(new Event('change', { bubbles: true }));
    expect(form.querySelector<HTMLInputElement>('#ctx-consent-timestamp')!.value).toBe('');
    expect(form.querySelector<HTMLInputElement>('#ctx-consent-version')!.value).toBe('');
  });

  it('still captures a partial after a submit blocked by the time floor', async () => {
    const form = load('dist/quote/boat/index.html');
    fillContact(form);
    const id = form.querySelector<HTMLInputElement>('#ctx-lead-id')!.value;
    submit(form); // within 3s of render -> blocked by the time floor
    window.dispatchEvent(new Event('pagehide'));
    expect(await sentFor(id)).toBe(true);
  });

  it('does not send a partial after a submission that actually went through', async () => {
    const form = load('dist/quote/boat/index.html');
    fillContact(form);
    const id = form.querySelector<HTMLInputElement>('#ctx-lead-id')!.value;
    form.querySelector<HTMLInputElement>('#ctx-render-time')!.value = String(Date.now() - 10_000);
    submit(form);
    window.dispatchEvent(new Event('pagehide'));
    expect(await sentFor(id)).toBe(false);
  });
});

describe.skipIf(!hasDist)('going back and knowing where you are', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('announces progress from the first step', () => {
    const form = load('dist/quote/index.html');
    expect(form.querySelector('#quote-progress')?.textContent).toMatch(/^Step 1 of \d$/);
  });

  it('offers no way back from the first step', () => {
    const form = load('dist/quote/index.html');
    const back = form.querySelector<HTMLElement>('.quote-step[data-step="1"] .quote-back');
    expect(back === null || back.hidden).toBe(true);
  });

  it('goes back from contact to coverage selection', () => {
    const form = load('dist/quote/index.html');
    pick(form, 'commercial');
    form.querySelector<HTMLElement>('.quote-step[data-step="1"] .quote-next')!.click();
    expect(steps(form)).toEqual(['2']);
    form.querySelector<HTMLElement>('.quote-step[data-step="2"] .quote-back')!.click();
    expect(steps(form)).toEqual(['1']);
  });

  it('lets a visitor who picked the wrong line change it', () => {
    const form = load('dist/quote/index.html');
    pick(form, 'home');
    form.querySelector<HTMLElement>('.quote-step[data-step="1"] .quote-next')!.click();
    form.querySelector<HTMLElement>('.quote-step[data-step="2"] .quote-back')!.click();
    pick(form, 'boat');
    form.querySelector<HTMLElement>('.quote-step[data-step="1"] .quote-next')!.click();
    fillContact(form);
    form.querySelector<HTMLElement>('.quote-step[data-step="2"] .quote-next')!.click();
    expect(steps(form)).toEqual(['3:boat']);
    expect(form.dataset.activeLine).toBe('boat');
  });

  it('skips the detail step going back when the line has no questions', () => {
    const form = load('dist/quote/index.html');
    pick(form, 'umbrella'); // hub-only line, no detail fields
    form.querySelector<HTMLElement>('.quote-step[data-step="1"] .quote-next')!.click();
    fillContact(form);
    form.querySelector<HTMLElement>('.quote-step[data-step="2"] .quote-next')!.click();
    expect(steps(form)).toEqual(['4']);
    form.querySelector<HTMLElement>('.quote-step[data-step="4"] .quote-back')!.click();
    expect(steps(form)).toEqual(['2']);
  });

  it('counts the detail step in progress only when the line has questions', () => {
    const form = load('dist/quote/index.html');
    const progress = () => form.querySelector('#quote-progress')!.textContent;
    pick(form, 'umbrella');
    form.querySelector<HTMLElement>('.quote-step[data-step="1"] .quote-next')!.click();
    expect(progress()).toBe('Step 2 of 3');
    form.querySelector<HTMLElement>('.quote-step[data-step="2"] .quote-back')!.click();
    pick(form, 'boat');
    form.querySelector<HTMLElement>('.quote-step[data-step="1"] .quote-next')!.click();
    expect(progress()).toBe('Step 2 of 4');
  });

  it('offers no way back from the contact step on a landing page', () => {
    const form = load('dist/quote/boat/index.html');
    expect(form.querySelector<HTMLElement>('.quote-step[data-step="2"] .quote-back')!.hidden).toBe(true);
  });
});
