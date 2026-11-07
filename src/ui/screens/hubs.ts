/** Story hub, Game Room (Balloon Pop, Memory Match), Collection and Mascot Shop. */
import { LEVELS } from '../../curriculum/levels';
import type { LevelId } from '../../core/types';
import { Rng, freshSeed } from '../../core/rng';
import { BADGES, grant, MASCOTS } from '../../learning/rewards';
import { stateOf } from '../../learning/recommend';
import type { App, Screen } from '../app';
import { btn, clear, h } from '../dom';
import { play, say } from '../media';

export const StoriesScreen: Screen = {
  id: 'stories',
  title: () => 'Math Story Adventures',
  render(app) {
    const grid = h('div', { class: 'games-grid' });
    LEVELS.forEach(L => {
      const c = h('div', { class: 'game-card' }, h('span', { class: 'gc-icon', 'aria-hidden': 'true' }, L.emoji), h('h3', { text: `${L.label} Stories` }), h('p', { text: L.skills.find(s => s.id.endsWith('stories'))!.objective }),
        btn('Start', () => void app.go('activity', { kind: 'stories', skill: `L${L.id}-stories`, level: L.id }), 'btn btn-coral', { 'aria-label': `Start ${L.label} stories` }));
      grid.append(c);
    });
    return h('section', { 'aria-labelledby': 'st-h' },
      h('div', { class: 'screen-head' }, h('h2', { id: 'st-h', text: '📖 Math Story Adventures' }), h('p', { text: 'Read or listen → Understand → Plan → Solve → Check → Explain → Celebrate!' })),
      grid, h('p', { class: 'offline-note', text: 'Every story has a checked answer. Tap 🔊 Read aloud to hear it.' }));
  },
};

/* ------------------------------------------------------------------ games */
function factFor(rng: Rng, level: LevelId): { text: string; ans: number } {
  switch (level) {
    case 1: { const a = rng.int(1, 5), b = rng.int(0, 5); return { text: `${a} + ${b}`, ans: a + b }; }
    case 2: { if (rng.bool()) { const a = rng.int(3, 12), b = rng.int(1, 8); return { text: `${a} + ${b}`, ans: a + b }; } const a = rng.int(6, 18), b = rng.int(1, a - 1); return { text: `${a} − ${b}`, ans: a - b }; }
    case 3: { const a = rng.int(11, 45), b = rng.int(10, 40); return { text: `${a} + ${b}`, ans: a + b }; }
    case 4: { const a = rng.int(2, 9), b = rng.int(2, 9); return { text: `${a} × ${b}`, ans: a * b }; }
  }
}

export const GamesScreen: Screen = {
  id: 'games',
  title: () => 'Game Room',
  render(app) {
    return h('section', { 'aria-labelledby': 'g-h' },
      h('div', { class: 'screen-head' }, h('h2', { id: 'g-h', text: '🎮 Game Room' }), h('p', { text: 'Practice facts for fun. Games are optional — take your time!' })),
      h('div', { class: 'games-grid' },
        h('div', { class: 'game-card' }, h('span', { class: 'gc-icon', 'aria-hidden': 'true' }, '🎈'), h('h3', { text: 'Balloon Pop' }), h('p', { text: 'Solve the problem, then pop the balloon with the answer.' }), btn('Play', () => void app.go('balloon'), 'btn btn-coral')),
        h('div', { class: 'game-card' }, h('span', { class: 'gc-icon', 'aria-hidden': 'true' }, '🃏'), h('h3', { text: 'Memory Match' }), h('p', { text: 'Flip cards to match each problem with its answer.' }), btn('Play', () => void app.go('memory'), 'btn btn-grape'))));
  },
};

