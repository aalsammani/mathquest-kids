/** Grown-ups area (behind the parental gate): profiles, progress, family activities, settings, data. */
import { LEVELS, SKILL_INDEX } from '../../curriculum/levels';
import { FAMILY } from '../../curriculum/lessons';
import type { LevelId } from '../../core/types';
import { attemptsCSV, backupJSON, parseBackup, skillsCSV } from '../../data/export';
import { freshProfile, sanitizeNickname, todayKey } from '../../data/schema';
import { diagnostics } from '../../engine/registry';
import { explainState, isAssisted, isIndependent, recentEvidence, STATE_LABEL, summarize } from '../../learning/mastery';
import { recommend, stateOf } from '../../learning/recommend';
import { grant, MASCOTS } from '../../learning/rewards';
import { saveFile } from '../../platform/native';
import type { App, Screen } from '../app';
import { btn, clear, h } from '../dom';
import { statePill } from './map';

let tab: 'overview' | 'skills' | 'family' | 'settings' | 'data' = 'overview';
let levelTab: LevelId | null = null;

export const ParentScreen: Screen = {
  id: 'parent',
  title: () => 'Grown-Ups Dashboard',
  render(app) {
    const wrap = h('section', { class: 'dash-wrap', 'aria-labelledby': 'pd-h' });
    const body = h('div');
    const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Dashboard sections' });
    const T: [typeof tab, string][] = [['overview', 'Overview'], ['skills', 'Skills'], ['family', 'Family activities'], ['settings', 'Settings'], ['data', 'Data & privacy']];
    const draw = () => {
      clear(tabs); clear(body);
      T.forEach(([id, label]) => { const b = btn(label, () => { tab = id; draw(); }, '', { role: 'tab', 'aria-selected': String(tab === id), id: `tab-${id}` }); tabs.append(b); });
      body.setAttribute('role', 'tabpanel'); body.setAttribute('aria-labelledby', `tab-${tab}`);
      ({ overview, skills, family, settings, data } as const)[tab](app, body, draw);
    };
    wrap.append(h('div', { class: 'screen-head' }, h('h2', { id: 'pd-h', text: '📊 Grown-Ups Dashboard' }), h('p', { text: 'All data stays on this device. Nothing is sent anywhere.' })), profileBar(app, draw), tabs, body);
    draw();
    return wrap;
  },
};

function profileBar(app: App, redraw: () => void): HTMLElement {
  const bar = h('div', { class: 'dash-section' });
  const render = () => {
    clear(bar);
    const list = h('div', { class: 'profile-list', role: 'group', 'aria-label': 'Child profiles' });
    Object.values(app.state.profiles).forEach(p => {
      const m = MASCOTS.find(x => x.id === p.mascot) ?? MASCOTS[0]!;
      list.append(btn(`${m.e} ${p.nickname}`, () => { app.state.activeProfileId = p.id; app.save(true); render(); redraw(); }, `btn btn-sm ${p.id === app.state.activeProfileId ? 'btn-blue' : 'btn-ghost'}`, { 'aria-pressed': String(p.id === app.state.activeProfileId) }));
    });
    list.append(btn('+ Add child', () => {
      const input = h('input', { type: 'text', class: 'gate-input', maxlength: '18', 'aria-label': 'Nickname', placeholder: 'Nickname' });
      app.modal({ title: 'Add a child profile', body: h('div', {}, h('p', { class: 'note', text: 'Use a nickname. No other information is needed.' }), input), actions: [{ label: 'Add', cls: 'btn btn-grass', onClick: () => { const np = freshProfile(sanitizeNickname(input.value)); app.state.profiles[np.id] = np; app.state.activeProfileId = np.id; app.save(true); render(); redraw(); } }] });
    }, 'btn btn-sm btn-grass'));
    bar.append(h('h3', { text: 'Child profiles' }), list);
  };
  render();
  return bar;
}

