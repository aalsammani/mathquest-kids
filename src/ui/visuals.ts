/**
 * Mathematical visuals rendered programmatically (SVG/DOM) so quantities are exact
 * at every screen size. Every visual has a text alternative (role="img" + aria-label).
 */
import { fractionWords } from '../core/text';
import type { ShapeName, VisualSpec } from '../core/types';
import { esc, h, svg } from './dom';

const INK = '#2D3561';

export function renderVisual(v: VisualSpec | undefined): HTMLElement | null {
  if (!v) return null;
  const el = build(v);
  return el;
}

function img(el: HTMLElement, label: string): HTMLElement { el.setAttribute('role', 'img'); el.setAttribute('aria-label', label); return el; }
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function counters(emoji: string, count: number, cross = 0, label = 'objects'): HTMLElement {
  const wrap = h('div', { class: 'counters-wrap', style: 'display:flex;flex-wrap:wrap;justify-content:center;max-width:420px' });
  for (let i = 0; i < count; i++) {
    const c = h('span', { class: 'counter' + (cross && i >= count - cross ? ' crossed' : ''), 'aria-hidden': 'true' }, emoji);
    c.style.animationDelay = `${i * 0.04}s`;
    // visual grouping in fives (subitizing support)
    if (i % 5 === 4 && i < count - 1) c.style.marginRight = '12px';
    wrap.append(c);
  }
  return img(wrap, `${count} ${label}${cross ? `, ${cross} crossed out, ${count - cross} left` : ''}`);
}

const SHAPES: Record<ShapeName, string> = {
  circle: '<circle cx="60" cy="60" r="46"/>',
  oval: '<ellipse cx="60" cy="60" rx="52" ry="32"/>',
  triangle: '<polygon points="60,14 108,102 12,102"/>',
  square: '<rect x="18" y="18" width="84" height="84"/>',
  rectangle: '<rect x="6" y="34" width="108" height="52"/>',
  // ≈ 64°/116° angles: clearly NOT a square
  rhombus: '<polygon points="60,28 112,60 60,92 8,60"/>', // diagonals 104 & 64 → angles ≈ 63° and 117°
  trapezoid: '<polygon points="36,30 84,30 112,94 8,94"/>',
  pentagon: '<polygon points="60,10 108,45 90,104 30,104 12,45"/>',
  hexagon: '<polygon points="34,14 86,14 112,60 86,106 34,106 8,60"/>',
  octagon: '<polygon points="40,10 80,10 110,40 110,80 80,110 40,110 10,80 10,40"/>',
};
const FILL: Record<ShapeName, string> = { circle: '#FF6B6B', oval: '#FF7BAC', triangle: '#35C26B', square: '#3FB4F6', rectangle: '#8B6FF0', rhombus: '#FFC53D', trapezoid: '#3FB4F6', pentagon: '#FF6B6B', hexagon: '#35C26B', octagon: '#8B6FF0' };

function numberline(v: Extract<VisualSpec, { kind: 'numberline' }>): HTMLElement {
  const d = v.denom ?? 1;
  const ticks = (v.max - v.min) * d;
  const W = 600, H = 110, x0 = 30, xw = W - 60, y = 70;
  const x = (num: number, den = 1) => x0 + ((num / den - v.min) / (v.max - v.min)) * xw;
  const labelEvery = v.labelEvery ?? 1;
  let s = `<svg class="numline" viewBox="0 0 ${W} ${H}" aria-hidden="true">`;
  s += `<line x1="${x0 - 10}" y1="${y}" x2="${x0 + xw + 10}" y2="${y}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  for (let i = 0; i <= ticks; i++) {
    const val = v.min * d + i;
    const major = d > 1 ? val % d === 0 : (val - v.min) % labelEvery === 0;
    const px = x(val, d);
    s += `<line x1="${px}" y1="${y - (major ? 11 : 7)}" x2="${px}" y2="${y + (major ? 11 : 7)}" stroke="${INK}" stroke-width="${major ? 3 : 2}"/>`;
    const showLabel = d > 1 ? val % (labelEvery) === 0 : (val - v.min) % labelEvery === 0;
    if (showLabel) s += `<text x="${px}" y="${y + 32}" text-anchor="middle" font-size="15" font-weight="800" fill="#4F5986" font-family="Nunito">${d > 1 ? val / d : val}</text>`;
  }
  for (const hp of v.hops ?? []) {
    const step = hp.size ?? 1;
    const dir = hp.to >= hp.from ? 1 : -1;
    for (let a = hp.from; a !== hp.to; a += dir * step) {
      const b = a + dir * step;
      const ax = x(a), bx = x(b), mid = (ax + bx) / 2;
      s += `<path d="M ${ax} ${y - 5} Q ${mid} ${y - 40} ${bx} ${y - 5}" fill="none" stroke="${dir > 0 ? '#1A7F45' : '#B83434'}" stroke-width="3" stroke-linecap="round" marker-end="url(#ah)"/>`;
    }
  }
  for (const m of v.marks ?? []) {
    const px = x(m.value[0], m.value[1]);
    s += `<circle cx="${px}" cy="${y}" r="9" fill="#E14D4D" stroke="#fff" stroke-width="3"/>`;
    if (m.label) s += `<text x="${px}" y="${y - 18}" text-anchor="middle" font-size="15" font-weight="900" fill="${INK}" font-family="Nunito">${esc(m.label)}</text>`;
  }
  s += `<defs><marker id="ah" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${INK}"/></marker></defs></svg>`;
  const wrap = h('div', { style: 'width:100%;max-width:600px' });
  wrap.append(svg(s));
  const desc = v.aria ?? `A number line from ${v.min} to ${v.max}${d > 1 ? `, cut into ${d} equal parts between whole numbers` : ''}${v.marks?.length ? ', with a dot marked' : ''}${v.hops?.length ? ', with hops' : ''}`;
  return img(wrap, desc);
}

