/** App shell: navigation, modals (focus-trapped), toasts, parental gate, break reminders, error boundary. */
import type { ChildProfile } from '../data/schema';
import type { Store } from '../data/storage';
import { numberWord } from '../core/text';
import { MASCOTS, grant, type Badge } from '../learning/rewards';
import { btn, clear, h } from './dom';
import { bindMediaSettings, play, say, stopVoice } from './media';

export interface Screen {
  id: string;
  title: (app: App, params: Record<string, unknown>) => string;
  render: (app: App, params: Record<string, unknown>) => HTMLElement;
  /** Return false to cancel leaving (e.g., mid-activity). */
  canLeave?: (app: App) => Promise<boolean>;
  onLeave?: (app: App) => void;
  tracksActiveTime?: boolean;
}

interface NavEntry { id: string; params: Record<string, unknown> }
export interface LocalDiag { t: number; where: string; message: string }

export class App {
  private stack: NavEntry[] = [];
  private current: NavEntry | null = null;
  private screens = new Map<string, Screen>();
  readonly main: HTMLElement;
  readonly diag: LocalDiag[] = [];
  private activeMs = 0;
  private lastTick = Date.now();
  private snoozeUntil = 0;
  private modalOpen = false;

  constructor(readonly store: Store) {
    this.main = document.getElementById('main')!;
    bindMediaSettings(this.state.settings);
    this.applySettings();
    setInterval(() => this.tick(), 15_000);
  }

  get state() { return this.store.state; }
  get profile(): ChildProfile { return this.state.profiles[this.state.activeProfileId]!; }
  save(immediate = false) { this.store.save(immediate); this.refreshTopbar(); }

  register(...screens: Screen[]) { screens.forEach(s => this.screens.set(s.id, s)); }

  /* ------------------------------------------------------------ navigation */
  async go(id: string, params: Record<string, unknown> = {}, push = true) {
    const cur = this.current && this.screens.get(this.current.id);
    if (cur?.canLeave && !(await cur.canLeave(this))) return;
    cur?.onLeave?.(this);
    if (push && this.current) this.stack.push(this.current);
    this.show({ id, params });
  }
  /** Replace the current screen (no history entry). */
  replace(id: string, params: Record<string, unknown> = {}) { const cur = this.current && this.screens.get(this.current.id); cur?.onLeave?.(this); this.show({ id, params }); }
  async back(): Promise<boolean> {
    if (this.modalOpen) { this.closeTopModal(); return true; }
    if (!this.current || this.current.id === 'home') return false;
    const cur = this.screens.get(this.current.id);
    if (cur?.canLeave && !(await cur.canLeave(this))) return true;
    cur?.onLeave?.(this);
    const prev = this.stack.pop() ?? { id: 'home', params: {} };
    this.show(prev);
    return true;
  }
  async home() {
    const cur = this.current && this.screens.get(this.current.id);
    if (cur?.canLeave && !(await cur.canLeave(this))) return;
    cur?.onLeave?.(this);
    this.stack = [];
    this.show({ id: 'home', params: {} });
  }
  rerender() { if (this.current) this.show(this.current); }
  get currentId() { return this.current?.id; }

  private show(entry: NavEntry) {
    stopVoice();
    const screen = this.screens.get(entry.id);
    if (!screen) throw new Error(`unknown screen ${entry.id}`);
    this.current = entry;
    clear(this.main);
    let el: HTMLElement;
    try { el = screen.render(this, entry.params); }
    catch (e) { this.logError('render ' + entry.id, e); el = this.errorPanel(); }
    el.classList.add('screen', 'active');
    this.main.append(el);
    const title = screen.title(this, entry.params);
    document.title = `${title} · MathQuest Kids`;
    const away = entry.id !== 'home';
    document.body.classList.toggle('away', away);
    document.getElementById('btn-back')!.classList.toggle('show', away);
    document.getElementById('btn-home')!.classList.toggle('show', away);
    window.scrollTo({ top: 0, behavior: 'auto' });
    // Move focus to the new screen's heading for screen-reader and keyboard users.
    const heading = el.querySelector('h1,h2') as HTMLElement | null;
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    this.announce(title);
    this.refreshTopbar();
  }

