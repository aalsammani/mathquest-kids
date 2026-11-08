/**
 * Interaction components. Every one is usable by touch, mouse, keyboard and screen reader,
 * and none requires dragging (WCAG 2.5.7): number lines also work with taps and arrow keys.
 */
import type { Interaction, Option, Response } from '../core/types';
import { btn, clear, h, svg } from './dom';
import { renderVisual } from './visuals';
import { play, say } from './media';

export interface InteractionView { el: HTMLElement; focus(): void; lock(): void; showResult(correct: boolean, chosen?: Response): void; eliminate?(id: string): void }

const optLabel = (o: Option) => o.aria ?? o.label;

export function renderInteraction(inter: Interaction, submit: (r: Response) => void): InteractionView {
  switch (inter.type) {
    case 'choice': return choiceView(inter, submit);
    case 'numeric': return keypadView(inter, submit);
    case 'order': return orderView(inter, submit);
    case 'numberline': return numberlineView(inter, submit);
    case 'shade': return shadeView(inter, submit);
    case 'array': return arrayView(inter, submit);
    case 'tf': return tfView(inter, submit);
    case 'match': return matchView(inter, submit);
  }
}

const checkButton = (onClick: () => void, label = '✓ Check') => btn(label, onClick, 'btn btn-grass btn-lg', { 'data-check': '1', 'aria-label': 'Check my answer' });
/** A visible line for gentle prompts ("Type a number first"), so guidance never depends on sound alone. */
const noteLine = () => h('p', { class: 'check-msg', role: 'status', 'aria-live': 'polite' });
const nudge = (line: HTMLElement, text: string) => { line.textContent = text; say(text); };

/* ------------------------------------------------------------------ choice */
function choiceView(inter: Extract<Interaction, { type: 'choice' }>, submit: (r: Response) => void): InteractionView {
  const wrap = h('div', { class: `answers ${inter.layout === 'two' ? 'two-col' : inter.layout === 'list' ? 'list' : ''}`, role: 'group', 'aria-label': 'Answer choices' });
  const buttons = new Map<string, HTMLButtonElement>();
  inter.options.forEach((o, i) => {
    const b = h('button', { class: 'answer', type: 'button', 'data-key': String(i + 1), 'data-opt': o.id, 'aria-label': `Choice ${i + 1}: ${optLabel(o)}` });
    if (o.visual) { const v = renderVisual(o.visual); if (v) b.append(h('span', { class: 'opt-visual' }, v)); }
    b.append(h('span', { text: o.label }));
    b.addEventListener('click', () => submit({ type: 'choice', id: o.id }));
    buttons.set(o.id, b);
    wrap.append(b);
  });
  return {
    el: wrap,
    focus: () => buttons.values().next().value?.focus({ preventScroll: true }),
    lock: () => buttons.forEach(b => (b.disabled = true)),
    eliminate: id => { const b = buttons.get(id); if (b) { b.disabled = true; b.classList.add('is-eliminated'); b.setAttribute('aria-label', `${b.getAttribute('aria-label')} (not this one)`); } },
    showResult: (correct, chosen) => {
      buttons.forEach((b, id) => {
        b.disabled = true;
        if (inter.correct.includes(id)) { b.classList.add('is-correct'); b.append(h('span', { class: 'mark', 'aria-hidden': 'true' }, '✓')); b.setAttribute('aria-label', `${b.getAttribute('aria-label')} — correct answer`); }
        else if (chosen?.type === 'choice' && chosen.id === id && !correct) { b.classList.add('is-wrong'); b.append(h('span', { class: 'mark', 'aria-hidden': 'true' }, '✗')); }
      });
    },
  };
}

