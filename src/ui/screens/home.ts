import { LEVELS, SKILL_INDEX } from '../../curriculum/levels';
import type { LevelId } from '../../core/types';
import { sanitizeNickname } from '../../data/schema';
import { recommend, stateOf } from '../../learning/recommend';
import { MASCOTS } from '../../learning/rewards';
import type { App, Screen } from '../app';
import { btn, h } from '../dom';
import { onSpeechStatus, play, say, speechController, stopVoice, voiceAvailable } from '../media';

export const HomeScreen: Screen = {
  id: 'home',
  title: () => 'Home',
  render(app) {
    const p = app.profile;
    const m = MASCOTS.find(x => x.id === p.mascot) ?? MASCOTS[0]!;
    const grid = h('div', { class: 'grade-grid', role: 'list' });
    for (const L of LEVELS) {
      const total = L.skills.length;
      const done = L.skills.filter(s => ['provisional', 'retained'].includes(stateOf(p.skills, s.id))).length;
      const started = L.skills.filter(s => stateOf(p.skills, s.id) !== 'not-started').length;
      const sr = (t: string) => h('span', { class: 'sr-only', text: t });
      const card = h('button', { class: `grade-card ${L.cls}${p.level === L.id ? ' recommended' : ''}`, type: 'button' },
        h('span', { class: 'g-emoji', 'aria-hidden': 'true' }, L.emoji),
        h('span', { class: 'g-name', text: L.label }), sr(': '),
        h('span', { class: 'g-world', text: L.world }), sr('. '),
        h('span', { class: 'g-sub', text: L.title }), sr(`. ${done} of ${total} skills mastered. `),
        h('span', { class: 'g-progress', 'aria-hidden': 'true' }, Object.assign(h('i'), { style: `width:${total ? ((done + started * 0.25) / total) * 100 : 0}%` })));
      card.addEventListener('click', () => { play('click'); void app.go('map', { level: L.id }); });
      grid.append(h('div', { role: 'listitem', style: 'display:grid' }, card));
    }
    const recs = recommend(p.skills, p.level, Date.now(), app.state.parent.reviewDelayDays * 86_400_000);
    const top = recs[0];
    const reco = top ? h('div', { class: 'home-reco' }, btn(h('span', { style: 'display:flex;gap:12px;align-items:center' }, h('span', { class: 'rc-icon', 'aria-hidden': 'true' }, top.kind === 'check-back' ? '🧠' : top.kind === 'skill-check' ? '🏆' : top.kind === 'explore' ? '🧭' : '🌱'), h('span', {}, h('strong', { text: `Next stop: ${SKILL_INDEX[top.skill]!.name}` }), h('br'), h('span', { style: 'font-weight:700', text: kidReason(top.kind) }))), () => void app.go('lesson', { skill: top.skill }), 'reco-card')) : null;

    const link = (icon: string, label: string, go: () => void) => btn(h('span', {}, h('span', { class: 'hl-icon', 'aria-hidden': 'true' }, icon), label), go, 'home-link');
    return h('section', { 'aria-labelledby': 'home-h' },
      h('div', { class: 'hero' },
        h('span', { class: 'mascot-big', 'aria-hidden': 'true' }, m.e),
        h('h2', { id: 'home-h', text: `Hi, ${p.nickname}! Ready for a math adventure?` }),
        h('p', { class: 'tag', text: 'Pick a level, follow the trail, and explain your thinking. Mistakes help your brain grow!' }),
        grid, reco),
      h('div', { class: 'home-links' },
        link('📖', 'Math Story Adventures', () => void app.go('stories')),
        link('🧰', 'Math Tools', () => void app.go('tools')),
        link('🔁', 'Daily Review', () => void app.go('activity', { kind: 'daily', skill: '', level: p.level })),
        link('🎮', 'Game Room', () => void app.go('games')),
        link('🏅', 'My Collection', () => void app.go('collection')),
        link('📊', 'Grown-Ups', () => void app.gate('open the family dashboard').then(ok => { if (ok) void app.go('parent'); }))),
      h('p', { class: 'home-foot', text: 'MathQuest Kids · No ads · No accounts · Works offline · Created by Abdallah Alsammani' }));
  },
};

function kidReason(kind: string): string {
  switch (kind) {
    case 'check-back': return 'Do you still remember it? Let’s check!';
    case 'skill-check': return 'You are ready for a Skill Check!';
    case 'prerequisite': return 'A quick review will make the next step easier.';
    case 'explore': return 'A new place to explore on the map.';
    case 'review': return 'Keep this skill fresh.';
    default: return 'Keep practicing — you are growing!';
  }
}