function overview(app: App, el: HTMLElement) {
  const p = app.profile;
  const all = Object.values(p.skills).flatMap(r => r.attempts);
  const ind = all.filter(isIndependent).length, asst = all.filter(isAssisted).length;
  const week = new Set(Array.from({ length: 7 }, (_, i) => todayKey(new Date(Date.now() - i * 86_400_000))));
  const daysThisWeek = p.practiceDays.filter(d => week.has(d)).length;
  const hinted = all.filter(a => a.hints > 0).length;
  const reasoning = p.counters.explain + p.counters.mistake + p.counters.anotherWay + p.counters.detective;
  const card = (n: string, lab: string) => h('div', { class: 'dash-card' }, h('div', { class: 'dc-num', text: n }), h('div', { class: 'dc-lab', text: lab }));
  const mastered = LEVELS.flatMap(l => l.skills).filter(s => ['provisional', 'retained'].includes(stateOf(p.skills, s.id))).length;
  el.append(
    h('div', { class: 'dash-cards' },
      card(`Level ${p.level}`, 'Current level'),
      card(String(p.totals.answered), 'Questions answered'),
      card(`${ind} / ${asst}`, 'Solved alone / with help'),
      card(String(reasoning), 'Reasoning tasks solved'),
      card(String(p.counters.stories), 'Stories completed'),
      card(`${daysThisWeek} of 7`, 'Days practiced this week'),
      card(String(mastered), 'Skill Checks passed'),
      card(`${Math.round(p.totals.timeMs / 60000)} min`, 'Time in questions')),
    h('div', { class: 'dash-section' },
      h('h3', { text: 'Suggested next steps' }),
      h('p', { class: 'note', text: 'These suggestions come from simple, documented rules (not artificial intelligence). They use only answers given in this app.' }),
      ...recommend(p.skills, p.level, Date.now(), app.state.parent.reviewDelayDays * 86_400_000).slice(0, 5).map(r => h('div', { class: 'reco' }, h('strong', { text: `${SKILL_INDEX[r.skill]!.name}: ` }), r.reason))),
    h('div', { class: 'dash-section' },
      h('h3', { text: 'How to read this' }),
      h('p', { class: 'note', text: `“Solved alone” means correct on the first try without a hint. Hints and second tries are healthy parts of learning, so they are shown separately — not as failures. ${hinted ? `Hints were used on ${hinted} of ${all.length} recent questions.` : ''} Scores describe recent answers in this app; they are not a test of overall math ability.` })),
    recentActivity(p.history.slice(0, 15)));
}

function recentActivity(hist: ReturnType<App['profile']['history']['slice']>): HTMLElement {
  const t = h('table', { class: 'skill-table' }, h('thead', {}, h('tr', {}, ...['When', 'Skill', 'Activity', 'Result'].map(x => h('th', { scope: 'col', text: x })))));
  const tb = h('tbody');
  hist.forEach(x => tb.append(h('tr', {}, h('td', { text: new Date(x.d).toLocaleDateString() }), h('td', { text: SKILL_INDEX[x.skill]?.name ?? x.skill }), h('td', { text: `${x.legacy ? 'earlier version' : x.ctx}${x.mode !== 'solve' ? ' · ' + x.mode : ''}` }), h('td', { text: x.ok ? (x.hinted || x.tries > 1 ? '✓ with help' : '✓ on own') : 'not yet' }))));
  if (!hist.length) tb.append(h('tr', {}, h('td', { colspan: '4', text: 'No activity yet.' })));
  t.append(tb);
  return h('div', { class: 'dash-section' }, h('h3', { text: 'Recent activity' }), h('div', { style: 'overflow-x:auto' }, t));
}

function skills(app: App, el: HTMLElement) {
  const p = app.profile;
  const lv = levelTab ?? p.level;
  const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Levels' });
  LEVELS.forEach(L => tabs.append(btn(L.label, () => { levelTab = L.id; clear(el); skills(app, el); }, '', { role: 'tab', 'aria-selected': String(L.id === lv) })));
  const L = LEVELS.find(x => x.id === lv)!;
  const t = h('table', { class: 'skill-table' }, h('thead', {}, h('tr', {}, ...['Skill', 'Status', 'Recent evidence', 'Standards (approx.)'].map((x, i) => h('th', { scope: 'col', class: i === 3 ? 'hide-sm' : '', text: x })))));
  const tb = h('tbody');
  L.skills.forEach(s => {
    const rec = p.skills[s.id];
    const st = stateOf(p.skills, s.id);
    const ev = rec ? summarize(recentEvidence(rec)) : null;
    tb.append(h('tr', {},
      h('td', {}, h('strong', { text: `${s.icon} ${s.name}` }), h('div', { class: 'why', text: s.objective })),
      h('td', {}, statePill(st), h('div', { class: 'why', text: explainState(rec, st) })),
      h('td', { text: ev && ev.items ? `${Math.round(ev.independentWeighted * 10) / 10} alone · ${ev.assistedCorrect} with help · ${ev.incorrect} not yet` : rec?.legacy ? `Earlier version: ${rec.legacy.correct}/${rec.legacy.attempts} correct` : '—' }),
      h('td', { class: 'hide-sm', text: s.ccss.join(', ') })));
  });
  t.append(tb);
  el.append(tabs, h('div', { class: 'dash-section' },
    h('h3', { text: `${L.label} · ${L.world}` }),
    h('p', { class: 'note', text: `${L.focus}. Parent note: ${L.approxStandards}. Levels describe skills, not grades — children can work at any level.` }),
    h('div', { style: 'overflow-x:auto' }, t),
    h('p', { class: 'note', style: 'margin-top:10px', text: `Status meanings: ${Object.values(STATE_LABEL).join(' → ')}. A Skill Check is short and hint-free; a check-back after time away shows whether learning lasted. These are provisional rules, not a clinical or standardized assessment.` })));
}