/* ------------------------------------------------------------------ numeric keypad */
function keypadView(inter: Extract<Interaction, { type: 'numeric' }>, submit: (r: Response) => void): InteractionView {
  let value = '';
  const display = h('div', { class: 'keypad-display empty', role: 'status', 'aria-live': 'polite', 'aria-label': 'Your answer' }, 'Type your answer');
  const render = () => { display.textContent = value || 'Type your answer'; display.classList.toggle('empty', !value); };
  const press = (k: string) => {
    play('click');
    if (k === '⌫') value = value.slice(0, -1);
    else if (k === 'C') value = '';
    else if (value.length < 4) value = (value === '0' ? '' : value) + k;
    render();
  };
  const pad = h('div', { class: 'keypad', role: 'group', 'aria-label': 'Number keypad' });
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].forEach(k => pad.append(btn(k, () => press(k), '', { 'aria-label': k === '⌫' ? 'Delete' : k === 'C' ? 'Clear' : k })));
  const note = noteLine();
  const check = checkButton(() => { if (value) { note.textContent = ''; submit({ type: 'numeric', value: Number(value) }); } else nudge(note, 'Type a number first.'); });
  const wrap = h('div', { class: 'keypad-wrap' }, h('div', { style: 'display:flex;align-items:center;gap:10px' }, display, inter.unit ? h('span', { class: 'unit-label', text: inter.unit }) : null), pad, check, note);
  wrap.addEventListener('keydown', e => {
    if (/^[0-9]$/.test(e.key)) { press(e.key); e.preventDefault(); }
    else if (e.key === 'Backspace') { press('⌫'); e.preventDefault(); }
    else if (e.key === 'Enter' && value) { check.click(); e.preventDefault(); }
  });
  return {
    el: wrap, focus: () => (pad.firstElementChild as HTMLElement)?.focus({ preventScroll: true }),
    lock: () => wrap.querySelectorAll('button').forEach(b => ((b as HTMLButtonElement).disabled = true)),
    showResult: correct => { display.style.borderColor = correct ? 'var(--grass-ui)' : 'var(--coral-ui)'; },
    eliminate: () => { value = ''; render(); },
  };
}

/* ------------------------------------------------------------------ order */
function orderView(inter: Extract<Interaction, { type: 'order' }>, submit: (r: Response) => void): InteractionView {
  const picked: string[] = [];
  const pickedEl = h('div', { class: 'order-picked', 'aria-label': 'Your order', role: 'list' });
  const pool = h('div', { class: 'order-pool', role: 'group', 'aria-label': 'Numbers to put in order' });
  const note = noteLine();
  const check = checkButton(() => { if (picked.length === inter.items.length) { note.textContent = ''; submit({ type: 'order', ids: picked.slice() }); } else nudge(note, 'Put all of them in order first.'); });
  const render = () => {
    clear(pickedEl); clear(pool);
    picked.forEach((id, i) => { const it = inter.items.find(x => x.id === id)!; pickedEl.append(btn(it.label, () => { picked.splice(i, 1); render(); }, 'chip picked', { role: 'listitem', 'aria-label': `Position ${i + 1}: ${it.label}. Tap to remove.` })); });
    if (!picked.length) pickedEl.append(h('span', { class: 'sub-label', text: 'Tap numbers below, least first.' }));
    inter.items.filter(it => !picked.includes(it.id)).forEach(it => pool.append(btn(it.label, () => { play('click'); picked.push(it.id); render(); }, 'chip', { 'aria-label': `Add ${it.label}` })));
  };
  render();
  return {
    el: h('div', {}, h('p', { class: 'sub-label', text: inter.instruction }), pickedEl, pool, h('div', { class: 'check-row' }, check), note),
    focus: () => (pool.firstElementChild as HTMLElement)?.focus({ preventScroll: true }),
    lock: () => { check.disabled = true; pool.querySelectorAll('button').forEach(b => ((b as HTMLButtonElement).disabled = true)); pickedEl.querySelectorAll('button').forEach(b => ((b as HTMLButtonElement).disabled = true)); },
    showResult: () => {},
    eliminate: () => { picked.length = 0; render(); },
  };
}

