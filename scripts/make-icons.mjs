// Generates ORIGINAL app icons/splash (no emoji or third-party art) from SVG using sharp.
// Outputs: public/icons/*.png (PWA) and resources/{icon,icon-foreground,icon-background,splash,splash-dark}.png (Capacitor Assets)
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
mkdirSync(resolve(root, 'public/icons'), { recursive: true });
mkdirSync(resolve(root, 'resources'), { recursive: true });

const tile = (x, y, fill, sym) => `
  <rect x="${x}" y="${y}" width="250" height="250" rx="58" fill="${fill}"/>
  <text x="${x + 125}" y="${y + 178}" text-anchor="middle" font-family="Arial Rounded MT Bold, Arial, Helvetica, sans-serif" font-size="200" font-weight="900" fill="#FFFFFF">${sym}</text>`;
const symbols = (ox = 0, oy = 0, s = 1) => `<g transform="translate(${ox} ${oy}) scale(${s})">
  ${tile(232, 232, '#0B6FAD', '+')}${tile(542, 232, '#B83434', '−')}${tile(232, 542, '#1A7F45', '×')}${tile(542, 542, '#5F44CC', '÷')}</g>`;
const bg = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC53D"/><stop offset="1" stop-color="#FF6B6B"/></linearGradient></defs>`;

const full = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${bg}
  <rect width="1024" height="1024" rx="220" fill="url(#g)"/><circle cx="512" cy="512" r="400" fill="#FFFFFF" opacity="0.95"/>${symbols()}</svg>`;
const square = full.replace('rx="220"', 'rx="0"'); // stores apply their own masks
const foreground = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><circle cx="512" cy="512" r="300" fill="#FFFFFF"/>${symbols(128, 128, 0.75)}</svg>`;
const background = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${bg}<rect width="1024" height="1024" fill="url(#g)"/></svg>`;
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${bg}<rect width="1024" height="1024" fill="url(#g)"/><circle cx="512" cy="512" r="330" fill="#FFFFFF"/>${symbols(154, 154, 0.7)}</svg>`;
const splash = (dark) => `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732"><rect width="2732" height="2732" fill="${dark ? '#1B2156' : '#EAF8FF'}"/><g transform="translate(966 966) scale(0.78)">${full.replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</g></svg>`;

const out = async (svg, file, size) => { await sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(resolve(root, file)); console.log('wrote', file); };
await out(full, 'public/icons/icon-192.png', 192);
await out(full, 'public/icons/icon-512.png', 512);
await out(maskable, 'public/icons/icon-maskable-512.png', 512);
await out(square, 'resources/icon.png', 1024);
await out(foreground, 'resources/icon-foreground.png', 1024);
await out(background, 'resources/icon-background.png', 1024);
await out(splash(false), 'resources/splash.png', 2732);
await out(splash(true), 'resources/splash-dark.png', 2732);
writeFileSync(resolve(root, 'public/icons/icon.svg'), full);
console.log('done');
