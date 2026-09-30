const EXCLUDED = new Set(['form-name', 'bot-field', 'lead-summary']);

export function buildPartialBody(
  values: Record<string, string | string[]>,
  leadId: string,
): string {
  const params = new URLSearchParams();
  params.set('form-name', 'quote-partial');
  params.set('lead-id', leadId);
  for (const [key, raw] of Object.entries(values)) {
    if (EXCLUDED.has(key) || key === 'lead-id') continue;
    const value = Array.isArray(raw) ? raw.filter((v) => v.trim()).join(', ') : raw;
    if (value && value.trim()) params.set(key, value);
  }
  return params.toString();
}

/**
 * Fires once, when the page goes away with a usable contact block that was
 * never submitted. Netlify accepts a urlencoded POST to any path so long as
 * form-name names a registered form.
 */
export function armPartialCapture(
  form: HTMLFormElement,
  isReady: () => boolean,
  collect: () => Record<string, string | string[]>,
): void {
  let sent = false;

  const send = () => {
    if (sent || !isReady()) return;
    sent = true;
    const leadId = form.querySelector<HTMLInputElement>('#ctx-lead-id')?.value ?? '';
    const body = buildPartialBody(collect(), leadId);
    const blob = new Blob([body], { type: 'application/x-www-form-urlencoded' });
    if (typeof navigator.sendBeacon === 'function') navigator.sendBeacon('/', blob);
  };

  form.addEventListener('submit', () => { sent = true; });
  window.addEventListener('pagehide', send);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') send();
  });
}