/* ------------------------------------------------------------------ number line (tap, drag, or arrows) */
function numberlineView(inter: Extract<Interaction, { type: 'numberline' }>, submit: (r: Response) => void): InteractionView {
  const steps = (inter.max - inter.min) * inter.denom;
  let pos = Math.round(steps / 2);
  const W = 600, H = 120, x0 = 34, xw = W - 68, y = 64;
  const tx = (i: number) => x0 + (i / steps) * xw;
  const fmt = (i: number) => { const n = inter.min * inter.denom + i; return inter.denom === 1 ? String(n) : `${n}/${inter.denom}`; };
  const valueOut = h('output', { class: 'nl-value', 'aria-live': 'polite' });
  let s = `<svg viewBox="0 0 ${W} ${H}" role="slider" tabindex="0" aria-label="Number line. Use the arrow keys to move the dot." aria-valuemin="0" aria-valuemax="${steps}">`;
  s += `<line x1="${x0 - 12}" y1="${y}" x2="${x0 + xw + 12}" y2="${y}" stroke="#2D3561" stroke-width="3" stroke-linecap="round"/>`;
  for (let i = 0; i <= steps; i++) {
    const n = inter.min * inter.denom + i;
    const lab = inter.denom === 1 ? (n - inter.min) % inter.labelEvery === 0 : n % inter.labelEvery === 0;
    s += `<line x1="${tx(i)}" y1="${y - (lab ? 12 : 8)}" x2="${tx(i)}" y2="${y + (lab ? 12 : 8)}" stroke="#2D3561" stroke-width="${lab ? 3 : 2}"/>`;
    if (lab) s += `<text x="${tx(i)}" y="${y + 36}" text-anchor="middle" font-size="16" font-weight="800" fill="#4F5986" font-family="Nunito">${inter.denom === 1 ? n : n / inter.denom}</text>`;
  }
  s += `<circle class="nl-dot" cx="${tx(pos)}" cy="${y}" r="13" fill="#E14D4D" stroke="#fff" stroke-width="4"/></svg>`;
  const svgEl = svg(s);
  const dot = svgEl.querySelector('.nl-dot') as SVGCircleElement;
  const update = () => {
    dot.setAttribute('cx', String(tx(pos)));
    svgEl.setAttribute('aria-valuenow', String(pos));
    svgEl.setAttribute('aria-valuetext', `The dot is at ${fmt(pos)}`);
    valueOut.textContent = `Dot at: ${fmt(pos)}`;
  };
  const fromClient = (cx: number) => { const r = svgEl.getBoundingClientRect(); const px = ((cx - r.left) / r.width) * W; pos = Math.max(0, Math.min(steps, Math.round(((px - x0) / xw) * steps))); update(); };
  let dragging = false;
  svgEl.addEventListener('pointerdown', e => { dragging = true; svgEl.setPointerCapture?.(e.pointerId); fromClient(e.clientX); });
  svgEl.addEventListener('pointermove', e => { if (dragging) fromClient(e.clientX); });
  svgEl.addEventListener('pointerup', () => { dragging = false; });
  svgEl.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { pos = Math.min(steps, pos + 1); update(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { pos = Math.max(0, pos - 1); update(); e.preventDefault(); }
    else if (e.key === 'Home') { pos = 0; update(); e.preventDefault(); }
    else if (e.key === 'End') { pos = steps; update(); e.preventDefault(); }
    else if (e.key === 'Enter') { check.click(); e.preventDefault(); }
  });
  const left = btn('◀', () => { pos = Math.max(0, pos - 1); update(); }, 'btn btn-ghost', { 'aria-label': 'Move dot left' });
  const right = btn('▶', () => { pos = Math.min(steps, pos + 1); update(); }, 'btn btn-ghost', { 'aria-label': 'Move dot right' });
  const check = checkButton(() => { const n = inter.min * inter.denom + pos; submit({ type: 'numberline', value: [n, inter.denom] }); });
  update();
  return {
    el: h('div', { class: 'nl-wrap' }, svgEl, h('div', { class: 'nl-controls' }, left, valueOut, right), h('div', { class: 'check-row' }, check)),
    focus: () => svgEl.focus({ preventScroll: true }),
    lock: () => { left.disabled = right.disabled = check.disabled = true; svgEl.style.pointerEvents = 'none'; },
    showResult: correct => { if (!correct) { const [an, ad] = inter.answer; const i = (an * inter.denom) / ad - inter.min * inter.denom; svgEl.insertAdjacentHTML('beforeend', `<circle cx="${tx(i)}" cy="${y}" r="9" fill="#1A7F45" stroke="#fff" stroke-width="3"/>`); } },
  };
}