let balloonTimer: ReturnType<typeof setInterval> | null = null;
let balloonRaf = 0;
export const BalloonScreen: Screen = {
  id: 'balloon',
  title: () => 'Balloon Pop',
  tracksActiveTime: true,
  onLeave: () => { if (balloonTimer) clearInterval(balloonTimer); cancelAnimationFrame(balloonRaf); balloonTimer = null; },
  render(app) {
    const timed = app.state.parent.timedGames;
    const calm = app.state.settings.motion;
    const rng = new Rng(freshSeed());
    let score = 0, round = 0, timeLeft = 60, current = factFor(rng, app.profile.level);
    const eq = h('span', { class: 'bp-eq', 'aria-live': 'polite' });
    const scoreEl = h('span', { class: 'num', text: '0' });
    const timeEl = h('span', { class: 'num', text: timed ? '60' : '∞' });
    const stage = h('div', { class: 'bp-stage', role: 'group', 'aria-label': 'Balloons with answers' });
    const balloons: { el: HTMLButtonElement; x: number; y: number; speed: number }[] = [];
    const end = () => {
      if (balloonTimer) clearInterval(balloonTimer); balloonTimer = null; cancelAnimationFrame(balloonRaf);
      const coins = Math.min(30, score * 2);
      app.profile.coins += coins; grant(app.profile, 'gamer'); app.save();
      clear(stage); stage.append(h('div', { style: 'display:grid;place-items:center;height:100%;font-weight:900;font-size:1.3rem;text-align:center;padding:20px', text: `🎈 ${score} balloons popped! +${coins} 🪙` }));
      say(`You popped ${score} balloons!`); play('fanfare');
    };
    const newRound = () => {
      round++;
      current = factFor(rng, app.profile.level);
      eq.textContent = `${current.text} = ?`;
      clear(stage); balloons.length = 0;
      const vals = new Set([current.ans]);
      while (vals.size < 5) { const v = current.ans + rng.int(-5, 5); if (v >= 0) vals.add(v); }
      const W = stage.clientWidth || 600, H = stage.clientHeight || 400;
      rng.shuffle([...vals]).forEach((v, i) => {
        const el = h('button', { class: 'balloon', type: 'button', 'aria-label': `Balloon ${v}` }, String(v));
        el.style.background = ['#B83434', '#0B6FAD', '#1A7F45', '#8A5A00', '#5F44CC'][i]!;
        const x = 10 + (i * (W - 90)) / 4, y = calm ? 60 + (i % 2) * 150 : H + i * 70 + rng.int(0, 60);
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.addEventListener('click', () => {
          if (v === current.ans) { play('pop'); score++; scoreEl.textContent = String(score); el.classList.add('popped'); setTimeout(() => (timed || round < 10 ? newRound() : end()), 260); }
          else { play('try'); el.style.opacity = '.4'; el.disabled = true; }
        });
        stage.append(el); balloons.push({ el, x, y, speed: 0.4 + rng.next() * 0.6 });
      });
      say(`${current.text} equals what?`);
    };
    const start = () => {
      startBtn.style.display = 'none'; score = 0; round = 0; scoreEl.textContent = '0';
      newRound();
      if (timed) { timeLeft = 60; balloonTimer = setInterval(() => { timeLeft--; timeEl.textContent = String(timeLeft); if (timeLeft <= 0) end(); }, 1000); }
      if (!calm) { const tick = () => { const H = stage.clientHeight; balloons.forEach(b => { b.y -= b.speed; if (b.y < -100) b.y = H + 20; b.el.style.transform = `translate(${b.x}px, ${b.y}px)`; }); balloonRaf = requestAnimationFrame(tick); }; balloonRaf = requestAnimationFrame(tick); }
    };
    const startBtn = btn('Start game', start, 'btn btn-grass btn-lg');
    return h('section', { 'aria-labelledby': 'bp-h' },
      h('div', { class: 'screen-head' }, h('h2', { id: 'bp-h', text: '🎈 Balloon Pop' }), h('p', { text: timed ? 'Pop as many correct balloons as you can in 60 seconds.' : 'Relaxed mode: 10 rounds, no timer. Take your time!' })),
      h('div', { class: 'bp-hud' }, eq, h('span', { class: 'stat-pill' }, '⏱️ ', timeEl), h('span', { class: 'stat-pill' }, '✅ ', scoreEl)),
      stage, h('div', { class: 'quiz-actions', style: 'margin-top:16px' }, startBtn, btn('Back to Game Room', () => void app.back(), 'btn btn-ghost')));
  },
};

