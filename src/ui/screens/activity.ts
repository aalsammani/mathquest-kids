/**
 * Activity runner: practice, Skill Check, check-back, Math Story Adventures, daily review,
 * level challenge, placement. Records evidence via learning/progress.ts (unit-tested).
 */
import { LEVELS, SKILL_INDEX } from '../../curriculum/levels';
import type { Difficulty, LevelId, Question, Response } from '../../core/types';
import { answerLabel, checkResponse } from '../../engine/check';
import { applyCheck, emptyRecord, skillState, type Attempt } from '../../learning/mastery';
import { recordAttempt } from '../../learning/progress';
import { dailyMix, PLACEMENT_SKILLS, suggestLevel } from '../../learning/recommend';
import { grant, MASCOTS, type Badge } from '../../learning/rewards';
import { Adapter, hasReasoning, makeAttempt, nextQuestion, planSession, roundStars, startDifficulty, type SessionKind, type Slot } from '../../learning/session';
import type { App, Screen } from '../app';
import { btn, clear, h } from '../dom';
import { renderInteraction, type InteractionView } from '../interactions';
import { play, say, stopVoice } from '../media';
import { renderVisual } from '../visuals';

type Kind = SessionKind | 'final';
interface Run {
  kind: Kind; skill: string; level: LevelId; slots: Slot[]; idx: number; adapter: Adapter; seen: Set<string>;
  attempts: Attempt[]; coins: number; badges: Badge[]; started: number; finished: boolean;
  placement: { level: LevelId; correct: boolean }[];
}
let run: Run | null = null;

const CHEERS = ['You got it!', 'Great thinking!', 'Nice reasoning!', 'Excellent work!', 'You figured it out!', 'Super job!', 'That makes sense!', 'Well done!'];
const TRY_AGAIN = ['Not yet — try again!', 'Almost! Take another look.', 'Good try. Look again carefully.', 'Hmm, not quite. You can do this!'];
const LEARN = ['Let’s look at it together.', 'Mistakes help our brains grow. Here’s how it works:', 'Good effort! Here is one way to think about it:'];
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]!;

function buildSlots(kind: Kind, skill: string, level: LevelId, app: App): Slot[] {
  const p = app.profile;
  switch (kind) {
    case 'daily': { const mix = dailyMix(p.skills, level); return planSession('daily', mix[0]!, mix.slice(1)); }
    case 'final': {
      const skills = LEVELS.find(l => l.id === level)!.skills.filter(s => !s.id.endsWith('stories'));
      return Array.from({ length: 8 }, (_, i): Slot => ({ skill: skills[(i * 5) % skills.length]!.id, ctx: 'practice', diff: 3, excludeModes: ['story'], hintsAllowed: true, retryAllowed: true }));
    }
    case 'placement': return planSession('placement', PLACEMENT_SKILLS[1][0]!, PLACEMENT_SKILLS[1].slice(1));
    default: return planSession(kind, skill);
  }
}

export const ActivityScreen: Screen = {
  id: 'activity',
  tracksActiveTime: true,
  title: (_a, p) => titleFor(p.kind as Kind, String(p.skill ?? '')),
  canLeave: async app => {
    if (!run || run.finished || run.idx === 0) return true;
    return app.confirm('Leave this activity? Your answers so far are saved, but stars and Skill Checks only count for finished rounds.', 'Leave', 'Keep going');
  },
  onLeave: () => { stopVoice(); run = null; },
  render(app, params) {
    const kind = params.kind as Kind;
    const skill = String(params.skill ?? '');
    const level = (Number(params.level) || app.profile.level) as LevelId;
    run = { kind, skill, level, slots: buildSlots(kind, skill, level, app), idx: 0, adapter: new Adapter(startDifficulty(app.profile.skills[skill])), seen: new Set(), attempts: [], coins: 0, badges: [], started: Date.now(), finished: false, placement: [] };
    if (kind === 'final' || kind === 'daily') run.adapter = new Adapter(2);
    const root = h('section', { class: 'quiz-wrap', 'aria-labelledby': 'act-h' });
    nextItem(app, root);
    return root;
  },
};