function fraccircle(den: number, num: number, size = 200): HTMLElement {
  const C = 100, R = 88;
  let s = `<svg viewBox="0 0 200 200" width="${size}" aria-hidden="true">`;
  if (den === 1) s += `<circle cx="${C}" cy="${C}" r="${R}" fill="${num ? '#3FB4F6' : '#F2F5FC'}" stroke="${INK}" stroke-width="4"/>`;
  for (let i = 0; i < den && den > 1; i++) {
    // exact equal sectors: each spans 360/den degrees
    const a0 = (i / den) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / den) * 2 * Math.PI - Math.PI / 2;
    const p0 = [C + R * Math.cos(a0), C + R * Math.sin(a0)], p1 = [C + R * Math.cos(a1), C + R * Math.sin(a1)];
    const large = 1 / den > 0.5 ? 1 : 0;
    s += `<path d="M ${C} ${C} L ${p0[0]!.toFixed(2)} ${p0[1]!.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${p1[0]!.toFixed(2)} ${p1[1]!.toFixed(2)} Z" fill="${i < num ? 'url(#stripe)' : '#F2F5FC'}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  }
  s += `<defs><pattern id="stripe" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="#3FB4F6"/><rect width="6" height="12" fill="#1F97DD"/></pattern></defs></svg>`;
  const w = h('div', { class: 'frac-circle' });
  w.append(svg(s));
  return img(w, `A circle cut into ${den} equal parts with ${num} shaded`);
}

function fracbar(den: number, num: number, widths?: number[], label?: string): HTMLElement {
  const wrap = h('div', { style: 'text-align:center;width:100%;display:flex;flex-direction:column;align-items:center' });
  const bar = h('div', { class: 'fracbar' });
  const tot = widths ? widths.reduce((a, b) => a + b, 0) : den;
  for (let i = 0; i < den; i++) {
    const part = h('i', { class: i < num ? 'fill' : 'empty' });
    part.style.flex = `${widths ? widths[i] : 1} 1 0`;
    bar.append(part);
  }
  void tot;
  wrap.append(bar);
  if (label) wrap.append(h('div', { class: 'fraclabel', text: label }));
  const equal = !widths || widths.every(w => w === widths[0]);
  return img(wrap, `A bar cut into ${den} ${equal ? 'equal' : 'unequal'} parts with ${num} shaded`);
}

function bargraph(v: Extract<VisualSpec, { kind: 'bargraph' }>): HTMLElement {
  const maxV = Math.max(...v.data.map(d => d.val));
  const lines = Math.max(4, Math.ceil(maxV / v.scale));
  const W = 480, H = 260, left = 46, bottom = 56, top = 30, plotH = H - bottom - top;
  const bw = Math.min(70, (W - left - 20) / v.data.length - 20);
  const yv = (val: number) => H - bottom - (val / (lines * v.scale)) * plotH;
  let s = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:500px" aria-hidden="true">`;
  s += `<text x="${W / 2}" y="18" text-anchor="middle" font-size="15" font-weight="900" fill="${INK}" font-family="Nunito">${esc(v.title)}</text>`;
  for (let i = 0; i <= lines; i++) {
    const yy = yv(i * v.scale);
    s += `<line x1="${left}" y1="${yy}" x2="${W - 10}" y2="${yy}" stroke="${i === 0 ? INK : '#D5DBEE'}" stroke-width="${i === 0 ? 3 : 1.5}"/>`;
    s += `<text x="${left - 8}" y="${yy + 5}" text-anchor="end" font-size="13" font-weight="800" fill="#4F5986" font-family="Nunito">${i * v.scale}</text>`;
  }
  const colors = ['#3FB4F6', '#FF6B6B', '#35C26B', '#FFC53D', '#8B6FF0'];
  v.data.forEach((d, i) => {
    const xx = left + 20 + i * ((W - left - 30) / v.data.length);
    const yy = yv(d.val);
    s += `<rect x="${xx}" y="${yy}" width="${bw}" height="${H - bottom - yy}" rx="6" fill="${colors[i % colors.length]}" stroke="${INK}" stroke-width="2.5"/>`;
    if (v.scale === 1) s += `<text x="${xx + bw / 2}" y="${yy - 6}" text-anchor="middle" font-size="15" font-weight="900" fill="${INK}" font-family="Nunito">${d.val}</text>`;
    s += `<text x="${xx + bw / 2}" y="${H - bottom + 24}" text-anchor="middle" font-size="20">${d.emoji}</text>`;
    s += `<text x="${xx + bw / 2}" y="${H - bottom + 44}" text-anchor="middle" font-size="12" font-weight="900" fill="#4F5986" font-family="Nunito">${esc(d.label)}</text>`;
  });
  s += '</svg>';
  const w = h('div', { style: 'width:100%;display:flex;justify-content:center' });
  w.append(svg(s));
  const desc = `Bar graph titled ${v.title}${v.scale > 1 ? `, each grid line is ${v.scale}` : ''}: ${v.data.map(d => `${d.label} ${d.val}`).join(', ')}`;
  return img(w, desc);
}