export const MemoryScreen: Screen = {
  id: 'memory',
  title: () => 'Memory Match',
  tracksActiveTime: true,
  render(app) {
    const grid = h('div', { class: 'mm-grid', role: 'group', 'aria-label': 'Memory cards' });
    const movesEl = h('span', { text: '0' }), pairsEl = h('span', { text: '0' });
    const fresh = () => {
      clear(grid);
      const rng = new Rng(freshSeed());
      const facts: { text: string; ans: number }[] = [];
      let guard = 0;
      while (facts.length < 6 && guard++ < 300) { const f = factFor(rng, app.profile.level); if (!facts.some(x => x.ans === f.ans)) facts.push(f); }
      const cards = rng.shuffle(facts.flatMap((f, i) => [{ pair: i, label: f.text }, { pair: i, label: String(f.ans) }]));
      let first: { b: HTMLButtonElement; pair: number } | null = null, lock = false, moves = 0, pairs = 0;
      movesEl.textContent = '0'; pairsEl.textContent = '0';
      cards.forEach(c => {
        const b = h('button', { class: 'mm-card', type: 'button', 'aria-label': 'Hidden card' }, h('span', { class: 'mm-back', 'aria-hidden': 'true' }, '❓'), h('span', { class: 'mm-face', text: c.label }));
        b.addEventListener('click', () => {
          if (lock || b.classList.contains('flipped')) return;
          play('click'); b.classList.add('flipped'); b.setAttribute('aria-label', `Card: ${c.label}`);
          if (!first) { first = { b, pair: c.pair }; return; }
          moves++; movesEl.textContent = String(moves);
          if (first.pair === c.pair) { first.b.classList.add('matched'); b.classList.add('matched'); pairs++; pairsEl.textContent = String(pairs); play('correct'); app.announce('It’s a match!'); first = null;
            if (pairs === 6) { const coins = Math.max(6, 24 - moves); app.profile.coins += coins; grant(app.profile, 'gamer'); app.save(); app.toast(`🃏 All matched in ${moves} turns! +${coins} 🪙`); }
          } else { const a = first; first = null; lock = true; setTimeout(() => { a.b.classList.remove('flipped'); b.classList.remove('flipped'); a.b.setAttribute('aria-label', 'Hidden card'); b.setAttribute('aria-label', 'Hidden card'); lock = false; }, 1100); }
        });
        grid.append(b);
      });
    };
    fresh();
    return h('section', { 'aria-labelledby': 'mm-h' },
      h('div', { class: 'screen-head' }, h('h2', { id: 'mm-h', text: '🃏 Memory Match' }), h('p', { text: 'Match each problem with its answer.' })),
      h('div', { class: 'mm-hud' }, h('span', {}, 'Turns: ', movesEl), h('span', {}, 'Pairs: ', pairsEl, '/6')),
      grid, h('div', { class: 'quiz-actions', style: 'margin-top:18px' }, btn('New game', fresh, 'btn btn-grape'), btn('Back to Game Room', () => void app.back(), 'btn btn-ghost')));
  },
};