function family(app: App, el: HTMLElement) {
  const p = app.profile;
  el.append(h('div', { class: 'dash-section' }, h('h3', { text: 'Math together, away from the screen' }), h('p', { class: 'note', text: 'Free activities with things you already have. Pick one that fits your child’s level — or any level for fun.' }),
    ...FAMILY.map(f => {
      const done = p.familyDone.includes(f.id);
      return h('div', { class: 'family-card' }, h('h4', { text: `${f.emoji} ${f.title} · Level ${f.level}` }), h('ol', {}, ...f.steps.map(s => h('li', { text: s }))), h('p', { class: 'talk', text: `Talk about it: ${f.talk}` }),
        btn(done ? '✓ We did this' : 'Mark as done', () => { if (!done) { p.familyDone.push(f.id); const b = grant(p, 'family'); app.save(); if (b) app.celebrateBadges([b]); clear(el); family(app, el); } }, `btn btn-sm ${done ? 'btn-ghost' : 'btn-grass'}`, done ? { disabled: true } : {}));
    })));
}

function settings(app: App, el: HTMLElement, redraw: () => void) {
  const p = app.profile, pa = app.state.parent;
  const sel = (id: string, label: string, value: string, opts: [string, string][], on: (v: string) => void) => {
    const s = h('select', { id }, ...opts.map(([v, t]) => h('option', { value: v, ...(v === value ? { selected: true } : {}) }, t)));
    s.addEventListener('change', () => { on(s.value); app.save(true); app.toast('Saved'); });
    return h('div', { class: 'form-row' }, h('label', { for: id, text: label }), s);
  };
  const nick = h('input', { type: 'text', id: 'pn', maxlength: '18', value: p.nickname });
  nick.addEventListener('change', () => { p.nickname = sanitizeNickname(nick.value); nick.value = p.nickname; app.save(true); });
  el.append(h('div', { class: 'dash-section' }, h('h3', { text: `Settings for ${p.nickname}` }),
    h('div', { class: 'form-row' }, h('label', { for: 'pn', text: 'Nickname' }), nick),
    sel('plv', 'Learning level', String(p.level), LEVELS.map(L => [String(L.id), `${L.label} · ${L.world}`]), v => { p.level = Number(v) as LevelId; })),
    h('div', { class: 'dash-section' }, h('h3', { text: 'Family settings (all profiles)' }),
      sel('brk', 'Break reminder', String(pa.breakMinutes), [['0', 'Off'], ['10', 'Every 10 minutes'], ['15', 'Every 15 minutes'], ['20', 'Every 20 minutes'], ['30', 'Every 30 minutes']], v => { pa.breakMinutes = Number(v) as never; }),
      sel('rvd', 'Check-back after a Skill Check', String(pa.reviewDelayDays), [['1', '1 day later'], ['3', '3 days later'], ['7', '7 days later']], v => { pa.reviewDelayDays = Number(v) as never; }),
      sel('tg', 'Timed games', pa.timedGames ? '1' : '0', [['0', 'Off (relaxed play)'], ['1', 'On (60-second Balloon Pop)']], v => { pa.timedGames = v === '1'; }),
      h('p', { class: 'note', text: 'Timers are never used in lessons, practice, or Skill Checks. Speed is not used to judge understanding.' })),
    h('div', { class: 'dash-section' }, h('h3', { text: 'Remove this profile' }),
      btn(`Delete ${p.nickname}'s profile`, () => void app.confirm(`Delete ${p.nickname}'s profile and all of its progress on this device? This cannot be undone.`, 'Delete', 'Keep').then(yes => {
        if (!yes) return;
        delete app.state.profiles[p.id];
        if (!Object.keys(app.state.profiles).length) { const np = freshProfile(); app.state.profiles[np.id] = np; }
        app.state.activeProfileId = Object.keys(app.state.profiles)[0]!;
        app.save(true); app.toast('Profile deleted'); redraw(); app.refreshTopbar();
      }), 'btn btn-coral btn-sm')));
}