/* ------------------------------------------------------------------ shade parts */
function shadeView(inter: Extract<Interaction, { type: 'shade' }>, submit: (r: Response) => void): InteractionView {
  const on = new Array(inter.parts).fill(false);
  const count = h('div', { class: 'shade-count', 'aria-live': 'polite' });
  const upd = () => { count.textContent = `${on.filter(Boolean).length} of ${inter.parts} parts shaded`; };
  let area: HTMLElement;
  if (inter.shape === 'bar') {
    area = h('div', { class: 'shade-bar', role: 'group', 'aria-label': `A bar with ${inter.parts} equal parts` });
    for (let i = 0; i < inter.parts; i++) {
      const b = h('button', { type: 'button', 'aria-pressed': 'false', 'aria-label': `Part ${i + 1}` });
      b.addEventListener('click', () => { on[i] = !on[i]; b.setAttribute('aria-pressed', String(on[i])); play('click'); upd(); });
      area.append(b);
    }
  } else {
    const C = 100, R = 90;
    let s = `<svg viewBox="0 0 200 200" role="group" aria-label="A circle with ${inter.parts} equal parts">`;
    for (let i = 0; i < inter.parts; i++) {
      const a0 = (i / inter.parts) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / inter.parts) * 2 * Math.PI - Math.PI / 2;
      s += `<path data-i="${i}" role="checkbox" tabindex="0" aria-checked="false" aria-label="Part ${i + 1}" d="M ${C} ${C} L ${(C + R * Math.cos(a0)).toFixed(2)} ${(C + R * Math.sin(a0)).toFixed(2)} A ${R} ${R} 0 ${inter.parts === 1 ? 1 : 0} 1 ${(C + R * Math.cos(a1)).toFixed(2)} ${(C + R * Math.sin(a1)).toFixed(2)} Z" fill="#F2F5FC" stroke="#2D3561" stroke-width="3"/>`;
    }
    s += '</svg>';
    const svgEl = svg(s);
    svgEl.querySelectorAll('path').forEach(p => {
      const toggle = () => { const i = Number(p.getAttribute('data-i')); on[i] = !on[i]; p.setAttribute('aria-checked', String(on[i])); p.setAttribute('fill', on[i] ? '#3FB4F6' : '#F2F5FC'); p.setAttribute('stroke-dasharray', on[i] ? '' : ''); play('click'); upd(); };
      p.addEventListener('click', toggle);
      p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { toggle(); e.preventDefault(); } });
    });
    area = h('div', { class: 'shade-circle' }, svgEl);
  }
  const check = checkButton(() => submit({ type: 'shade', count: on.filter(Boolean).length }));
  upd();
  return {
    el: h('div', { class: 'shade-wrap' }, area, count, check),
    focus: () => (area.querySelector('button,[tabindex]') as HTMLElement)?.focus({ preventScroll: true }),
    lock: () => { check.disabled = true; area.querySelectorAll('button').forEach(b => ((b as HTMLButtonElement).disabled = true)); area.style.pointerEvents = 'none'; },
    showResult: () => {},
  };
}

