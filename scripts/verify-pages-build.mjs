// Verifies a GitHub Pages production build before it is uploaded.
//   node scripts/verify-pages-build.mjs [dir=dist-pages] [base=$BASE_PATH or /mathquest-kids/]
// Fails (exit 1) with a clear list of problems if the output is not a deployable compiled site.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const dir = resolve(process.argv[2] ?? 'dist-pages');
let base = process.argv[3] ?? process.env.BASE_PATH ?? '/mathquest-kids/';
if (!base.startsWith('/')) base = '/' + base;
if (!base.endsWith('/')) base += '/';

const errors = [];
const notes = [];
const fail = m => errors.push(m);

if (!existsSync(dir)) { console.error(`✗ Build folder not found: ${dir}. Run "npm run build:pages" first.`); process.exit(1); }

const walk = d => readdirSync(d).flatMap(n => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(dir).map(p => relative(dir, p).split(sep).join('/'));
const has = f => files.includes(f);

// 1. Required files
for (const f of ['index.html', '404.html', 'sw.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/icon.svg']) {
  if (!has(f)) fail(`missing required file: ${f}`);
}
// 2. Must be compiled output, not raw source
const raw = files.filter(f => /\.(ts|tsx)$/.test(f) || f.startsWith('src/'));
if (raw.length) fail(`raw source files in the build: ${raw.join(', ')}`);
const maps = files.filter(f => f.endsWith('.map'));
if (maps.length) notes.push(`source maps present: ${maps.length}`);
if (!files.some(f => /^assets\/.+\.js$/.test(f))) fail('no compiled JavaScript bundle in assets/');
if (!files.some(f => /^assets\/.+\.css$/.test(f))) fail('no compiled CSS bundle in assets/');
if (!files.some(f => /^assets\/.+\.woff2$/.test(f))) fail('no bundled fonts (.woff2) in assets/');

// Resolve a URL used by the site to a file in the build (or report it).
function checkUrl(url, from) {
  if (/^(data:|blob:|#|mailto:)/.test(url)) return;
  if (/^[a-z]+:\/\//i.test(url) || url.startsWith('//')) { fail(`${from} references another origin: ${url}`); return; }
  const clean = url.split(/[?#]/)[0];
  let target;
  if (clean.startsWith('/')) {
    if (!clean.startsWith(base)) { fail(`${from} uses a root path outside ${base}: ${url} (would 404 on GitHub Pages)`); return; }
    target = clean.slice(base.length);
  } else {
    const fromDir = from.includes('/') ? from.slice(0, from.lastIndexOf('/') + 1) : '';
    target = new URL(clean, 'http://x/' + fromDir).pathname.slice(1);
  }
  if (target === '' ) target = 'index.html';
  if (!has(decodeURIComponent(target))) fail(`${from} references a missing file: ${url}`);
}

// 3. index.html references
if (has('index.html')) {
  const html = readFileSync(join(dir, 'index.html'), 'utf8');
  if (html.includes('/src/main.ts')) fail('index.html still points at /src/main.ts (not a production build)');
  const refs = [...html.matchAll(/<(?:script|link)\b[^>]*?\s(?:src|href)="([^"]+)"/g)].map(m => m[1]);
  if (!refs.length) fail('index.html has no script/link references');
  for (const r of refs) checkUrl(r, 'index.html');
  if (!/<link[^>]+rel="manifest"/.test(html)) fail('index.html has no <link rel="manifest">');
  notes.push(`index.html references: ${refs.length} (all checked)`);
}
// 4. CSS url() references (fonts, images)
for (const f of files.filter(f => f.endsWith('.css'))) {
  const css = readFileSync(join(dir, f), 'utf8');
  const urls = [...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map(m => m[1]);
  for (const u of urls) checkUrl(u, f);
  notes.push(`${f}: ${urls.length} url() references checked`);
}
// 5. Web app manifest
if (has('manifest.webmanifest')) {
  try {
    const m = JSON.parse(readFileSync(join(dir, 'manifest.webmanifest'), 'utf8'));
    if (m.start_url !== base) fail(`manifest start_url is "${m.start_url}", expected "${base}"`);
    if (m.scope !== base) fail(`manifest scope is "${m.scope}", expected "${base}"`);
    for (const i of m.icons ?? []) checkUrl(i.src, 'manifest.webmanifest');
    if (!(m.icons ?? []).length) fail('manifest has no icons');
  } catch (e) { fail(`manifest.webmanifest is not valid JSON: ${e.message}`); }
}
// 6. Service worker precache list
if (has('sw.js')) {
  const sw = readFileSync(join(dir, 'sw.js'), 'utf8');
  const entries = [...sw.matchAll(/url:"([^"]+)"/g)].map(m => m[1]);
  if (!entries.includes('index.html')) fail('service worker does not precache index.html');
  for (const e of entries) if (!has(e)) fail(`service worker precaches a missing file: ${e}`);
  if (entries.includes('404.html')) fail('service worker precaches 404.html (should be excluded)');
  const wb = files.filter(f => /^workbox-[\w-]+\.js$/.test(f));
  if (!wb.length) fail('workbox runtime file missing');
  notes.push(`service worker precaches ${entries.length} files (all present)`);
}
// 7. 404 page sends visitors back to the app
if (has('404.html')) {
  const nf = readFileSync(join(dir, '404.html'), 'utf8');
  if (!nf.includes(`url=${base}`)) fail(`404.html does not redirect to ${base}`);
}

const bytes = files.reduce((n, f) => n + statSync(join(dir, f)).size, 0);
console.log(`Pages build: ${dir}`);
console.log(`Base path:   ${base}`);
console.log(`Files:       ${files.length} (${(bytes / 1024).toFixed(0)} KiB)`);
for (const n of notes) console.log(`  · ${n}`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} problem(s) found:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\n✓ Build output verified: compiled site, correct base path, all referenced files present.');
