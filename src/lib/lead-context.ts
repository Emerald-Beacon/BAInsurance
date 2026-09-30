export const UTM_KEYS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
] as const;

export interface LeadContext {
  leadId: string;
  sourcePath: string;
  referrer: string;
  utm: Record<string, string>;
}

/**
 * Short, human-quotable id shared between a partial lead and its later
 * completion. crypto.randomUUID is unavailable over plain http and in older
 * Safari, and throwing here would take down the whole controller — including
 * the no-JS fallback — so every failure path lands on Math.random.
 */
export function makeLeadId(): string {
  try {
    const c = globalThis.crypto;
    if (c && typeof c.randomUUID === 'function') {
      return c.randomUUID().replace(/-/g, '').slice(0, 8);
    }
  } catch {
    // fall through
  }
  return Math.random().toString(36).slice(2, 10).padEnd(8, '0');
}

export function parseUtm(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const params = new URLSearchParams(search);
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) out[key] = value.slice(0, 200);
    }
  } catch {
    // a malformed query string yields no attribution, never an exception
  }
  return out;
}