/* ------------------------------------------------------------------ collection & shop */
export const CollectionScreen: Screen = {
  id: 'collection',
  title: () => 'My Collection',
  render(app) {
    const p = app.profile;
    const mascots = h('div', { class: 'coll-grid' });
    MASCOTS.forEach(m => {
      const owned = p.unlocked.includes(m.id);
      const item = h('div', { class: `coll-item${owned ? '' : ' locked'}${p.mascot === m.id ? ' selected' : ''}` }, h('span', { class: 'ci-icon', 'aria-hidden': 'true' }, m.e), h('h4', { text: m.name }), h('p', { text: owned ? (p.mascot === m.id ? 'Adventuring with you!' : 'Unlocked') : `${m.price} 🪙 in the shop` }));
      if (owned && p.mascot !== m.id) item.append(btn('Choose', () => { p.mascot = m.id; app.save(); app.toast(`${m.e} ${m.name} joins your adventure!`); say(m.line); app.rerender(); }, 'btn btn-sm btn-blue', { 'aria-label': `Choose ${m.name}` }));
      mascots.append(item);
    });
    const badges = h('div', { class: 'coll-grid' });
    BADGES.forEach(b => badges.append(h('div', { class: `coll-item${p.badges[b.id] ? '' : ' locked'}`, 'aria-label': `${b.name}: ${b.desc}. ${p.badges[b.id] ? 'Earned' : 'Not yet earned'}` }, h('span', { class: 'ci-icon', 'aria-hidden': 'true' }, b.e), h('h4', { text: b.name }), h('p', { text: b.desc }))));
    const trophies = h('div', { class: 'coll-grid' });
    LEVELS.forEach(L => L.skills.forEach(s => {
      const st = stateOf(p.skills, s.id);
      const legacy = p.legacyTrophies?.includes(s.id);
      if (st === 'provisional' || st === 'retained' || legacy) trophies.append(h('div', { class: 'coll-item' }, h('span', { class: 'ci-icon', 'aria-hidden': 'true' }, st === 'retained' ? '🧠' : '🏆'), h('h4', { text: s.name }), h('p', { text: `${L.label} · ${st === 'retained' ? 'It stuck!' : st === 'provisional' ? 'Skill Check passed' : 'Trophy from the earlier version'}` })));
    }));
    if (!trophies.childElementCount) trophies.append(h('div', { class: 'coll-item locked' }, h('span', { class: 'ci-icon', 'aria-hidden': 'true' }, '🏆'), h('h4', { text: 'No trophies yet' }), h('p', { text: 'Pass a Skill Check to earn one!' })));
    return h('section', { 'aria-labelledby': 'c-h' },
      h('div', { class: 'screen-head' }, h('h2', { id: 'c-h', text: '🏅 My Collection' }), h('p', { text: 'Badges celebrate thinking, trying again, and exploring.' })),
      h('div', { style: 'text-align:center' }, btn('🛍️ Mascot Shop', () => void app.go('shop'), 'btn btn-sun')),
      h('h3', { class: 'section-label', text: 'My mascot friends' }), mascots,
      h('h3', { class: 'section-label', text: 'Badges' }), badges,
      h('h3', { class: 'section-label', text: 'Trophies' }), trophies);
  },
};

export const ShopScreen: Screen = {
  id: 'shop',
  title: () => 'Mascot Shop',
  render(app) {
    const p = app.profile;
    const grid = h('div', { class: 'coll-grid' });
    MASCOTS.forEach(m => {
      const owned = p.unlocked.includes(m.id), can = !owned && p.coins >= m.price;
      const item = h('div', { class: `coll-item${owned ? ' selected' : ''}` }, h('span', { class: 'ci-icon', 'aria-hidden': 'true' }, m.e), h('h4', { text: m.name }), h('p', { text: owned ? 'Already your friend!' : `${m.price} 🪙` }));
      if (!owned) item.append(btn(can ? 'Unlock' : 'Keep earning!', () => {
        if (p.coins < m.price || p.unlocked.includes(m.id)) return;
        p.coins -= m.price; p.unlocked.push(m.id); p.mascot = m.id; const b = grant(p, 'friend'); app.save();
        play('fanfare'); app.confetti(20); app.toast(`${m.e} ${m.name} joined your team!`); if (b) app.celebrateBadges([b]); app.rerender();
      }, `btn btn-sm ${can ? 'btn-grass' : 'btn-ghost'}`, { ...(can ? {} : { disabled: true }), 'aria-label': `${can ? 'Unlock' : 'Not enough coins for'} ${m.name}` }));
      grid.append(item);
    });
    return h('section', { 'aria-labelledby': 's-h' },
      h('div', { class: 'screen-head' }, h('h2', { id: 's-h', text: '🛍️ Mascot Shop' }), h('p', { text: `You have ${p.coins} coins. Coins come from learning — no real money, ever.` })), grid);
  },
};

export type { App };
