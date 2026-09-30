export interface FieldError {
  name: string;
  message: string;
}

function digitsOf(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

export function normalizePhone(raw: string): string {
  const ten = digitsOf(raw);
  if (ten.length !== 10) return raw.trim();
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

export function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip.trim());
}

/** Utah ZIP codes run 84001–84791. Used for a soft note, never to reject. */
export function isUtahZip(zip: string): boolean {
  if (!isValidZip(zip)) return false;
  const n = Number(zip.trim());
  return n >= 84001 && n <= 84791;
}

const REQUIRED: { name: string; label: string }[] = [
  { name: 'first-name', label: 'first name' },
  { name: 'last-name', label: 'last name' },
  { name: 'email', label: 'email address' },
  { name: 'phone', label: 'phone number' },
  { name: 'zip', label: 'ZIP code' },
];

export function validateContactStep(values: Record<string, string>): FieldError[] {
  const errors: FieldError[] = [];

  for (const { name, label } of REQUIRED) {
    if (!(values[name] ?? '').trim()) {
      errors.push({ name, message: `Please enter your ${label}.` });
    }
  }

  const named = new Set(errors.map((e) => e.name));

  const email = (values.email ?? '').trim();
  if (email && !named.has('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ name: 'email', message: 'That email address does not look right.' });
  }

  const phone = (values.phone ?? '').trim();
  if (phone && !named.has('phone') && digitsOf(phone).length !== 10) {
    errors.push({ name: 'phone', message: 'Please enter a 10-digit phone number.' });
  }

  const zip = (values.zip ?? '').trim();
  if (zip && !named.has('zip') && !isValidZip(zip)) {
    errors.push({ name: 'zip', message: 'Please enter a 5-digit ZIP code.' });
  }

  return errors;
}