/* ------------------------------------------------------------------ build an array */
function arrayView(inter: Extract<Interaction, { type: 'array' }>, submit: (r: Response) => void): InteractionView {
  let rows = inter.fixedRows ?? 1, cols = 1;
  const preview = h('div', { class: 'array-preview', 'aria-hidden': 'true' });
  const readout = h('div', { class: 'tool-readout', 'aria-live': 'polite' });
  const render = () => {
    clear(preview); preview.style.gridTemplateColumns = `repeat(${cols}, 22px)`;
    for (let i = 0; i < rows * cols; i++) preview.append(h('span'));
    readout.textContent = `${rows} ${rows === 1 ? 'row' : 'rows'} of ${cols} = ${rows * cols}`;
  };
  const stepper = (label: string, get: () => number, set: (n: number) => void, max: number, locked = false) => {
    const out = h('output', { 'aria-live': 'polite' }, String(get()));
    const minus = btn('−', () => { set(Math.max(1, get() - 1)); out.textContent = String(get()); render(); }, '', { 'aria-label': `Fewer ${label}`, ...(locked ? { disabled: true } : {}) });
    const plus = btn('+', () => { set(Math.min(max, get() + 1)); out.textContent = String(get()); render(); }, '', { 'aria-label': `More ${label}`, ...(locked ? { disabled: true } : {}) });
    return h('div', { class: 'stepper' }, h('span', { text: label.charAt(0).toUpperCase() + label.slice(1) + ':' }), minus, out, plus);
  };
  const check = checkButton(() => submit({ type: 'array', rows, cols }));
  render();
  const el = h('div', { class: 'array-build' }, h('div', { class: 'array-controls' }, stepper('rows', () => rows, n => (rows = n), inter.maxRows, inter.fixedRows !== undefined), stepper('in each row', () => cols, n => (cols = n), inter.maxCols)), preview, readout, check);
  return { el, focus: () => (el.querySelector('button:not([disabled])') as HTMLElement)?.focus({ preventScroll: true }), lock: () => el.querySelectorAll('button').forEach(b => ((b as HTMLButtonElement).disabled = true)), showResult: () => {} };
}

/* ------------------------------------------------------------------ true/false + reason */
function tfView(inter: Extract<Interaction, { type: 'tf' }>, submit: (r: Response) => void): InteractionView {
  let truth: boolean | null = null, just: string | null = null;
  const tBtn = h('button', { class: 'answer', type: 'button', 'aria-pressed': 'false' }, 'True');
  const fBtn = h('button', { class: 'answer', type: 'button', 'aria-pressed': 'false' }, 'False');
  const justWrap = h('div', { class: 'answers list', role: 'group', 'aria-label': 'Reasons' });
  const jBtns = new Map<string, HTMLButtonElement>();
  inter.justifications.forEach((j, i) => {
    const b = h('button', { class: 'answer', type: 'button', 'aria-pressed': 'false', 'aria-label': `Reason ${i + 1}: ${j.label}` }, j.label);
    b.addEventListener('click', () => { just = j.id; jBtns.forEach((x, id) => { x.classList.toggle('is-selected', id === j.id); x.setAttribute('aria-pressed', String(id === j.id)); }); play('click'); });
    jBtns.set(j.id, b); justWrap.append(b);
  });
  const pickTruth = (v: boolean) => { truth = v; tBtn.classList.toggle('is-selected', v); fBtn.classList.toggle('is-selected', !v); tBtn.setAttribute('aria-pressed', String(v)); fBtn.setAttribute('aria-pressed', String(!v)); play('click'); };
  tBtn.addEventListener('click', () => pickTruth(true));
  fBtn.addEventListener('click', () => pickTruth(false));
  const note = noteLine();
  const check = checkButton(() => { if (truth === null) return nudge(note, 'First choose true or false.'); if (!just) return nudge(note, 'Now choose the best reason.'); note.textContent = ''; submit({ type: 'tf', truth, justId: just }); });
  const el = h('div', {}, h('div', { class: 'statement', text: inter.statement }), h('div', { class: 'tf-row', role: 'group', 'aria-label': 'True or false' }, tBtn, fBtn), h('p', { class: 'sub-label', text: 'Which reason is best?' }), justWrap, h('div', { class: 'check-row' }, check), note);
  return {
    el, focus: () => tBtn.focus({ preventScroll: true }),
    lock: () => el.querySelectorAll('button').forEach(b => ((b as HTMLButtonElement).disabled = true)),
    showResult: () => {
      (inter.truth ? tBtn : fBtn).classList.add('is-correct');
      jBtns.forEach((b, id) => { if (inter.correctJust.includes(id)) b.classList.add('is-correct'); else if (id === just) b.classList.add('is-wrong'); });
    },
    eliminate: () => { truth = null; just = null; [tBtn, fBtn, ...jBtns.values()].forEach(b => { b.classList.remove('is-selected'); b.setAttribute('aria-pressed', 'false'); }); },
  };
}