  /* ------------------------------------------------------------ chrome */
  refreshTopbar() {
    const p = this.profile;
    const m = MASCOTS.find(x => x.id === p.mascot) ?? MASCOTS[0]!;
    document.getElementById('hud-coins')!.textContent = String(p.coins);
    document.getElementById('hud-badges')!.textContent = String(Object.keys(p.badges).length);
    const chip = document.getElementById('btn-profile')!;
    chip.querySelector('.pc-m')!.textContent = m.e;
    chip.querySelector('.pc-n')!.textContent = p.nickname;
    chip.setAttribute('aria-label', `${p.nickname}'s collection and mascots`);
  }
  applySettings() {
    const s = this.state.settings;
    document.body.classList.toggle('large-text', s.large);
    document.body.classList.toggle('reduce-motion', s.motion || reducedMotion());
    document.body.classList.toggle('high-contrast', s.contrast);
  }
  announce(msg: string) {
    const live = document.getElementById('sr-live')!;
    live.textContent = '';
    setTimeout(() => { live.textContent = msg; }, 30);
  }
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  toast(msg: string) {
    const t = document.getElementById('toast')!;
    t.textContent = msg; t.classList.add('show');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
    this.announce(msg);
  }
  celebrateBadges(badges: Badge[]) {
    badges.forEach((b, i) => setTimeout(() => { this.toast(`${b.e} New badge: ${b.name}!`); play('fanfare'); }, i * 1400));
  }
  confetti(n = 30) {
    if (this.state.settings.motion || reducedMotion()) return;
    const layer = document.getElementById('confetti-layer')!;
    const glyphs = ['🎉', '⭐', '💛', '🔷', '🟢', '🟣', '✨'];
    for (let i = 0; i < n; i++) {
      const c = h('span', { class: 'confetti' }, glyphs[i % glyphs.length]!);
      c.style.left = `${Math.random() * 100}vw`; c.style.fontSize = `${10 + Math.random() * 12}px`;
      c.style.animationDuration = `${2 + Math.random() * 2}s`; c.style.animationDelay = `${Math.random() * 0.4}s`;
      layer.append(c); setTimeout(() => c.remove(), 4600);
    }
  }