function clock(hh: number, mm: number, size = 210): HTMLElement {
  const C = 100;
  const pt = (deg: number, r: number) => [C + r * Math.cos(((deg - 90) * Math.PI) / 180), C + r * Math.sin(((deg - 90) * Math.PI) / 180)] as const;
  let s = `<svg class="clock-svg" viewBox="0 0 200 200" width="${size}" aria-hidden="true"><circle cx="${C}" cy="${C}" r="92" fill="#fff" stroke="${INK}" stroke-width="8"/>`;
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    const [x1, y1] = pt(i * 6, major ? 79 : 84), [x2, y2] = pt(i * 6, 88);
    s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${major ? INK : '#9AA3C4'}" stroke-width="${major ? 3 : 1.5}" stroke-linecap="round"/>`;
  }
  for (let n = 1; n <= 12; n++) { const [x, y] = pt(n * 30, 66); s += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Baloo 2, Nunito, sans-serif" font-weight="700" font-size="17" fill="${INK}">${n}</text>`; }
  const hourDeg = (hh % 12) * 30 + mm * 0.5, minDeg = mm * 6;
  const [hx, hy] = pt(hourDeg, 38), [hx0, hy0] = pt(hourDeg + 180, 10), [mx, my] = pt(minDeg, 56), [mx0, my0] = pt(minDeg + 180, 12);
  s += `<line x1="${hx0.toFixed(1)}" y1="${hy0.toFixed(1)}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`;
  s += `<line x1="${mx0.toFixed(1)}" y1="${my0.toFixed(1)}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#0B6FAD" stroke-width="4.5" stroke-linecap="round"/>`;
  s += `<circle cx="${C}" cy="${C}" r="6.5" fill="#E14D4D" stroke="#fff" stroke-width="2.5"/></svg>`;
  const w = h('div');
  w.append(svg(s));
  return img(w, `An analog clock. The short hour hand is ${mm === 0 ? 'on' : 'just past'} the ${hh}. The long minute hand points to ${mm === 0 ? 'the 12' : mm % 5 === 0 ? `the ${mm / 5}` : `${mm} minutes past the hour`}.`);
}