/* ------------------------------------------------------------------ onboarding */
export const WelcomeScreen: Screen = {
  id: 'welcome',
  title: () => 'Welcome',
  render(app) {
    let mascot = 'fox';
    const nick = h('input', { id: 'nick', class: 'gate-input', maxlength: '18', placeholder: 'Explorer', autocomplete: 'off', 'aria-describedby': 'nick-help' });
    const mascots = h('div', { class: 'tf-row', style: 'grid-template-columns:repeat(3,1fr);max-width:360px', role: 'radiogroup', 'aria-label': 'Choose your guide' });
    MASCOTS.filter(x => x.price === 0 || x.id === 'owl' || x.id === 'panda').forEach(x => {
      const b = h('button', { class: 'answer' + (x.id === mascot ? ' is-selected' : ''), type: 'button', role: 'radio', 'aria-checked': String(x.id === mascot), 'aria-label': x.name }, x.e);
      b.addEventListener('click', () => { mascot = x.id; mascots.querySelectorAll('button').forEach(o => { o.classList.toggle('is-selected', o === b); o.setAttribute('aria-checked', String(o === b)); }); play('click'); });
      mascots.append(b);
    });
    const finish = (level: LevelId | 'placement') => {
      const p = app.profile;
      p.nickname = sanitizeNickname(nick.value || 'Explorer');
      p.mascot = mascot;
      if (!p.unlocked.includes(mascot)) p.unlocked.push(mascot);
      app.state.onboarded = true;
      if (level !== 'placement') p.level = level;
      app.save(true);
      if (level === 'placement') void app.go('activity', { kind: 'placement', skill: '', level: 1 });
      else void app.home();
    };
    const levelBtns = h('div', { class: 'lesson-actions' }, ...LEVELS.map(L => btn(`${L.emoji} ${L.label}`, () => finish(L.id), `btn btn-ghost`, { 'aria-label': `Start at ${L.label}, ${L.world}` })));
    return h('section', { class: 'lesson-card', 'aria-labelledby': 'w-h' },
      h('span', { class: 'l-icon', 'aria-hidden': 'true' }, '🧮'),
      h('h2', { id: 'w-h', text: 'Welcome to MathQuest Kids!' }),
      h('p', { class: 'l-blurb', text: 'A math adventure where you think, explain, and solve. Everything stays on this device.' }),
      h('div', { class: 'learn-box' },
        h('label', { for: 'nick', style: 'font-weight:900;display:block;margin-bottom:6px', text: 'What should we call you? (a nickname is fine)' }), nick,
        h('p', { id: 'nick-help', class: 'offline-note', text: 'Optional. Please do not type a full name.' }),
        h('p', { style: 'font-weight:900;margin:14px 0 6px', text: 'Choose a guide:' }), mascots),
      h('div', { class: 'learn-box' },
        h('h3', { text: 'Where should we start?' }),
        h('p', { style: 'font-weight:700;color:var(--ink-soft)', text: 'Levels are about skills, not age. Try a short check to find a good starting level, or pick one yourself. A grown-up can change it anytime.' }),
        h('div', { class: 'lesson-actions' }, btn('🧭 Find my level', () => finish('placement'), 'btn btn-grape btn-lg')), levelBtns),
      voiceAvailable() ? h('p', { class: 'offline-note', text: 'Tip: tap 🔊 Listen on any question to hear it.' }) : null);
  },
};

/* ------------------------------------------------------------------ settings (child-safe) */
export function openSettings(app: App) {
  const s = app.state.settings;
  const row = (key: keyof typeof s, label: string, sub: string) => {
    const id = `set-${key}`;
    const input = h('input', { type: 'checkbox', id, ...(s[key] ? { checked: true } : {}) });
    input.addEventListener('change', () => { (s as unknown as Record<string, unknown>)[key] = input.checked; app.applySettings(); app.save(); if (key === 'voice' && input.checked) say('Read aloud is on.', true); });
    return h('div', { class: 'setting-row' }, h('div', {}, h('label', { for: id, class: 'sr-lab', text: label }), h('span', { class: 'sr-sub', text: sub })), h('span', { class: 'toggle' }, input, h('span', { class: 'tr', 'aria-hidden': 'true' })));
  };
  const vol = h('input', { type: 'range', min: '0', max: '1', step: '0.1', value: String(s.volume), id: 'set-vol', 'aria-label': 'Sound effects volume' });
  vol.addEventListener('input', () => { s.volume = Number(vol.value); app.save(); });
  const close = app.modal({ title: '⚙️ Settings', body: h('div', {},
    row('sound', 'Sound effects', 'Gentle sounds for buttons and answers'),
    h('div', { class: 'setting-row' }, h('div', {}, h('label', { for: 'set-vol', class: 'sr-lab', text: 'Sound effects volume' }), h('span', { class: 'sr-sub', text: 'Reading aloud uses the device volume' })), vol),
    voicePanel(app),
    row('large', 'Large text', 'Bigger letters everywhere'),
    row('motion', 'Calm mode', 'Turns off moving decorations and confetti'),
    row('contrast', 'High contrast', 'Stronger colors for easier reading'),
    h('p', { class: 'offline-note', text: 'Grown-ups can find more settings in the Grown-Ups area.' })),
    onClose: () => unsub() });
  void close;
}

