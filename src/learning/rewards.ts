/**
 * Rewards that reinforce effort, reasoning and persistence — never speed, streak-loss, or chance.
 * No random loot, no streak-loss messaging, no leaderboards.
 */
import type { ChildProfile } from '../data/schema';

export interface Mascot { id: string; e: string; name: string; price: number; line: string }
export const MASCOTS: Mascot[] = [
  { id: 'fox', e: '🦊', name: 'Finley Fox', price: 0, line: 'Clever counting, friend!' },
  { id: 'owl', e: '🦉', name: 'Olive Owl', price: 60, line: 'Whooo knew you could think like that?' },
  { id: 'panda', e: '🐼', name: 'Pip Panda', price: 120, line: 'Bamboo-tiful thinking!' },
  { id: 'robot', e: '🤖', name: 'Beep the Robot', price: 180, line: 'Thinking complete. Great reasoning!' },
  { id: 'dragon', e: '🐲', name: 'Dax Dragon', price: 250, line: 'Roar-some reasoning!' },
  { id: 'unicorn', e: '🦄', name: 'Uma Unicorn', price: 400, line: 'Simply magical math!' },
];

export interface Badge { id: string; e: string; name: string; desc: string; kind: 'effort' | 'reasoning' | 'milestone' | 'explore' }
export const BADGES: Badge[] = [
  // v1 ids kept so earned badges survive migration (descriptions now reward effort, not streaks)
  { id: 'first', e: '🐣', name: 'First Steps', desc: 'Answer your first question correctly', kind: 'milestone' },
  { id: 'streak5', e: '🌟', name: 'Steady Thinker', desc: 'Get 5 questions right in one round', kind: 'effort' },
  { id: 'perfect', e: '💯', name: 'Careful Checker', desc: 'Finish a round with every answer right', kind: 'effort' },
  { id: 'coins100', e: '🪙', name: 'Coin Collector', desc: 'Collect 100 coins', kind: 'milestone' },
  { id: 'explorer', e: '🗺️', name: 'Trail Explorer', desc: 'Try 5 different skills', kind: 'explore' },
  { id: 'boss', e: '🏔️', name: 'Summit Climber', desc: 'Finish a level’s final challenge', kind: 'milestone' },
  { id: 'gamer', e: '🎮', name: 'Game On', desc: 'Play a math game', kind: 'explore' },
  { id: 'master', e: '🏆', name: 'Skill Champion', desc: 'Pass a Skill Check', kind: 'milestone' },
  { id: 'days3', e: '📅', name: 'Practice Pal', desc: 'Practice on 3 different days', kind: 'effort' },
  { id: 'scholar', e: '🎓', name: 'Super Scholar', desc: '100 correct answers in total', kind: 'milestone' },
  { id: 'thinker', e: '💡', name: 'Smart Helper', desc: 'Use a hint, then solve the problem', kind: 'effort' },
  { id: 'friend', e: '🦄', name: 'Friend Finder', desc: 'Unlock a new mascot', kind: 'milestone' },
  // new reasoning & persistence badges
  { id: 'persistent', e: '🧗', name: 'Never Give Up', desc: 'Solve a problem after a first try that was not right', kind: 'effort' },
  { id: 'explainer', e: '💬', name: 'Explainer', desc: 'Pick 5 good explanations', kind: 'reasoning' },
  { id: 'mistake-finder', e: '🔎', name: 'Mistake Finder', desc: 'Find 5 mistakes in worked problems', kind: 'reasoning' },
  { id: 'strategist', e: '🔀', name: 'Strategy Explorer', desc: 'Solve 5 problems another way', kind: 'reasoning' },
  { id: 'detective', e: '🕵️', name: 'Math Detective', desc: 'Crack 5 clue puzzles', kind: 'reasoning' },
  { id: 'storyteller', e: '📖', name: 'Story Solver', desc: 'Finish 5 Math Story Adventures', kind: 'reasoning' },
  { id: 'remember', e: '🧠', name: 'It Stuck!', desc: 'Pass a check-back after time away', kind: 'milestone' },
  { id: 'toolsmith', e: '🧰', name: 'Tool Tinkerer', desc: 'Explore 3 math tools', kind: 'explore' },
  { id: 'worlds', e: '🌍', name: 'World Traveler', desc: 'Visit all four worlds', kind: 'explore' },
  { id: 'family', e: '🏡', name: 'Family Mathematician', desc: 'Do a family math activity', kind: 'explore' },
  { id: 'rest', e: '🧘', name: 'Healthy Habit', desc: 'Take a break when reminded', kind: 'effort' },
];

/** Grants a badge once. Returns the badge if newly earned. */
export function grant(p: ChildProfile, id: string, now = new Date()): Badge | null {
  if (p.badges[id]) return null;
  const b = BADGES.find(x => x.id === id);
  if (!b) return null;
  p.badges[id] = now.toISOString();
  return b;
}

/** Badges that depend on running totals. */
export function checkTotals(p: ChildProfile): Badge[] {
  const got: (Badge | null)[] = [];
  if (p.coins >= 100) got.push(grant(p, 'coins100'));
  if (p.totals.correct >= 100) got.push(grant(p, 'scholar'));
  if (Object.values(p.skills).filter(s => s.attempts.length || s.legacy?.attempts).length >= 5) got.push(grant(p, 'explorer'));
  if (new Set(p.practiceDays).size >= 3) got.push(grant(p, 'days3'));
  const c = p.counters;
  if (c.explain >= 5) got.push(grant(p, 'explainer'));
  if (c.mistake >= 5) got.push(grant(p, 'mistake-finder'));
  if (c.anotherWay >= 5) got.push(grant(p, 'strategist'));
  if (c.detective >= 5) got.push(grant(p, 'detective'));
  if (c.stories >= 5) got.push(grant(p, 'storyteller'));
  if (c.tools.length >= 3) got.push(grant(p, 'toolsmith'));
  if (new Set(c.worlds).size >= 4) got.push(grant(p, 'worlds'));
  return got.filter((b): b is Badge => !!b);
}

/** Coins: effort-based, fixed (no randomness). Hints and second tries still earn something. */
export function coinsFor(r: { correct: boolean; tries: number; hints: number; diff: number; mode: string }): number {
  if (!r.correct) return 0;
  const reasoning = r.mode !== 'solve' ? 1 : 0;
  if (r.tries > 1) return 1 + reasoning;          // persistence pays
  return Math.max(1, 1 + r.diff - r.hints) + reasoning;
}
