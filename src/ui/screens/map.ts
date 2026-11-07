import { LEVELS, SKILL_INDEX } from '../../curriculum/levels';
import { LESSONS } from '../../curriculum/lessons';
import type { LevelId } from '../../core/types';
import { reviewDue, STATE_LABEL, type MasteryState } from '../../learning/mastery';
import { recommend, stateOf } from '../../learning/recommend';
import type { Screen } from '../app';
import { btn, h } from '../dom';
import { play, say } from '../media';
import { renderVisual } from '../visuals';

const STATE_ICON: Record<MasteryState, string> = { 'not-started': '○', learning: '🌱', practicing: '🌿', ready: '🏁', provisional: '🏆', retained: '🧠' };
export const statePill = (s: MasteryState) => h('span', { class: `state-pill st-${s}` }, h('span', { 'aria-hidden': 'true' }, STATE_ICON[s]), STATE_LABEL[s]);

export const MapScreen: Screen = {
  id: 'map',
  title: (_a, p) => { const L = LEVELS.find(l => l.id === Number(p.level))!; return `${L.label}: ${L.world}`; },
  render(app, params) {
    const L = LEVELS.find(l => l.id === Number(params.level)) ?? LEVELS[0]!;
    const p = app.profile;
    if (!p.counters.worlds.includes(L.id)) { p.counters.worlds.push(L.id); app.save(); }
    const recs = recommend(p.skills, L.id, Date.now(), app.state.parent.reviewDelayDays * 86_400_000);
    const recSkill = recs[0]?.skill;
    const trail = h('div', { class: 'trail-wrap', role: 'list', 'aria-label': `${L.label} skills` });
    L.skills.forEach(s => {
      const st = stateOf(p.skills, s.id);
      const rec = p.skills[s.id];
      const stars = rec?.stars ?? 0;
      const due = reviewDue(rec, Date.now(), app.state.parent.reviewDelayDays * 86_400_000);
      const node = h('button', { class: 'map-node', type: 'button' },
        p.legacyTrophies?.includes(s.id) || st === 'provisional' || st === 'retained' ? h('span', { class: 'n-trophy', 'aria-hidden': 'true' }, st === 'retained' ? '🧠' : '🏆') : null,
        h('span', { class: 'n-icon', 'aria-hidden': 'true' }, s.icon),
        h('span', {}, h('span', { class: 'n-name', text: s.name }), h('span', { class: 'sr-only', text: '. ' }), h('span', { class: 'n-desc', text: s.desc }), h('span', { class: 'sr-only', text: '.' }),
          h('span', { class: 'n-stars', 'aria-hidden': 'true' }, ...[0, 1, 2].map(i => h('span', { class: i < stars ? 'star-on' : 'star-off' }, i < stars ? '★' : '☆'))), h('span', { class: 'sr-only', text: ` ${stars} of 3 stars.` }),
          h('span', { class: 'n-state' }, statePill(st), due ? h('span', { class: 'state-pill st-ready', style: 'margin-left:4px' }, '⏰ Check-back') : null, s.id === recSkill ? h('span', { class: 'state-pill st-practicing', style: 'margin-left:4px' }, '👉 Next') : null)));
      node.addEventListener('click', () => { play('click'); void app.go('lesson', { skill: s.id }); });
      trail.append(h('div', { class: 'map-node-row', role: 'listitem' }, node));
    });
    const final = h('button', { class: 'map-node final', type: 'button' }, h('span', { class: 'n-icon', 'aria-hidden': 'true' }, '🏔️'), h('span', {}, h('span', { class: 'n-name', text: `${L.label} Challenge` }), h('span', { class: 'sr-only', text: '. ' }), h('span', { class: 'n-desc', text: 'Mixed questions from the whole world' }), p.badges.boss ? h('span', { class: 'n-state' }, h('span', { class: 'state-pill st-provisional' }, '🏔️ Summit reached')) : null));
    final.addEventListener('click', () => void app.go('activity', { kind: 'final', skill: '', level: L.id }));
    trail.append(h('div', { class: 'map-node-row', role: 'listitem' }, final));
    return h('section', { 'aria-labelledby': 'map-h' },
      h('div', { class: `world-banner ${L.cls}` }, h('h2', { id: 'map-h', text: `${L.emoji} ${L.label} · ${L.world}` }), h('p', { text: `${L.title} — ${L.focus}` })),
      h('div', { class: 'legend', 'aria-label': 'What the map symbols mean' }, ...(['learning', 'practicing', 'ready', 'provisional', 'retained'] as MasteryState[]).map(statePill)),
      h('div', { class: 'map-tools' },
        btn('📖 Story Adventures', () => void app.go('activity', { kind: 'stories', skill: `L${L.id}-stories`, level: L.id }), 'btn btn-sun btn-sm'),
        btn('🔁 Daily Review', () => void app.go('activity', { kind: 'daily', skill: '', level: L.id }), 'btn btn-ghost btn-sm'),
        p.level !== L.id ? btn(`⭐ Make ${L.label} my level`, () => { p.level = L.id as LevelId; app.save(); app.toast(`${L.label} is now your level.`); app.rerender(); }, 'btn btn-ghost btn-sm') : null),
      trail);
  },
};