let unsub: () => void = () => {};
/** Read-aloud settings: on/off, speed, voice choice (when there is a real choice), test, live status. */
function voicePanel(app: App): HTMLElement {
  const s = app.state.settings;
  const box = h('div', { class: 'voice-panel', role: 'group', 'aria-labelledby': 'vp-h' }, h('h3', { id: 'vp-h', class: 'vp-title', text: '🔊 Read aloud' }));
  if (!voiceAvailable()) {
    box.append(h('p', { class: 'sr-sub', text: 'Read aloud is not available in this browser. All words stay on the screen.' }));
    return box;
  }
  const auto = h('input', { type: 'checkbox', id: 'set-voice', ...(s.voice ? { checked: true } : {}) });
  auto.addEventListener('change', () => { s.voice = auto.checked; app.save(); if (s.voice) say('Read aloud is on.', true); else stopVoice(); });
  box.append(h('div', { class: 'setting-row' }, h('div', {}, h('label', { for: 'set-voice', class: 'sr-lab', text: 'Read questions aloud' }), h('span', { class: 'sr-sub', text: 'Questions and feedback are read out loud. You can always tap 🔊 Listen.' })), h('span', { class: 'toggle' }, auto, h('span', { class: 'tr', 'aria-hidden': 'true' }))));

  const speed = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Speech speed' });
  const speedBtn = (slow: boolean, label: string) => {
    const b = h('button', { type: 'button', class: 'seg-btn', role: 'radio', 'aria-checked': String(s.slow === slow) }, label);
    b.addEventListener('click', () => { s.slow = slow; app.save(); speed.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x === b))); say(slow ? 'This is the slow speed.' : 'This is the normal speed.', true); });
    return b;
  };
  speed.append(speedBtn(true, '🐢 Slow'), speedBtn(false, '🐇 Normal'));
  box.append(h('div', { class: 'setting-row' }, h('div', {}, h('span', { class: 'sr-lab', text: 'Speed' }), h('span', { class: 'sr-sub', text: 'Slow is easier for new readers' })), speed));

  const sc = speechController();
  const voices = sc?.listVoices() ?? [];
  if (sc && voices.length > 1) {
    const sel = h('select', { id: 'set-voicename', class: 'gate-input', style: 'max-width:260px' });
    const chosen = sc.currentVoice(s.voiceName);
    sel.append(h('option', { value: '', text: `Automatic${chosen ? ` (${chosen.name})` : ''}` }));
    voices.forEach(v => sel.append(h('option', { value: v.voiceURI || v.name, text: `${v.name} · ${v.lang}`, ...(s.voiceName && (s.voiceName === v.voiceURI || s.voiceName === v.name) ? { selected: true } : {}) })));
    sel.addEventListener('change', () => { s.voiceName = sel.value; app.save(); say('Hi! Let’s solve this problem together.', true); });
    box.append(h('div', { class: 'setting-row' }, h('div', {}, h('label', { for: 'set-voicename', class: 'sr-lab', text: 'Voice' }), h('span', { class: 'sr-sub', text: 'Pick the clearest voice for your child' })), sel));
  }

  const status = h('p', { class: 'vp-status', role: 'status', 'aria-live': 'polite' });
  unsub();
  unsub = onSpeechStatus((st, msg) => { status.textContent = st === 'speaking' ? '🔊 Speaking…' : msg; status.dataset.state = st; });
  box.append(h('div', { class: 'lesson-actions', style: 'margin-top:8px' }, btn('🔊 Test voice', () => say('Hi! Let’s solve this problem together. Count the shapes. How many do you see?', true), 'btn btn-blue')), status);
  if (sc && /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) {
    box.append(h('p', { class: 'sr-sub', text: 'iPad tip: turn the volume up and make sure Silent Mode is off. For a clearer voice, a grown-up can download an “Enhanced” English voice in Settings › Accessibility › Spoken Content › Voices, then choose it here.' }));
  }
  return box;
}
