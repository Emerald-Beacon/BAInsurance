// Blocks release while the CMS TPMO disclaimer still carries its placeholders.
// Kept out of `npm test` deliberately: a permanently-red suite is useless.
import { readFileSync, existsSync } from 'node:fs';

const page = 'dist/quote/medicare/index.html';

if (!existsSync(page)) {
  console.error('✗ dist/quote/medicare/index.html not found — run `npm run build` first.');
  process.exit(1);
}

const html = readFileSync(page, 'utf8');
const unresolved = ['[N]', '[M]'].filter((token) => html.includes(token));

if (unresolved.length) {
  console.error(
    `✗ LAUNCH BLOCKED: the TPMO disclaimer still contains ${unresolved.join(' and ')}.\n` +
    '  CMS requires the real count of organizations and products represented.\n' +
    '  Fill them in at src/components/quote/TpmoDisclaimer.astro.',
  );
  process.exit(1);
}

console.log('✓ TPMO disclaimer resolved.');
