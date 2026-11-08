/** Interactive manipulatives. Exact math; touch + keyboard; each tied to curriculum objectives. */
import { gcd } from '../../core/rational';
import { fractionWords, fmtTime } from '../../core/text';
import { checkTotals } from '../../learning/rewards';
import type { App, Screen } from '../app';
import { btn, clear, h } from '../dom';
import { play, say } from '../media';
import { clock, fracbar, fraccircle, renderVisual } from '../visuals';

const TOOLS = [
  { id: 'numberline', icon: '📍', name: 'Number Line', desc: 'Jump forward and back', skills: 'Adding, subtracting, counting on' },
  { id: 'tenframe', icon: '🔟', name: 'Ten Frames', desc: 'Build numbers to 20', skills: 'Counting, making ten' },
  { id: 'blocks', icon: '🧱', name: 'Base-Ten Blocks', desc: 'Hundreds, tens, ones', skills: 'Place value, regrouping' },
  { id: 'fractions', icon: '🍕', name: 'Fraction Bars & Circles', desc: 'Shade equal parts', skills: 'Fractions, equivalence' },
  { id: 'array', icon: '🧮', name: 'Array Builder', desc: 'Rows × columns', skills: 'Multiplication, area' },
  { id: 'clock', icon: '🕐', name: 'Clock', desc: 'Move the hands', skills: 'Telling time, elapsed time' },
  { id: 'balance', icon: '⚖️', name: 'Balance', desc: 'Make both sides equal', skills: 'The equal sign, missing numbers' },
] as const;

export const ToolsScreen: Screen = {
  id: 'tools',
  title: () => 'Math Tools',
  render(app) {
    const grid = h('div', { class: 'tools-grid' });
    TOOLS.forEach(t => grid.append(btn(h('span', {}, h('span', { class: 'tc-icon', 'aria-hidden': 'true' }, t.icon), h('h3', { text: t.name }), h('p', { text: `${t.desc} · ${t.skills}` })), () => void app.go('tool', { tool: t.id }), 'tool-card')));
    return h('section', { 'aria-labelledby': 't-h' }, h('div', { class: 'screen-head' }, h('h2', { id: 't-h', text: '🧰 Math Tools' }), h('p', { text: 'Explore and build. There are no wrong answers here!' })), grid);
  },
};

const stepper = (label: string, get: () => number, set: (n: number) => void, min: number, max: number, onChange: () => void, step = 1) => {
  const out = h('output', { text: String(get()) });
  const m = btn('−', () => { set(Math.max(min, get() - step)); out.textContent = String(get()); onChange(); play('click'); }, '', { 'aria-label': `Less ${label}` });
  const p = btn('+', () => { set(Math.min(max, get() + step)); out.textContent = String(get()); onChange(); play('click'); }, '', { 'aria-label': `More ${label}` });
  return h('div', { class: 'stepper' }, h('span', { text: `${label}:` }), m, out, p);
};

export const ToolScreen: Screen = {
  id: 'tool',
  title: (_a, p) => TOOLS.find(t => t.id === p.tool)?.name ?? 'Tool',
  render(app, params) {
    const t = TOOLS.find(x => x.id === params.tool)!;
    const p = app.profile;
    if (!p.counters.tools.includes(t.id)) { p.counters.tools.push(t.id); const b = checkTotals(p); app.save(); if (b.length) app.celebrateBadges(b); }
    const stage = h('div', { class: 'tool-stage' });
    const readout = h('div', { class: 'tool-readout', 'aria-live': 'polite' });
    const view = h('div', { style: 'display:flex;justify-content:center;flex-wrap:wrap;gap:16px' });
    stage.append(view, readout);
    const controls = h('div', { class: 'tool-row' });
    stage.append(controls);
    BUILDERS[t.id](app, view, readout, controls);
    return h('section', { 'aria-labelledby': 'tool-h' }, h('div', { class: 'screen-head' }, h('h2', { id: 'tool-h', text: `${t.icon} ${t.name}` }), h('p', { text: t.skills })), stage,
      h('div', { class: 'quiz-actions', style: 'margin-top:16px' }, btn('← Back to Math Tools', () => void app.back(), 'btn btn-ghost')));
  },
};