function data(app: App, el: HTMLElement) {
  const p = app.profile;
  const fileIn = h('input', { type: 'file', accept: 'application/json,.json', 'aria-label': 'Choose a MathQuest backup file', style: 'max-width:100%' });
  fileIn.addEventListener('change', async () => {
    const f = fileIn.files?.[0]; if (!f) return;
    try {
      const st = parseBackup(await f.text());
      if (!(await app.confirm(`Restore this backup? It contains ${Object.keys(st.profiles).length} profile(s) and will REPLACE the data on this device.`, 'Restore', 'Cancel'))) return;
      app.store.state = st; app.save(true); app.toast('Backup restored'); void app.home();
    } catch (e) { app.modal({ title: 'Could not restore', body: (e as Error).message }); }
  });
  const dl = async (name: string, mime: string, text: string) => { const r = await saveFile(name, mime, text); app.toast(r === 'failed' ? 'Sorry — the file could not be saved.' : 'File ready'); };
  const stamp = todayKey();
  el.append(
    h('div', { class: 'dash-section' }, h('h3', { text: 'Export & back up' }),
      h('p', { class: 'note', text: 'CSV files open in spreadsheet apps. A backup file can restore progress on this or another device.' }),
      h('div', { class: 'dash-actions' },
        btn('⬇️ Skills report (CSV)', () => void dl(`mathquest-${p.nickname}-skills-${stamp}.csv`, 'text/csv', skillsCSV(p)), 'btn btn-ghost'),
        btn('⬇️ Activity log (CSV)', () => void dl(`mathquest-${p.nickname}-activity-${stamp}.csv`, 'text/csv', attemptsCSV(p)), 'btn btn-ghost'),
        btn('💾 Full backup (all profiles)', () => void dl(`mathquest-backup-${stamp}.json`, 'application/json', backupJSON(app.state)), 'btn btn-blue'),
        btn('🖨️ Print report', () => printReport(app), 'btn btn-ghost'))),
    h('div', { class: 'dash-section' }, h('h3', { text: 'Restore from a backup' }), fileIn),
    h('div', { class: 'dash-section' }, h('h3', { text: 'Privacy' }),
      h('p', { class: 'note', text: 'MathQuest Kids has no accounts, ads, analytics, or trackers, and makes no network requests. It stores only a nickname, mascot choices, settings, and answers given in the app — on this device only. It does not use the camera, microphone, contacts, or location. Read-aloud uses the device’s built-in speech voice.' }),
      h('p', { class: 'note', text: `App version ${__APP_VERSION__}. Storage: ${app.store.kv.kind === 'native' ? 'app storage on this device' : 'this browser’s local storage'}.` })),
    h('div', { class: 'dash-section' }, h('h3', { text: 'Delete all data' }),
      h('p', { class: 'note', text: 'Erases every profile, setting, and backup copy kept by MathQuest on this device, including data from the earlier version.' }),
      btn('Erase everything', () => void app.confirm('Erase ALL MathQuest data on this device? This cannot be undone. Consider making a backup first.', 'Erase everything', 'Cancel').then(async yes => { if (!yes) return; await app.store.eraseAll(); window.location.reload(); }), 'btn btn-coral')),
    h('div', { class: 'dash-section' }, h('h3', { text: 'Diagnostics (stays on this device)' }),
      h('p', { class: 'note', text: 'If a question could not be generated or checked, it was skipped and not scored. These notes contain no personal information.' }),
      h('div', { class: 'diag', text: [...diagnostics().map(d => `${new Date(d.t).toISOString()} ${d.skill} ${d.generator} seed=${d.seed}: ${d.issue}`), ...app.diag.map(d => `${new Date(d.t).toISOString()} ${d.where}: ${d.message}`)].join('\n') || 'No problems recorded.' })));
}

function printReport(app: App) {
  const p = app.profile;
  const w = document.getElementById('print-area')!;
  clear(w);
  w.append(h('h1', { text: `MathQuest Kids — Progress report for ${p.nickname}` }), h('p', { text: `${new Date().toLocaleDateString()} · Level ${p.level} · ${p.totals.answered} questions answered` }),
    h('p', { text: 'Status describes recent answers in this app using simple rules; it is not a standardized assessment.' }));
  LEVELS.forEach(L => {
    const rows = L.skills.filter(s => p.skills[s.id]).map(s => h('tr', {}, h('td', { text: s.name }), h('td', { text: STATE_LABEL[stateOf(p.skills, s.id)] }), h('td', { text: explainState(p.skills[s.id], stateOf(p.skills, s.id)) })));
    if (rows.length) w.append(h('h2', { text: `${L.label} · ${L.world}` }), h('table', {}, h('tr', {}, h('th', { text: 'Skill' }), h('th', { text: 'Status' }), h('th', { text: 'Evidence' })), ...rows));
  });
  document.body.classList.add('printing');
  window.print();
  setTimeout(() => document.body.classList.remove('printing'), 500);
}

declare const __APP_VERSION__: string;
