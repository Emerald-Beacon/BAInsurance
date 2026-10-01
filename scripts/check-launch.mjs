// Blocks release while the CMS TPMO disclaimer still carries its placeholders.
// Kept out of `npm test` deliberately: a permanently-red suite is useless.
// While the counts are unfilled the Medicare line is hidden, so the gate also
// passes when no built page carries the disclaimer at all.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const page = 'dist/quote/medicare/index.html';

if (!existsSync('dist/quote/index.html')) {
  console.error('✗ dist/quote/index.html not found — run `npm run build` first.');
  process.exit(1);
}

const htmlFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? htmlFiles(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : [],
  );

const withDisclaimer = htmlFiles('dist').filter((f) => readFileSync(f, 'utf8').includes('data-tpmo'));

if (!existsSync(page) && withDisclaimer.length === 0) {
  console.log('✓ Medicare quote line is hidden; no page carries the TPMO disclaimer.');
  process.exit(0);
}

const html = withDisclaimer.map((f) => readFileSync(f, 'utf8')).join('\n');
const unresolved = ['[N]', '[M]'].filter((token) => html.includes(token));

if (unresolved.length) {
  console.error(
    `✗ LAUNCH BLOCKED: the TPMO disclaimer still contains ${unresolved.join(' and ')}.\n` +
    '  CMS requires the real count of organizations and products represented.\n' +
    '  Fill them in at src/data/tpmo.ts.',
  );
  process.exit(1);
}

console.log('✓ TPMO disclaimer resolved.');