  /* ------------------------------------------------------------ modals */
  private modalStack: { el: HTMLElement; restore: Element | null; onClose?: () => void }[] = [];
  modal(opts: { title: string; body: HTMLElement | string; actions?: { label: string; cls?: string; onClick: () => void | boolean }[]; onClose?: () => void; dismissable?: boolean }): () => void {
    const restore = document.activeElement;
    const titleId = `mt-${Date.now()}`;
    const dialog = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId });
    const close = () => this.closeModal(backdrop);
    if (opts.dismissable !== false) dialog.append(btn('✕', close, 'modal-x', { 'aria-label': 'Close' }));
    dialog.append(h('h3', { id: titleId, text: opts.title }));
    dialog.append(typeof opts.body === 'string' ? h('p', { style: 'font-weight:700;color:var(--ink-soft);margin-bottom:16px', text: opts.body }) : opts.body);
    if (opts.actions?.length) {
      const row = h('div', { style: 'display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:16px' });
      opts.actions.forEach(a => row.append(btn(a.label, () => { if (a.onClick() !== false) close(); }, a.cls ?? 'btn')));
      dialog.append(row);
    }
    const backdrop = h('div', { class: 'modal-backdrop open' }, dialog);
    backdrop.addEventListener('mousedown', e => { if (e.target === backdrop && opts.dismissable !== false) close(); });
    backdrop.addEventListener('keydown', e => {
      if (e.key === 'Escape' && opts.dismissable !== false) { e.stopPropagation(); close(); }
      if (e.key === 'Tab') trapFocus(dialog, e);
    });
    document.body.append(backdrop);
    document.querySelector('.app')?.setAttribute('aria-hidden', 'true');
    this.modalStack.push({ el: backdrop, restore, ...(opts.onClose ? { onClose: opts.onClose } : {}) });
    this.modalOpen = true;
    const first = dialog.querySelector('input,button:not(.modal-x),select,[tabindex]') as HTMLElement | null;
    (first ?? dialog.querySelector('button'))?.focus();
    return close;
  }
  private closeModal(el: HTMLElement) {
    const i = this.modalStack.findIndex(m => m.el === el);
    if (i < 0) return;
    const [m] = this.modalStack.splice(i, 1);
    m!.el.remove();
    if (!this.modalStack.length) { document.querySelector('.app')?.removeAttribute('aria-hidden'); this.modalOpen = false; }
    (m!.restore as HTMLElement | null)?.focus?.();
    m!.onClose?.();
  }
  closeTopModal() { const top = this.modalStack[this.modalStack.length - 1]; if (top) this.closeModal(top.el); }
  confirm(message: string, yes = 'Yes', no = 'No'): Promise<boolean> {
    return new Promise(resolve => {
      let answered = false;
      this.modal({ title: 'Are you sure?', body: message, onClose: () => { if (!answered) resolve(false); }, actions: [
        { label: no, cls: 'btn btn-ghost', onClick: () => { answered = true; resolve(false); } },
        { label: yes, cls: 'btn btn-coral', onClick: () => { answered = true; resolve(true); } },
      ] });
    });
  }

  /**
   * Parental gate: an adult-level problem written in words (2-digit × 1-digit, beyond Level 4).
   * This deters young children from adult areas; it is NOT authentication or security.
   */
  gate(purpose: string): Promise<boolean> {
    return new Promise(resolve => {
      let a = 0, b = 0, ok = false, fails = 0;
      const qEl = h('p', { class: 'gate-q' });
      const input = h('input', { class: 'gate-input', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Answer in digits', maxlength: '4' });
      const err = h('p', { class: 'gate-err', role: 'alert' });
      const fresh = () => { a = 13 + Math.floor(Math.random() * 74); b = 3 + Math.floor(Math.random() * 6); qEl.textContent = `What is ${numberWord(a)} times ${numberWord(b)}? Type the answer in digits, then press and hold Continue.`; input.value = ''; };
      fresh();
      say('This part is for grown-ups. Please ask a grown-up to help.');
      const check = () => {
        if (Number(input.value) === a * b) { ok = true; close(); resolve(true); return; }
        fails++; err.textContent = fails >= 3 ? 'Not quite. Here is a new problem.' : 'Not quite — try again.'; fresh(); input.focus();
      };
      // Press-and-hold (1.2 s) in addition to the worded problem: works with pointer, Enter, or Space.
      const HOLD_MS = 1200;
      const fill = h('span', { class: 'hold-fill', 'aria-hidden': 'true' });
      const hold = h('button', { class: 'btn btn-blue hold-btn', type: 'button', 'aria-label': 'Press and hold to continue' }, fill, h('span', { style: 'position:relative', text: 'Press and hold to continue' }));
      let timer: ReturnType<typeof setTimeout> | null = null, started = 0, raf = 0;
      const tickFill = () => { const p = Math.min(1, (Date.now() - started) / HOLD_MS); fill.style.width = `${p * 100}%`; if (timer) raf = requestAnimationFrame(tickFill); };
      const begin = () => { if (timer) return; if (!input.value) { err.textContent = 'Type the answer first.'; input.focus(); return; } started = Date.now(); timer = setTimeout(() => { timer = null; cancelAnimationFrame(raf); fill.style.width = '0'; check(); }, HOLD_MS); raf = requestAnimationFrame(tickFill); };
      const cancel = () => { if (timer) { clearTimeout(timer); timer = null; cancelAnimationFrame(raf); fill.style.width = '0'; } };
      hold.addEventListener('pointerdown', e => { e.preventDefault(); begin(); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => hold.addEventListener(ev, cancel));
      hold.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); begin(); } });
      hold.addEventListener('keyup', e => { if (e.key === 'Enter' || e.key === ' ') cancel(); });
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); hold.focus(); } });
      const body = h('div', {}, h('p', { style: 'font-weight:700;color:var(--ink-soft)', text: `Grown-ups only: ${purpose}` }), qEl, input, err, h('div', { style: 'text-align:center;margin-top:12px' }, hold));
      const close = this.modal({ title: '🔒 Grown-ups', body, onClose: () => { cancel(); if (!ok) resolve(false); } });
      setTimeout(() => input.focus(), 50);
    });
  }

  /* ------------------------------------------------------------ break reminders */
  private tick() {
    const now = Date.now();
    const scr = this.current && this.screens.get(this.current.id);
    if (document.visibilityState === 'visible' && scr?.tracksActiveTime) this.activeMs += now - this.lastTick;
    this.lastTick = now;
    const mins = this.state.parent.breakMinutes;
    if (mins && this.activeMs >= mins * 60_000 && now > this.snoozeUntil && !this.modalOpen) {
      this.activeMs = 0;
      say('Great work! Time for a stretch break.');
      this.modal({
        title: '🧘 Break time!', body: 'You have been thinking hard. Stand up, stretch, take a sip of water, and rest your eyes. Your progress is saved.',
        actions: [
          { label: 'Keep going', cls: 'btn btn-ghost', onClick: () => { this.snoozeUntil = Date.now() + 5 * 60_000; } },
          { label: 'I took a break', cls: 'btn btn-grass', onClick: () => { const b = grant(this.profile, 'rest'); this.save(); if (b) this.celebrateBadges([b]); } },
        ],
      });
    }
  }
  pause() { this.store.flush(); stopVoice(); }

  /* ------------------------------------------------------------ errors */
  logError(where: string, e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    this.diag.push({ t: Date.now(), where, message: message.slice(0, 300) });
    if (this.diag.length > 30) this.diag.shift();
    console.error(where, e);
  }
  errorPanel(): HTMLElement {
    return h('section', { class: 'lesson-card' }, h('h2', { text: 'Oops! Something went wrong.' }), h('p', { class: 'l-blurb', text: 'Your progress is saved. Let’s go back home.' }), h('div', { class: 'lesson-actions' }, btn('🏠 Home', () => void this.home(), 'btn btn-blue btn-lg')));
  }
}

export const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function trapFocus(container: HTMLElement, e: KeyboardEvent) {
  const f = [...container.querySelectorAll<HTMLElement>('button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"]),a[href]')].filter(x => x.offsetParent !== null || x === document.activeElement);
  if (!f.length) return;
  const first = f[0]!, last = f[f.length - 1]!;
  if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
  else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
}