function titleFor(kind: Kind, skill: string): string {
  const name = SKILL_INDEX[skill]?.name ?? '';
  switch (kind) {
    case 'practice': return `Practice: ${name}`;
    case 'assessment': return `Skill Check: ${name}`;
    case 'review': return `Check-back: ${name}`;
    case 'stories': return 'Math Story Adventure';
    case 'daily': return 'Daily Review';
    case 'final': return 'Level Challenge';
    case 'placement': return 'Find My Level';
  }
}

function nextItem(app: App, root: HTMLElement) {
  const r = run!;
  if (r.idx >= r.slots.length) { finish(app, root); return; }
  const slot = r.slots[r.idx]!;
  const diff: Difficulty = slot.diff ?? r.adapter.diff;
  const q = nextQuestion(slot, diff, r.seen);
  if (!q) {
    // Failure handling: never substitute an unrelated question; skip this slot (unscored) and continue.
    app.logError('generate', new Error(`no validated question for ${slot.skill}`));
    r.slots.splice(r.idx, 1);
    if (!r.slots.length) { clear(root); root.append(app.errorPanel()); r.finished = true; return; }
    nextItem(app, root); return;
  }
  r.seen.add(q.signature);
  renderQuestion(app, root, q, slot);
}

function renderQuestion(app: App, root: HTMLElement, q: Question, slot: Slot) {
  const r = run!;
  clear(root);
  const mascot = MASCOTS.find(m => m.id === app.profile.mascot) ?? MASCOTS[0]!;
  const n = r.slots.length, i = r.idx + 1;
  const pct = Math.round(((i - 1) / n) * 100);
  const coinsEl = h('span', { class: 'num', text: String(r.coins) });
  const top = h('div', { class: 'quiz-top' },
    h('span', { class: 'quiz-mascot', 'aria-hidden': 'true' }, mascot.e),
    h('h2', { id: 'act-h', class: 'q-count', text: `${titleFor(r.kind, r.skill || q.skill)} · ${i} of ${n}` }),
    h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Activity progress', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) }, Object.assign(h('i'), { style: `width:${pct}%` })),
    h('span', { class: 'stat-pill', title: 'Coins earned this round' }, h('span', { 'aria-hidden': 'true' }, '🪙'), coinsEl, h('span', { class: 'sr-only', text: 'coins this round' })));
  root.append(top);

  const isStory = !!q.phases && (r.kind === 'stories' || slot.ctx === 'story' || q.mode === 'story');
  const phases = ['Understand', 'Plan', 'Solve', 'Check', 'Explain'];
  const phaseEl = h('ol', { class: 'phase-steps', 'aria-label': 'Story steps' }, ...phases.map(p => h('li', { text: p })));
  if (isStory) root.append(phaseEl);
  const setPhase = (k: number) => phaseEl.querySelectorAll('li').forEach((li, j) => { li.classList.toggle('now', j === k); li.classList.toggle('done', j < k); if (j === k) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });

  const modeTag: Record<string, string> = { explain: '💬 Explain your thinking', mistake: '🔎 Find the mistake', 'another-way': '🔀 Another way', detective: '🕵️ Math Detective', story: '📖 Story', solve: '' };
  const card = h('div', { class: 'question-card' }, h('span', { class: 'q-badge', text: q.badge }), modeTag[q.mode] && !q.badge.includes(modeTag[q.mode]!.slice(3)) ? h('span', { class: 'mode-tag', text: modeTag[q.mode]! }) : null);
  if (q.story) {
    const storyBox = h('div', { class: 'q-story', text: q.story });
    // In story mode the phase prompt replaces the main prompt, so keep the story's question visible here.
    if (isStory) storyBox.append(h('span', { style: 'display:block;margin-top:8px;font-weight:900', text: `❓ ${q.prompt}` }));
    card.append(storyBox);
  }
  const promptEl = h('div', { class: 'q-prompt', id: 'q-prompt', text: q.prompt });
  card.append(promptEl);
  root.append(card);

  const vis = renderVisual(q.visual);
  const visPanel = h('div', { class: 'visual-panel' });
  if (vis) visPanel.append(vis);
  root.append(visPanel);

  const interWrap = h('div', { id: 'interaction' });
  const fb = h('div', { class: 'feedback', 'aria-live': 'polite', role: 'status' });
  root.append(interWrap, fb);

  let tries = 0, hints = 0, answered = false;
  const qStart = Date.now();
  const hintBtn = btn('💡 Hint', () => showHint(), 'btn btn-sun', { 'aria-keyshortcuts': 'H' });
  const speakBtn = btn('🔊 Read aloud', () => say(`${q.story ?? ''} ${promptEl.textContent ?? ''}`, true), 'btn btn-ghost');
  const nextBtn = btn(r.idx + 1 >= r.slots.length ? 'See results 🎉' : 'Next →', () => { r.idx++; nextItem(app, root); }, 'btn btn-grass btn-lg', { 'aria-keyshortcuts': 'Enter' });
  nextBtn.style.display = 'none';
  const exitBtn = btn('Exit', () => void app.back(), 'btn btn-ghost');
  if (!slot.hintsAllowed) hintBtn.style.display = 'none';
  root.append(h('div', { class: 'q-actions-row' }, hintBtn, speakBtn, nextBtn, exitBtn));
  if (!slot.hintsAllowed) root.append(h('p', { class: 'offline-note', text: r.kind === 'placement' ? 'Just do your best — this helps find a good place to start.' : 'Skill Check: no hints this time. Show what you can do on your own!' }));

  function showHint() {
    if (answered || !slot.hintsAllowed) return;
    const text = q.hints[Math.min(hints, q.hints.length - 1)]!;
    hints++;
    fb.className = 'feedback hint show';
    fb.textContent = `💡 ${text}`;
    say(`Hint. ${text}`);
    if (hints >= q.hints.length) { hintBtn.disabled = true; hintBtn.textContent = '💡 No more hints'; }
    else hintBtn.textContent = '💡 Another hint';
  }

  /* ---- story phases before Solve ---- */
  const startSolve = () => {
    if (isStory) { setPhase(2); promptEl.textContent = q.prompt; }
    mountMain();
  };
  if (isStory && q.phases) {
    const ph = q.phases;
    const runPhase = (k: number, prompt: string, inter: typeof ph.plan.interaction, onDone: () => void, coach: string) => {
      setPhase(k);
      promptEl.textContent = prompt;
      clear(interWrap);
      const view = renderInteraction(inter, resp => {
        const ok = checkResponse(inter, resp).correct;
        if (ok) {
          play('correct');
          view.showResult(true, resp);
          const extra = k === 1 && inter.correct.length > 1 ? ` More than one plan works: ${inter.options.filter(o => inter.correct.includes(o.id)).map(o => o.label).join('  and  ')}.` : '';
          fb.className = 'feedback good show'; fb.textContent = `✓ Yes!${extra}`;
          setTimeout(onDone, extra ? 2200 : 900);
        } else {
          play('try');
          if (resp.type === 'choice') view.eliminate?.(resp.id);
          fb.className = 'feedback hint show'; fb.textContent = `🤔 ${coach}`;
          say(coach);
        }
      });
      interWrap.append(view.el);
      setTimeout(() => view.focus(), 60);
    };
    runPhase(0, ph.understand.prompt, ph.understand.interaction, () =>
      runPhase(1, ph.plan.prompt, ph.plan.interaction, () => { fb.className = 'feedback'; fb.textContent = ''; startSolve(); }, 'Think about what is happening in the story. Which equation matches it?'),
      'Read the question at the end of the story again. What does it ask?');
  } else startSolve();

  function mountMain() {
    clear(interWrap);
    const view: InteractionView = renderInteraction(q.interaction, resp => onAnswer(view, resp));
    interWrap.append(view.el);
    setTimeout(() => { view.focus(); say(`${q.story && !isStory ? q.story + ' ' : ''}${q.prompt}`); }, 250);
  }

  function onAnswer(view: InteractionView, resp: Response) {
    if (answered) return;
    tries++;
    const res = checkResponse(q.interaction, resp);
    if (!res.correct && slot.retryAllowed && tries === 1) {
      play('try');
      view.eliminate?.(resp.type === 'choice' ? resp.id : '');
      const msg = `${pick(TRY_AGAIN)}${res.partial ? ' ' + res.partial : ''}${slot.hintsAllowed ? ' You can tap 💡 Hint if you want help.' : ''}`;
      fb.className = 'feedback hint show'; fb.textContent = msg; say(msg);
      return;
    }
    answered = true;
    view.lock(); view.showResult(res.correct, resp);
    hintBtn.style.display = 'none';
    const att = makeAttempt(q, slot.ctx, { correct: res.correct, tries, hints, ms: Date.now() - qStart });
    const out = recordAttempt(app.profile, q, att);
    r.attempts.push(att);
    r.coins += out.coins; r.badges.push(...out.badges);
    if (r.kind === 'placement') r.placement.push({ level: q.level, correct: res.correct });
    r.adapter.record(res.correct && tries === 1 && hints === 0, res.correct);
    app.save();
    coinsEl.textContent = String(r.coins);
    if (out.badges.length) app.celebrateBadges(out.badges);

    fb.className = `feedback ${res.correct ? 'good' : 'bad'} show`;
    clear(fb);
    if (res.correct) {
      play('correct'); if (out.coins) setTimeout(() => play('coin'), 250);
      const cheer = tries > 1 ? 'You kept trying and got it!' : pick(CHEERS);
      fb.append(h('strong', { class: 'fb-title', text: `${mascot.e} ${cheer}${out.coins ? ` +${out.coins} 🪙` : ''}` }), h('span', { class: 'fb-explain', text: q.explanation }));
      say(`${cheer} ${q.explanation}`);
      app.confetti(10);
    } else {
      play('try');
      const lead = pick(LEARN);
      fb.append(h('strong', { class: 'fb-title', text: lead }), h('span', { class: 'fb-explain', text: `Answer: ${answerLabel(q.interaction)}. ${q.explanation}` }));
      if (q.steps.length) fb.append(h('ol', { class: 'fb-steps' }, ...q.steps.map(s => h('li', { text: s }))));
      say(`${lead} ${q.explanation}`);
    }
    if (isStory && q.phases) { afterSolveStory(); return; }
    nextBtn.style.display = '';
    nextBtn.focus({ preventScroll: true });
  }

  function afterSolveStory() {
    const ph = q.phases!;
    const checkBox = h('div', { class: 'learn-box' }, h('h3', { text: '✅ Check' }), h('p', { style: 'font-weight:800', text: ph.check }), btn('Yes, it makes sense!', () => explain(), 'btn btn-blue'));
    setPhase(3);
    interWrap.append(checkBox);
    (checkBox.querySelector('button') as HTMLButtonElement).focus({ preventScroll: true });
    say(ph.check);
    function explain() {
      setPhase(4);
      checkBox.remove();
      const box = h('div', { class: 'learn-box' }, h('h3', { text: `💬 ${ph.explain.prompt}` }));
      const view = renderInteraction(ph.explain.interaction, resp => {
        if (checkResponse(ph.explain.interaction, resp).correct) {
          view.showResult(true, resp); play('fanfare');
          const p = app.profile; p.counters.stories++;
          const more: Badge[] = [];
          if (p.counters.stories >= 5) { const b = grant(p, 'storyteller'); if (b) more.push(b); }
          app.save(); if (more.length) app.celebrateBadges(more);
          box.append(h('p', { class: 'feedback good show', text: '🎉 Story solved! You understood, planned, solved, checked, and explained.' }));
          app.confetti(24);
          phaseEl.querySelectorAll('li').forEach(li => { li.classList.remove('now'); li.classList.add('done'); });
          nextBtn.style.display = ''; nextBtn.focus({ preventScroll: true });
        } else { play('try'); if (resp.type === 'choice') view.eliminate?.(resp.id); say('Think about why the plan fits the story.'); }
      });
      box.append(view.el);
      interWrap.append(box);
      setTimeout(() => view.focus(), 60);
    }
  }

  root.addEventListener('keydown', e => {
    const t = e.target as HTMLElement;
    if (t.tagName === 'INPUT') return;
    if (/^[1-6]$/.test(e.key)) { const b = root.querySelector<HTMLButtonElement>(`#interaction .answer[data-key="${e.key}"]`); if (b && !b.disabled) { b.click(); e.preventDefault(); } }
    else if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) { if (hintBtn.style.display !== 'none' && !hintBtn.disabled) showHint(); }
    else if (e.key === 'Enter' && nextBtn.style.display !== 'none' && t !== nextBtn) { nextBtn.click(); e.preventDefault(); }
  });
  if (__E2E__) (window as unknown as { __mqTest: unknown }).__mqTest = { question: q, answer: () => q.interaction };
}