/* ------------------------------------------------------------------ match (tap left, then right) */
function matchView(inter: Extract<Interaction, { type: 'match' }>, submit: (r: Response) => void): InteractionView {
  const pairs = new Map<string, string>(); // left → right
  let sel: string | null = null;
  const note = noteLine();
  const lBtns = new Map<string, HTMLButtonElement>(), rBtns = new Map<string, HTMLButtonElement>();
  const render = () => {
    lBtns.forEach((b, id) => { b.classList.toggle('sel', sel === id); b.classList.toggle('paired', pairs.has(id)); const r = pairs.get(id); b.querySelector('.pair-tag')!.textContent = r ? `→ ${inter.right.find(x => x.id === r)!.label}` : ''; });
    const used = new Set(pairs.values());
    rBtns.forEach((b, id) => b.classList.toggle('paired', used.has(id)));
  };
  const lc = h('div', { class: 'match-col', role: 'group', 'aria-label': 'Left items' });
  const rc = h('div', { class: 'match-col', role: 'group', 'aria-label': 'Right items' });
  inter.left.forEach(o => {
    const b = h('button', { class: 'match-item', type: 'button', 'aria-label': `${optLabel(o)}. Tap, then tap its match.` });
    if (o.visual) { const v = renderVisual(o.visual); if (v) b.append(v); } else b.append(h('span', { text: o.label }));
    b.append(h('span', { class: 'pair-tag', 'aria-live': 'polite' }));
    b.addEventListener('click', () => { play('click'); if (pairs.has(o.id)) pairs.delete(o.id); sel = o.id; render(); });
    lBtns.set(o.id, b); lc.append(b);
  });
  inter.right.forEach(o => {
    const b = h('button', { class: 'match-item', type: 'button', 'aria-label': `Match: ${o.label}` }, h('span', { text: o.label }));
    b.addEventListener('click', () => {
      if (!sel) { nudge(note, 'First tap something on the left.'); return; }
      note.textContent = '';
      for (const [l, r] of pairs) if (r === o.id) pairs.delete(l);
      pairs.set(sel, o.id); sel = null; play('click'); render();
    });
    rBtns.set(o.id, b); rc.append(b);
  });
  const check = checkButton(() => { if (pairs.size < inter.left.length) return nudge(note, 'Match every item first.'); note.textContent = ''; submit({ type: 'match', pairs: [...pairs.entries()] }); });
  render();
  const el = h('div', {}, h('div', { class: 'match-grid' }, lc, rc), h('div', { class: 'check-row' }, check), note);
  return { el, focus: () => lBtns.values().next().value?.focus({ preventScroll: true }), lock: () => el.querySelectorAll('button').forEach(b => ((b as HTMLButtonElement).disabled = true)), showResult: () => {}, eliminate: () => { pairs.clear(); sel = null; render(); } };
}