export const LessonScreen: Screen = {
  id: 'lesson',
  title: (_a, p) => SKILL_INDEX[String(p.skill)]?.name ?? 'Lesson',
  render(app, params) {
    const s = SKILL_INDEX[String(params.skill)]!;
    const L = LESSONS[s.id]!;
    const p = app.profile;
    const st = stateOf(p.skills, s.id);
    const rec = p.skills[s.id];
    const due = reviewDue(rec, Date.now(), app.state.parent.reviewDelayDays * 86_400_000);
    const steps = h('ol', {}, ...L.worked.steps.map((t, i) => h('li', { class: i === 0 ? '' : 'hidden', text: t })));
    let shown = 1;
    const nextStep = btn('Show next step ▶', () => {
      const items = steps.querySelectorAll('li');
      if (shown < items.length) { items[shown]!.classList.remove('hidden'); say(items[shown]!.textContent ?? ''); shown++; }
      if (shown >= items.length) { nextStep.disabled = true; nextStep.textContent = 'All steps shown ✓'; }
    }, 'btn btn-ghost btn-sm');
    const demo = renderVisual(L.demo);
    const isStory = s.id.endsWith('stories');
    const actions = h('div', { class: 'lesson-actions' },
      btn(isStory ? '📖 Start a story' : '🚀 Practice', () => void app.go('activity', { kind: isStory ? 'stories' : 'practice', skill: s.id, level: s.level }), 'btn btn-grass btn-lg'),
      st === 'ready' || st === 'provisional' || st === 'retained' ? btn('🏆 Skill Check', () => void app.go('activity', { kind: 'assessment', skill: s.id, level: s.level }), 'btn btn-grape btn-lg') : null,
      due ? btn('🧠 Check-back', () => void app.go('activity', { kind: 'review', skill: s.id, level: s.level }), 'btn btn-blue btn-lg') : null,
      btn('← Back to the map', () => void app.back(), 'btn btn-ghost'));
    const status = st === 'ready' ? 'You look ready for a Skill Check — no hints, just your own thinking!'
      : st === 'provisional' ? (due ? 'Time for a check-back to see if it stuck!' : 'Skill Check passed! A check-back will unlock after some time.')
      : st === 'retained' ? 'You passed a check-back. Keep it fresh with Daily Review!'
      : st === 'not-started' ? 'Start with the example, then practice.' : 'Practice with pictures and hints. Harder and reasoning questions come next.';
    setTimeout(() => say(`${s.name}. ${L.big} ${L.intro.join(' ')}`), 300);
    return h('section', { class: 'lesson-card', 'aria-labelledby': 'les-h' },
      h('span', { class: 'l-icon', 'aria-hidden': 'true' }, s.icon),
      h('h2', { id: 'les-h', text: s.name }),
      h('p', { class: 'l-blurb', text: s.objective }),
      statePill(st),
      h('div', { class: 'big-idea', text: `💡 Big idea: ${L.big}` }),
      h('div', { class: 'learn-box' }, h('h3', { text: 'How it works' }), demo ? h('div', { class: 'lb-visual' }, demo) : null, h('p', { style: 'text-align:center;font-weight:800;color:#6B4E00;font-size:.92rem;margin-top:6px', text: L.caption }), h('ol', {}, ...L.intro.map(t => h('li', { text: t })))),
      h('div', { class: 'worked' }, h('h3', { text: `👀 Worked example: ${L.worked.problem}` }), steps, h('div', { style: 'margin-top:8px' }, nextStep)),
      L.vocab ? h('div', { class: 'vocab', 'aria-label': 'Math words' }, ...L.vocab.map(v => h('span', { text: v }))) : null,
      h('p', { class: 'lesson-status', text: status }),
      actions);
  },
};