/* ------------------------------------------------------------------ results */
function finish(app: App, root: HTMLElement) {
  const r = run!;
  r.finished = true;
  const p = app.profile;
  clear(root);
  const card = h('div', { class: 'results-card', role: 'region', 'aria-labelledby': 'res-h' });
  root.append(card);
  const elapsed = Date.now() - r.started;
  const actions = h('div', { class: 'results-actions' });
  let heading = 'Great work!', icon = '🎉', msg = '';
  const rec = r.skill ? (p.skills[r.skill] ??= emptyRecord()) : null;
  const delayMs = app.state.parent.reviewDelayDays * 86_400_000;

  if (r.kind === 'practice' && rec) {
    const { pct, stars } = roundStars(r.attempts);
    rec.plays++; rec.timeMs += elapsed; rec.bestPct = Math.max(rec.bestPct, pct); rec.stars = Math.max(rec.stars, stars);
    if (r.attempts.filter(a => a.correct).length >= 5) { const b = grant(p, 'streak5'); if (b) r.badges.push(b); }
    if (pct === 100) { const b = grant(p, 'perfect'); if (b) r.badges.push(b); }
    const st = skillState(rec, hasReasoning(r.skill));
    heading = stars >= 2 ? 'Great thinking!' : stars === 1 ? 'Nice effort!' : 'Good practice!';
    icon = stars >= 3 ? '🌟' : stars >= 2 ? '🎉' : '🌱';
    msg = st === 'ready' ? 'You look ready for a Skill Check! Try it without hints.' : 'Every question you try helps your brain grow.';
    card.append(h('div', { class: 'results-stars', 'aria-label': `${stars} of 3 stars` }, ...[0, 1, 2].map(i => h('span', { class: `${i < stars ? 'star-on' : 'star-off'} pop`, 'aria-hidden': 'true' }, i < stars ? '★' : '☆'))));
    if (st === 'ready') actions.append(btn('🏆 Take the Skill Check', () => app.replace('activity', { kind: 'assessment', skill: r.skill, level: r.level }), 'btn btn-grape'));
    actions.append(btn('🔄 Practice again', () => app.replace('activity', { kind: 'practice', skill: r.skill, level: r.level }), 'btn btn-grass'));
  } else if ((r.kind === 'assessment' || r.kind === 'review') && rec) {
    const outc = applyCheck(rec, r.kind, r.attempts, Date.now(), delayMs);
    if (outc.passed && r.kind === 'assessment') { p.counters.checksPassed++; const b = grant(p, 'master'); if (b) r.badges.push(b); }
    if (outc.passed && outc.newState === 'retained') { const b = grant(p, 'remember'); if (b) r.badges.push(b); }
    heading = outc.passed ? (r.kind === 'assessment' ? 'Skill Check passed!' : 'It stuck!') : 'Not yet — and that’s okay!';
    icon = outc.passed ? '🏆' : '🌱';
    msg = outc.message;
    actions.append(btn('📚 Back to the lesson', () => app.replace('lesson', { skill: r.skill }), 'btn btn-blue'));
  } else if (r.kind === 'placement') {
    const lvl = suggestLevel(r.placement);
    const next = (lvl > Math.max(...r.placement.map(x => x.level)) && lvl <= 4) ? lvl : null;
    if (next && r.placement.filter(x => x.level === next).length === 0 && next <= 4 && r.slots.length < 12) {
      // extend placement to the next level adaptively
      r.slots.push(...planSession('placement', PLACEMENT_SKILLS[next][0]!, PLACEMENT_SKILLS[next].slice(1)));
      r.finished = false;
      nextItem(app, root);
      return;
    }
    heading = `We suggest ${LEVELS[lvl - 1]!.label}`;
    icon = LEVELS[lvl - 1]!.emoji;
    msg = `${LEVELS[lvl - 1]!.world} looks like a good place to start. You (or a grown-up) can change this anytime.`;
    actions.append(btn(`Start ${LEVELS[lvl - 1]!.label}`, () => { p.level = lvl; p.placement = { level: lvl, at: Date.now() }; app.save(true); void app.home(); }, 'btn btn-grass btn-lg'));
    LEVELS.filter(L => L.id !== lvl).forEach(L => actions.append(btn(`Choose ${L.label}`, () => { p.level = L.id; app.save(true); void app.home(); }, 'btn btn-ghost')));
  } else {
    const correct = r.attempts.filter(a => a.correct).length;
    heading = r.kind === 'final' ? (correct >= 6 ? 'Level Challenge complete!' : 'Challenge tried — great effort!') : r.kind === 'stories' ? 'Story Adventure complete!' : 'Review complete!';
    icon = r.kind === 'final' && correct >= 6 ? '🏔️' : '🎉';
    if (r.kind === 'final' && correct >= 6) { const b = grant(p, 'boss'); if (b) r.badges.push(b); }
    msg = r.kind === 'stories' ? 'You turned stories into math and checked that your answers made sense.' : 'Mixing skills together helps you remember them.';
    actions.append(btn('🔄 Again', () => app.replace('activity', { kind: r.kind, skill: r.skill, level: r.level }), 'btn btn-grass'));
  }
  p.totals.timeMs += 0;
  app.save(true);
  const correct = r.attempts.filter(a => a.correct).length;
  const indep = r.attempts.filter(a => a.correct && a.firstTry && a.hints === 0).length;
  card.prepend(h('div', { style: 'font-size:3.4rem', 'aria-hidden': 'true' }, icon), h('h2', { id: 'res-h', text: heading }));
  card.append(
    h('p', { class: 'results-msg', text: msg }),
    h('div', { class: 'results-grid' },
      h('div', { class: 'res-stat' }, h('div', { class: 'rs-num', text: `${correct}/${r.attempts.length}` }), h('div', { class: 'rs-lab', text: 'Correct' })),
      h('div', { class: 'res-stat' }, h('div', { class: 'rs-num', text: String(indep) }), h('div', { class: 'rs-lab', text: 'On my own' })),
      h('div', { class: 'res-stat' }, h('div', { class: 'rs-num', text: `+${r.coins} 🪙` }), h('div', { class: 'rs-lab', text: 'Coins' }))),
    ...(r.badges.length ? [h('p', { class: 'new-badge-strip show', text: `New: ${r.badges.map(b => `${b.e} ${b.name}`).join(' · ')}` })] : []),
    actions);
  if (r.skill && r.kind !== 'placement') actions.append(btn('🗺️ Back to the map', () => void app.go('map', { level: SKILL_INDEX[r.skill]?.level ?? r.level }), 'btn btn-blue'));
  else if (r.kind !== 'placement') actions.append(btn('🏠 Home', () => void app.home(), 'btn btn-blue'));
  if (correct >= Math.ceil(r.attempts.length * 0.7)) { play('fanfare'); app.confetti(40); }
  say(`${heading}. ${msg}`);
  app.refreshTopbar();
  (card.querySelector('h2') as HTMLElement).tabIndex = -1;
  (card.querySelector('h2') as HTMLElement).focus();
}

declare const __E2E__: boolean;
