/** Explainable recommendations for the child's learning map and the parent dashboard. */
import { LEVELS, SKILL_INDEX, type Skill } from '../curriculum/levels';
import type { LevelId } from '../core/types';
import { recentEvidence, reviewDue, skillState, summarize, type MasteryState, type SkillRecord } from './mastery';
import { hasReasoning } from './session';

export interface Recommendation { kind: 'check-back' | 'skill-check' | 'prerequisite' | 'keep-practicing' | 'explore' | 'review'; skill: string; reason: string; priority: number }

export const stateOf = (recs: Record<string, SkillRecord>, id: string): MasteryState => skillState(recs[id], hasReasoning(id));
const done = (s: MasteryState) => s === 'provisional' || s === 'retained';
const started = (s: MasteryState) => s !== 'not-started';

export function recommend(recs: Record<string, SkillRecord>, level: LevelId, now = Date.now(), delayMs?: number): Recommendation[] {
  const out: Recommendation[] = [];
  const skills = LEVELS.find(l => l.id === level)!.skills;
  for (const s of skills) {
    const st = stateOf(recs, s.id);
    const rec = recs[s.id];
    if (reviewDue(rec, now, delayMs)) out.push({ kind: 'check-back', skill: s.id, reason: `It has been a while since ${s.name} was mastered. A short check-back shows whether it has stuck.`, priority: 1 });
    if (st === 'ready') out.push({ kind: 'skill-check', skill: s.id, reason: `Recent independent answers in ${s.name} suggest readiness for a hint-free Skill Check.`, priority: 2 });
    if (st === 'learning' && rec) {
      const ev = summarize(recentEvidence(rec));
      const weakPre = s.prereqs.filter(p => SKILL_INDEX[p] && !done(stateOf(recs, p)) && stateOf(recs, p) !== 'practicing');
      if (ev.items >= 6 && ev.independentRate < 0.4 && weakPre.length) {
        out.push({ kind: 'prerequisite', skill: weakPre[0]!, reason: `${s.name} is still tricky. It builds on ${SKILL_INDEX[weakPre[0]!]!.name}, so a review there may help.`, priority: 3 });
      } else out.push({ kind: 'keep-practicing', skill: s.id, reason: `${s.name} is in progress. Practice with pictures and hints is helping build understanding.`, priority: 5 });
    }
    if (st === 'practicing') out.push({ kind: 'keep-practicing', skill: s.id, reason: `${s.name} is going well. A few harder and reasoning questions will show readiness for a Skill Check.`, priority: 4 });
  }
  const next = skills.find(s => !started(stateOf(recs, s.id)) && s.prereqs.every(p => !SKILL_INDEX[p] || SKILL_INDEX[p]!.level < level || started(stateOf(recs, p))));
  if (next) out.push({ kind: 'explore', skill: next.id, reason: `${next.name} is a good next stop on the map.`, priority: 6 });
  // Spaced retrieval of earlier, retained skills.
  for (const s of skills) if (stateOf(recs, s.id) === 'retained') { out.push({ kind: 'review', skill: s.id, reason: `Mixing in ${s.name} now and then keeps it fresh.`, priority: 8 }); break; }
  const seen = new Set<string>();
  return out.sort((a, b) => a.priority - b.priority).filter(r => (seen.has(r.kind + r.skill) ? false : (seen.add(r.kind + r.skill), true)));
}

/** Skills to mix into a daily review (retrieval practice across the level). */
export function dailyMix(recs: Record<string, SkillRecord>, level: LevelId): string[] {
  const skills = LEVELS.find(l => l.id === level)!.skills;
  const learned = skills.filter(s => ['practicing', 'ready', 'provisional', 'retained'].includes(stateOf(recs, s.id)));
  return (learned.length ? learned : skills.slice(0, 3)).map((s: Skill) => s.id);
}

/** Simple placement: suggests a level from a short check; parents may override. */
export const PLACEMENT_SKILLS: Record<LevelId, string[]> = {
  1: ['L1-count', 'L1-add', 'L1-compare'],
  2: ['L2-add20', 'L2-placevalue', 'L2-sub20'],
  3: ['L3-addregroup', 'L3-placevalue', 'L3-multintro'],
  4: ['L4-mult', 'L4-fracequiv', 'L4-area'],
};
export function suggestLevel(results: { level: LevelId; correct: boolean }[]): LevelId {
  let suggested: LevelId = 1;
  for (const l of [1, 2, 3, 4] as LevelId[]) {
    const r = results.filter(x => x.level === l);
    if (!r.length) break;
    const ok = r.filter(x => x.correct).length;
    if (ok >= 2) suggested = Math.min(4, l + 1) as LevelId;
    else { suggested = l; break; }
  }
  return suggested;
}
