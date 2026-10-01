import type { Line } from '../data/quote-lines';

export interface SummaryInput {
  line: Line;
  values: Record<string, string | string[]>;
  consent: { given: boolean; timestamp?: string };
  context: { sourcePath: string; utm: Record<string, string>; leadId: string };
}

/** Arrays come from checkbox groups; a bare join keeps them legible. */
function render(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.filter((v) => v.trim()).join(', ');
  return (value ?? '').trim();
}

export function composeLeadSummary({ line, values, consent, context }: SummaryInput): string {
  const get = (name: string) => render(values[name]);
  const blocks: string[] = [];

  const name = `${get('first-name')} ${get('last-name')}`.trim();
  const header = [`${line.label.toUpperCase()} — ${name} — ${get('zip')}`];
  header.push(
    consent.given
      ? `☑ Consented to phone/text ${consent.timestamp ?? 'timestamp unavailable'}`
      : '⚠ EMAIL ONLY — no phone/text consent',
  );
  blocks.push(header.join('\n'));

  const prefs = [get('contact-method'), get('best-time')].filter(Boolean).join(', ');
  const contact = [get('phone'), get('email')].filter(Boolean).join(' · ');
  blocks.push(prefs ? `${contact} · prefers ${prefs}` : contact);

  const detail = line.fields
    .map((field) => {
      const value = get(field.name);
      return value ? `${field.label}: ${value.replace(/\n+/g, ' / ')}` : '';
    })
    .filter(Boolean);
  if (detail.length) blocks.push(detail.join('\n'));

  const notes = get('notes');
  if (notes) blocks.push(`"${notes.replace(/\n+/g, '\n')}"`);

  const heard = get('heard-about-us');
  if (heard) blocks.push(`Heard about us: ${heard}`);

  const attribution = ['utm_source', 'utm_medium', 'utm_campaign']
    .map((k) => context.utm[k])
    .filter(Boolean)
    .join(' / ');
  blocks.push(
    [
      `Source: ${context.sourcePath}${attribution ? ` · ${attribution}` : ''}`,
      `Lead ID: ${context.leadId}`,
    ].join('\n'),
  );

  return blocks.filter(Boolean).join('\n\n');
}
