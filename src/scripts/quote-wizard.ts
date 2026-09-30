import { composeLeadSummary } from '../lib/lead-summary';
import { validateContactStep, normalizePhone, isValidZip, isUtahZip } from '../lib/quote-validation';
import { makeLeadId, parseUtm, UTM_KEYS } from '../lib/lead-context';
import { lineById } from '../data/quote-lines';
import { armPartialCapture } from './quote-partial';

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

export function presetFromQuery(search: string): string {
  try {
    const id = new URLSearchParams(search).get('line') ?? '';
    return lineById(id) ? id : '';
  } catch {
    return '';
  }
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
  const preset = form.dataset.activeLine || presetFromQuery(window.location.search);
  let current = preset ? 2 : 1;
  if (preset && !form.dataset.activeLine) {
    const radio = form.querySelector<HTMLInputElement>(`input[name="coverage-line"][value="${preset}"]`);
    if (radio) radio.checked = true;
  }

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

  // A visitor who gave us a name and number and then left is a real lead.
  armPartialCapture(
    form,
    () => validateContactStep(collectValues(form) as Record<string, string>).length === 0,
    () => collectValues(form),
  );

  if (preset) applyLineSelection(form, preset);
  form.setAttribute('data-wizard-ready', '');
  show(current);
}