function build(v: VisualSpec): HTMLElement {
  switch (v.kind) {
    case 'counters': return counters(v.emoji, v.count, v.cross, v.label);
    case 'twoGroups': {
      const w = h('div', { style: 'display:flex;align-items:center;flex-wrap:wrap;justify-content:center' }, counters(v.e1, v.n1, 0, v.label), h('span', { class: 'group-plus', 'aria-hidden': 'true' }, '+'), counters(v.e2, v.n2, 0, v.label));
      return img(w, `A group of ${v.n1} and a group of ${v.n2} ${v.label}`);
    }
    case 'tenframe': {
      const total = v.a + (v.b ?? 0);
      const w = h('div', { style: 'display:flex;gap:14px;flex-wrap:wrap;justify-content:center' });
      for (let f = 0; f < (total > 10 ? 2 : 1); f++) {
        const tf = h('div', { class: 'tenframe', 'aria-hidden': 'true' });
        for (let i = 0; i < 10; i++) { const idx = f * 10 + i; tf.append(h('span', { class: idx < v.a ? 'dot' : idx < total ? 'dot alt' : '' })); }
        w.append(tf);
      }
      return img(w, v.b ? `Ten frame: ${plural(v.a, 'solid blue dot', 'solid blue dots')} and ${plural(v.b, 'striped ring', 'striped rings')}` : `Ten frame${total > 10 ? 's' : ''} with ${plural(total, 'dot', 'dots')}`);
    }
    case 'numberline': return numberline(v);
    case 'placevalue': {
      const w = h('div', { class: 'pv-wrap', 'aria-hidden': 'true' });
      const col = (label: string, count: number, cls: string, txt?: string) => {
        const row = h('div', { class: 'pv-row' });
        for (let i = 0; i < count; i++) row.append(h('span', { class: cls }, txt ?? ''));
        return h('div', { class: 'pv-col' }, h('div', { class: 'pv-label', text: label }), row, h('div', { class: 'pv-num', text: String(count) }));
      };
      if (v.h) w.append(col('HUNDREDS', v.h, 'pv-hundred', '100'));
      w.append(col('TENS', v.t, 'pv-ten'), col('ONES', v.o, 'pv-one'));
      const outer = h('div');
      outer.append(w);
      return img(outer, `Base-ten blocks: ${v.h ? plural(v.h, 'hundred', 'hundreds') + ', ' : ''}${plural(v.t, 'ten', 'tens')} and ${plural(v.o, 'one', 'ones')}`);
    }
    case 'clock': return clock(v.h, v.m);
    case 'coins': {
      const names = { penny: '1¢', nickel: '5¢', dime: '10¢', quarter: '25¢' };
      const w = h('div', { style: 'display:flex;flex-wrap:wrap;justify-content:center;align-items:center', 'aria-hidden': 'false' });
      v.list.forEach(k => w.append(h('span', { class: `coin ${k}`, 'aria-hidden': 'true' }, names[k])));
      return img(w, `Coins: ${v.list.join(', ')}`);
    }
    case 'fracbar': return fracbar(v.den, v.num, v.widths, v.label);
    case 'fraccircle': return fraccircle(v.den, v.num);
    case 'fracstack': {
      const w = h('div', { class: 'fracstack' });
      v.fracs.forEach(([n, d]) => w.append(h('div', { class: 'fs-row' }, h('span', { class: 'fs-lab', 'aria-hidden': 'true' }, n === 0 ? `?/${d}` : `${n}/${d}`), fracbar(d, n))));
      return img(w, `Bars of the same length: ${v.fracs.map(([n, d]) => (n === 0 ? `one cut into ${d} equal parts` : fractionWords(n, d))).join('; ')}`);
    }
    case 'array': {
      const g = h('div', { class: 'array-grid', 'aria-hidden': 'true' });
      g.style.gridTemplateColumns = `repeat(${v.cols}, auto)`;
      for (let i = 0; i < v.rows * v.cols; i++) g.append(h('span', {}, v.emoji));
      const w = h('div'); w.append(g);
      return img(w, `An array: ${plural(v.rows, 'row', 'rows')} with ${v.cols} in each row`);
    }
    case 'divgroups': {
      const w = h('div', { class: 'div-groups', 'aria-hidden': 'true' });
      for (let i = 0; i < v.groups; i++) {
        const box = h('div', { class: 'div-group' + (v.mystery ? ' mystery' : '') });
        if (v.mystery) box.textContent = '?';
        else for (let j = 0; j < v.per; j++) box.append(h('span', {}, v.emoji));
        w.append(box);
      }
      const o = h('div'); o.append(w);
      return img(o, v.mystery ? `${v.groups} empty groups to share into` : `${v.groups} groups with ${v.per} in each group`);
    }
    case 'ruler': {
      const start = v.start ?? 0;
      const units = 10;
      const w = h('div', { class: 'ruler-wrap' });
      const objRow = h('div', { style: 'display:flex' });
      const pad = h('div'); pad.style.width = `${(start / units) * 100}%`;
      const obj = h('div', { class: 'ruler-obj', text: v.name }); obj.style.width = `${(v.len / units) * 100}%`;
      objRow.append(pad, obj);
      const r = h('div', { class: 'ruler', 'aria-hidden': 'true' });
      for (let i = 0; i < units; i++) r.append(h('i', { 'data-n': String(i) }));
      w.append(objRow, r, h('div', { class: 'area-cap', text: `Each space on the ruler is 1 ${v.unit === 'inches' ? 'inch' : 'centimeter'}.` }));
      return img(w, `A ${v.name} lying along a ruler marked in ${v.unit}, from ${start} to ${start + v.len}`);
    }
    case 'lengthpair': {
      const w = h('div', { style: 'width:100%;max-width:520px' });
      ([['A', v.a, 'linear-gradient(145deg,#0B6FAD,#08527F)'], ['B', v.b, 'linear-gradient(145deg,#B83434,#8A2525)']] as const).forEach(([lab, len, bg]) => {
        const bar = h('div', { class: 'ruler-obj', text: `${v.name.charAt(0).toUpperCase() + v.name.slice(1)} ${lab}` });
        bar.style.width = `${len * 10}%`; bar.style.background = bg;
        w.append(h('div', { style: 'margin:8px 0;border-left:4px solid #2D3561;padding-left:2px' }, bar));
      });
      return img(w, `Two ${v.name}s lined up at the left: ${v.name} A is ${v.a > v.b ? 'longer' : 'shorter'} than ${v.name} B`);
    }
    case 'areagrid': {
      const w = h('div', { style: 'text-align:center' });
      if (v.showGrid) {
        const g = h('div', { class: 'area-grid', 'aria-hidden': 'true' });
        g.style.gridTemplateColumns = `repeat(${v.w}, auto)`; g.style.display = 'inline-grid';
        for (let i = 0; i < v.w * v.h; i++) g.append(h('i'));
        w.append(g, h('div', { class: 'area-cap', text: `${v.w} ${v.unitName}s wide · ${v.h} ${v.unitName}s tall · each small square is 1 square ${v.unitName}` }));
      } else {
        const W = 300, H = Math.max(80, Math.min(200, (v.h / v.w) * 300));
        w.append(svg(`<svg viewBox="-40 -30 ${W + 80} ${H + 60}" style="width:min(100%,360px)" aria-hidden="true"><rect x="0" y="0" width="${W}" height="${H}" fill="#BFE7CF" stroke="${INK}" stroke-width="4"/><text x="${W / 2}" y="-8" text-anchor="middle" font-size="18" font-weight="900" fill="${INK}" font-family="Nunito">${v.w} ${v.unitName}s</text><text x="${W / 2}" y="${H + 24}" text-anchor="middle" font-size="18" font-weight="900" fill="${INK}" font-family="Nunito">${v.w} ${v.unitName}s</text><text x="-8" y="${H / 2 + 6}" text-anchor="end" font-size="18" font-weight="900" fill="${INK}" font-family="Nunito">${v.h}</text><text x="${W + 8}" y="${H / 2 + 6}" font-size="18" font-weight="900" fill="${INK}" font-family="Nunito">${v.h}</text></svg>`));
      }
      return img(w, `A rectangle ${v.w} ${v.unitName}s long and ${v.h} ${v.unitName}s wide${v.showGrid ? ', covered by unit squares' : ''}`);
    }
    case 'pattern': {
      const w = h('div', { class: 'pattern-seq', 'aria-hidden': 'true' });
      v.seq.forEach(it => w.append(it === '?' ? h('span', { class: 'pq' }, '?') : h('span', { class: 'pi' }, it)));
      const o = h('div'); o.append(w);
      return img(o, `A pattern: ${v.seq.map(x => (x === '?' ? 'blank' : x)).join(', ')}`);
    }
    case 'posgrid': {
      const g = h('div', { class: 'pos-grid', 'aria-hidden': 'true' });
      v.cells.forEach(c => g.append(h('span', {}, c)));
      const o = h('div'); o.append(g);
      return img(o, v.aria);
    }
    case 'sizepair': {
      const w = h('div', { class: 'size-pair', 'aria-hidden': 'true' });
      ([['A', v.a, 'a'], ['B', v.b, 'b']] as const).forEach(([lab, size, cls]) => {
        const ball = h('div', { class: `size-ball ${cls}` }); ball.style.width = `${size}px`; ball.style.height = `${size}px`;
        w.append(h('div', { class: 'size-item' }, ball, h('div', { class: 'size-lab', text: `Ball ${lab}` })));
      });
      const o = h('div'); o.append(w);
      return img(o, `Two balls: ball A is ${v.a > v.b ? 'bigger' : 'smaller'} than ball B`);
    }
    case 'shape': {
      const d = h('div', { class: 'shape-svg' });
      d.append(svg(`<svg viewBox="0 0 120 120" width="130" height="130" aria-hidden="true"><g transform="rotate(${v.rotate ?? 0} 60 60)" fill="${FILL[v.name]}" stroke="${INK}" stroke-width="5" stroke-linejoin="round">${SHAPES[v.name]}</g></svg>`));
      return img(d, 'A shape to identify');
    }
    case 'glyph': return img(h('div', { class: 'big-glyph', text: v.text }), v.aria);
    case 'bond': {
      const d = h('div', { class: 'bond' });
      d.append(svg(`<svg viewBox="0 0 250 170" aria-hidden="true"><line x1="110" y1="70" x2="70" y2="102" stroke="${INK}" stroke-width="4"/><line x1="140" y1="70" x2="180" y2="102" stroke="${INK}" stroke-width="4"/></svg>`),
        h('div', { class: 'b-big', text: String(v.total) }), h('div', { class: 'b-sm b-l', text: String(v.left) }), h('div', { class: 'b-sm b-r', text: String(v.right) }));
      return img(d, `A number bond: whole ${v.total}, parts ${v.left} and ${v.right}`);
    }
    case 'compareGroups': {
      const w = h('div', { class: 'compare-groups' });
      v.boxes.forEach(b => w.append(img(h('div', { class: 'cmp-box' }, h('div', { class: 'cmp-items', 'aria-hidden': 'true' }, b.emoji.repeat(b.n)), h('div', { class: 'cmp-name', text: b.name })), `${b.n} ${b.name}`)));
      return w;
    }
    case 'compareBars': {
      const w = h('div', { class: 'compare-bars' });
      const min = Math.min(...v.rows.map(r => r.n));
      v.rows.forEach(r => {
        const items = h('div', { class: 'cb-items', 'aria-hidden': 'true' });
        for (let i = 0; i < r.n; i++) items.append(h('span', { class: i >= min ? 'extra' : '' }, r.emoji));
        w.append(h('div', { class: 'cb-row' }, h('span', { class: 'cb-lab', text: r.label }), items));
      });
      return img(w, `Comparing: ${v.rows.map(r => `${r.label} has ${r.n}`).join(', ')}. The extra ones are outlined.`);
    }
    case 'sortrow': return img(h('div', { class: 'sort-row', text: v.items.join(' ') }), v.aria);
    case 'bargraph': return bargraph(v);
    case 'worked': {
      const c = h('div', { class: 'worked-card' }, h('span', { class: 'wc-title', text: v.title }), v.lines.join('\n'));
      return img(c, `${v.title}: ${v.lines.join('; ')}`);
    }
    case 'balance': {
      const tilt = v.tilt === 'left' ? -8 : v.tilt === 'right' ? 8 : 0;
      const w = h('div', { class: 'balance' });
      w.append(svg(`<svg viewBox="0 0 380 170" aria-hidden="true"><polygon points="190,150 170,170 210,170" fill="${INK}"/><line x1="190" y1="60" x2="190" y2="150" stroke="${INK}" stroke-width="6"/><g transform="rotate(${tilt} 190 60)"><line x1="40" y1="60" x2="340" y2="60" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><rect x="10" y="64" width="140" height="44" rx="10" fill="#EAF4FF" stroke="${INK}" stroke-width="3"/><rect x="230" y="64" width="140" height="44" rx="10" fill="#FFF3D6" stroke="${INK}" stroke-width="3"/><text x="80" y="94" text-anchor="middle" font-family="Baloo 2" font-size="22" font-weight="700" fill="${INK}">${esc(v.left)}</text><text x="300" y="94" text-anchor="middle" font-family="Baloo 2" font-size="22" font-weight="700" fill="${INK}">${esc(v.right)}</text></g></svg>`));
      return img(w, `A balance with ${v.left} on the left and ${v.right} on the right`);
    }
  }
}

export { counters, fraccircle, fracbar, clock };