type Builder = (app: App, view: HTMLElement, readout: HTMLElement, controls: HTMLElement) => void;
const BUILDERS: Record<(typeof TOOLS)[number]['id'], Builder> = {
  numberline(_app, view, readout, controls) {
    let max = 20, start = 0, pos = 0;
    const hops: { from: number; to: number }[] = [];
    const draw = () => {
      clear(view);
      view.append(renderVisual({ kind: 'numberline', min: 0, max, labelEvery: max <= 20 ? (max <= 10 ? 1 : 5) : 10, hops: hops.slice(-6), marks: [{ value: [pos, 1], label: String(pos) }] })!);
      const change = pos - start;
      readout.textContent = change === 0 ? `Start at ${start}` : `${start} ${change > 0 ? '+' : '−'} ${Math.abs(change)} = ${pos}`;
    };
    const jump = (d: number) => { const to = Math.max(0, Math.min(max, pos + d)); if (to === pos) return; hops.push({ from: pos, to }); pos = to; play('pop'); draw(); say(readout.textContent ?? ''); };
    controls.append(btn('−10', () => jump(-10), 'btn btn-ghost'), btn('−1', () => jump(-1), 'btn btn-ghost'), btn('+1', () => jump(1), 'btn btn-grass'), btn('+10', () => jump(10), 'btn btn-grass'),
      btn('New start here', () => { start = pos; hops.length = 0; draw(); }, 'btn btn-sun'),
      btn('0–100', () => { max = max === 100 ? 20 : 100; pos = Math.min(pos, max); start = Math.min(start, max); hops.length = 0; draw(); }, 'btn btn-ghost', { 'aria-label': 'Switch between 0 to 20 and 0 to 100' }));
    draw();
  },
  tenframe(_app, view, readout, controls) {
    const cells = new Array(20).fill(false);
    const draw = () => {
      clear(view);
      [0, 1].forEach(f => {
        const g = h('div', { class: 'tf-cells', role: 'group', 'aria-label': `Ten frame ${f + 1}` });
        for (let i = 0; i < 10; i++) { const idx = f * 10 + i; const b = h('button', { type: 'button', 'aria-pressed': String(cells[idx]), 'aria-label': `Box ${i + 1}` }); b.addEventListener('click', () => { cells[idx] = !cells[idx]; play('click'); draw(); }); g.append(b); }
        view.append(g);
      });
      const n = cells.filter(Boolean).length;
      readout.textContent = n > 10 ? `${n} = 10 and ${n - 10}` : n === 10 ? '10 — a full ten!' : `${n}. ${10 - n} more ${10 - n === 1 ? 'makes' : 'make'} 10.`;
    };
    controls.append(btn('Clear', () => { cells.fill(false); draw(); }, 'btn btn-ghost'), btn('Fill 10', () => { for (let i = 0; i < 10; i++) cells[i] = true; draw(); }, 'btn btn-sun'));
    draw();
  },
  blocks(_app, view, readout, controls) {
    let H = 1, T = 2, O = 4;
    const draw = () => { clear(view); view.append(renderVisual({ kind: 'placevalue', h: H, t: T, o: O })!); const n = H * 100 + T * 10 + O; readout.textContent = `${n} = ${H * 100} + ${T * 10} + ${O}`; };
    const tradeUp = btn('Trade 10 ones → 1 ten', () => { if (O >= 10 && T < 9) { O -= 10; T += 1; draw(); play('coin'); } else say('You need 10 ones to trade.'); }, 'btn btn-grape');
    const tradeDown = btn('Break 1 ten → 10 ones', () => { if (T >= 1 && O <= 9) { T -= 1; O += 10; draw(); play('coin'); } }, 'btn btn-grape');
    controls.append(stepper('Hundreds', () => H, n => (H = n), 0, 9, draw), stepper('Tens', () => T, n => (T = n), 0, 9, draw), stepper('Ones', () => O, n => (O = n), 0, 19, draw), tradeUp, tradeDown);
    draw();
  },
  fractions(_app, view, readout, controls) {
    let den = 4, num = 1, circle = false;
    const draw = () => {
      clear(view);
      view.append(circle ? fraccircle(den, num) : fracbar(den, num));
      const g = gcd(num, den) || 1;
      readout.textContent = num === 0 ? `0/${den} — nothing shaded` : num === den ? `${num}/${den} = 1 whole` : `${num}/${den} (${fractionWords(num, den)})${g > 1 ? ` = ${num / g}/${den / g}` : ''}`;
    };
    controls.append(stepper('Equal parts', () => den, n => { den = n; num = Math.min(num, den); }, 1, 12, draw), stepper('Shaded', () => num, n => (num = Math.min(n, den)), 0, 12, draw),
      btn('Bar / Circle', () => { circle = !circle; draw(); }, 'btn btn-ghost', { 'aria-label': 'Switch between bar and circle' }));
    draw();
  },
  array(_app, view, readout, controls) {
    let r = 3, c = 4;
    const draw = () => { clear(view); view.append(renderVisual({ kind: 'array', rows: r, cols: c, emoji: '⭐' })!); readout.textContent = `${r} × ${c} = ${r * c}  ·  ${Array(r).fill(c).join(' + ')}`; };
    controls.append(stepper('Rows', () => r, n => (r = n), 1, 10, draw), stepper('In each row', () => c, n => (c = n), 1, 10, draw), btn('Turn it', () => { [r, c] = [c, r]; draw(); say(`Turned: ${r} times ${c} is still ${r * c}.`); }, 'btn btn-sun'));
    draw();
  },
  clock(_app, view, readout, controls) {
    let mins = 3 * 60;
    let startM = mins;
    const hh = () => { const x = Math.floor(mins / 60) % 12; return x === 0 ? 12 : x; };
    const draw = () => { clear(view); view.append(clock(hh(), mins % 60, 240)); const el = mins - startM; readout.textContent = `${fmtTime(hh(), mins % 60)}${el ? `  ·  ${el} minutes since ${fmtTime(((Math.floor(startM / 60) % 12) || 12), startM % 60)}` : ''}`; };
    const add = (d: number) => { mins = (mins + d + 720 * 10) % 720 || 720; if (mins < startM) startM = mins; draw(); };
    controls.append(btn('−5 min', () => add(-5), 'btn btn-ghost'), btn('+1 min', () => add(1), 'btn btn-ghost'), btn('+5 min', () => add(5), 'btn btn-grass'), btn('+1 hour', () => add(60), 'btn btn-grass'), btn('Start timing here', () => { startM = mins; draw(); }, 'btn btn-sun'));
    draw();
  },
  balance(_app, view, readout, controls) {
    let a = 8, b = 4, c = 5, d = 3;
    const draw = () => {
      const L = a + b, R = c + d;
      clear(view); view.append(renderVisual({ kind: 'balance', left: `${a} + ${b}`, right: `${c} + ${d}`, tilt: L > R ? 'left' : L < R ? 'right' : 'level' })!);
      readout.textContent = L === R ? `${a} + ${b} = ${c} + ${d}  (both are ${L})` : `${a} + ${b} ≠ ${c} + ${d}  (${L} and ${R})`;
    };
    controls.append(stepper('a', () => a, n => (a = n), 0, 20, draw), stepper('b', () => b, n => (b = n), 0, 20, draw), stepper('c', () => c, n => (c = n), 0, 20, draw), stepper('d', () => d, n => (d = n), 0, 20, draw));
    draw();
  },
};
