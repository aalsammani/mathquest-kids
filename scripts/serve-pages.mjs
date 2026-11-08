// Minimal static server that behaves like GitHub Pages for a project site, for local testing.
//   node scripts/serve-pages.mjs [dir=dist-pages] [base=/mathquest-kids/] [port=4175]
// - Files are served only under <base>; "<base>" without the trailing slash redirects (301), like Pages.
// - Directories serve index.html. There is NO single-page-app fallback: unknown paths get
//   <dir>/404.html with HTTP status 404, exactly as GitHub Pages does.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

const dir = resolve(process.argv[2] ?? 'dist-pages');
let base = process.argv[3] ?? process.env.BASE_PATH ?? '/mathquest-kids/';
if (!base.startsWith('/')) base = '/' + base;
if (!base.endsWith('/')) base += '/';
const port = Number(process.argv[4] ?? 4175);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8', '.map': 'application/json',
};

async function fileAt(p) {
  try { const s = await stat(p); if (s.isFile()) return p; if (s.isDirectory()) { const i = join(p, 'index.html'); if ((await stat(i)).isFile()) return i; } } catch { /* missing */ }
  return null;
}

async function notFound(res) {
  try { const body = await readFile(join(dir, '404.html')); res.writeHead(404, { 'content-type': TYPES['.html'] }); res.end(body); }
  catch { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('404 Not Found'); }
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let path;
  try { path = decodeURIComponent(url.pathname); } catch { return notFound(res); }
  if (path === base.slice(0, -1)) { res.writeHead(301, { location: base + url.search }); return res.end(); }
  if (!path.startsWith(base)) return notFound(res);
  const target = normalize(join(dir, path.slice(base.length)));
  if (target !== dir && !target.startsWith(dir + sep)) return notFound(res);
  const file = await fileAt(target);
  if (!file) return notFound(res);
  const body = await readFile(file);
  res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'max-age=600' });
  res.end(req.method === 'HEAD' ? undefined : body);
}).listen(port, () => console.log(`Serving ${dir} at http://localhost:${port}${base}`));
