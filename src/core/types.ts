/**
 * The structured question schema. Every generator returns a `Question`;
 * every question is checked by `validateQuestion` before a child sees it.
 */
import type { Claim, Expr } from './expr';

export type LevelId = 1 | 2 | 3 | 4;
export type Difficulty = 1 | 2 | 3;
export type Mode = 'solve' | 'explain' | 'mistake' | 'another-way' | 'detective' | 'story';
export type ReadingDemand = 'pre-reader' | 'early' | 'developing' | 'fluent';
export type ShapeName =
  | 'circle' | 'oval' | 'triangle' | 'square' | 'rectangle' | 'rhombus'
  | 'trapezoid' | 'pentagon' | 'hexagon' | 'octagon';
export type CoinName = 'penny' | 'nickel' | 'dime' | 'quarter';

/* ---------------------------------------------------------------- visuals */
export type VisualSpec =
  | { kind: 'counters'; emoji: string; count: number; cross?: number; label: string }
  | { kind: 'twoGroups'; e1: string; n1: number; e2: string; n2: number; label: string }
  | { kind: 'tenframe'; a: number; b?: number }
  | {
      kind: 'numberline';
      min: number;
      max: number;
      /** subdivisions per whole (1 = integer ticks, 4 = fourths). */
      denom?: number;
      labelEvery?: number;
      hops?: { from: number; to: number; size?: number }[];
      marks?: { value: [number, number]; label?: string }[];
      aria?: string;
    }
  | { kind: 'placevalue'; h?: number; t: number; o: number }
  | { kind: 'clock'; h: number; m: number }
  | { kind: 'coins'; list: CoinName[] }
  | { kind: 'fracbar'; den: number; num: number; widths?: number[]; label?: string }
  | { kind: 'fraccircle'; den: number; num: number }
  | { kind: 'fracstack'; fracs: [number, number][] }
  | { kind: 'array'; rows: number; cols: number; emoji: string }
  | { kind: 'divgroups'; groups: number; per: number; emoji: string; mystery?: boolean }
  | { kind: 'ruler'; len: number; start?: number; unit: 'inches' | 'centimeters'; name: string }
  | { kind: 'lengthpair'; a: number; b: number; name: string }
  | { kind: 'areagrid'; w: number; h: number; unitName: string; showGrid: boolean }
  | { kind: 'pattern'; seq: string[] }
  | { kind: 'posgrid'; cells: string[]; aria: string }
  | { kind: 'sizepair'; a: number; b: number }
  | { kind: 'shape'; name: ShapeName; rotate?: number }
  | { kind: 'glyph'; text: string; aria: string }
  | { kind: 'bond'; total: number | '?'; left: number | '?'; right: number | '?' }
  | { kind: 'compareGroups'; boxes: { name: string; emoji: string; n: number }[] }
  | { kind: 'compareBars'; rows: { label: string; emoji: string; n: number }[] }
  | { kind: 'sortrow'; items: string[]; aria: string }
  | { kind: 'bargraph'; title: string; data: { label: string; emoji: string; val: number }[]; scale: number }
  | { kind: 'worked'; title: string; lines: string[] }
  | { kind: 'balance'; left: string; right: string; tilt: 'left' | 'right' | 'level' | 'unknown' };

/* ---------------------------------------------------------------- options */
export interface Option {
  id: string;
  label: string;
  /** Machine value interpreted by the question's MathSpec (number, "3/4", "4:15", shape name…). */
  value: string | number;
  aria?: string;
  visual?: VisualSpec;
  /** For explanation / justification options: the mathematical claim the sentence makes. */
  claim?: Claim;
  /** Several claims that must ALL hold for the sentence to be true. */
  claims?: Claim[];
  /** For explanation options whose truth is not arithmetic (e.g. "it has 4 equal sides"). */
  truth?: boolean;
}

/* ------------------------------------------------------------ interaction */
export type Interaction =
  | { type: 'choice'; options: Option[]; correct: string[]; layout: 'grid' | 'two' | 'list' }
  | { type: 'numeric'; answer: number; accept: number[]; min: number; max: number; unit?: string }
  | { type: 'order'; items: Option[]; correctOrder: string[]; instruction: string }
  | { type: 'numberline'; min: number; max: number; denom: number; answer: [number, number]; labelEvery: number }
  | { type: 'shade'; shape: 'bar' | 'circle'; parts: number; answer: number }
  | { type: 'array'; maxRows: number; maxCols: number; product: number; fixedRows?: number }
  | { type: 'tf'; statement: string; truth: boolean; claim?: Claim; justifications: Option[]; correctJust: string[] }
  | { type: 'match'; left: Option[]; right: Option[]; pairs: [string, string][] };

export type Response =
  | { type: 'choice'; id: string }
  | { type: 'numeric'; value: number }
  | { type: 'order'; ids: string[] }
  | { type: 'numberline'; value: [number, number] }
  | { type: 'shade'; count: number }
  | { type: 'array'; rows: number; cols: number }
  | { type: 'tf'; truth: boolean; justId: string }
  | { type: 'match'; pairs: [string, string][] };

/* --------------------------------------------------------------- MathSpec */
export type StoryStructure =
  | 'join-result' | 'join-change' | 'join-start'
  | 'separate-result' | 'separate-change'
  | 'part-part-whole' | 'compare-difference' | 'compare-larger' | 'compare-smaller'
  | 'equal-groups' | 'array' | 'share' | 'measure-groups'
  | 'two-step' | 'multi-step' | 'money-change';

export type Clue =
  | { type: 'between'; lo: number; hi: number } // exclusive
  | { type: 'parity'; even: boolean }
  | { type: 'multipleOf'; k: number }
  | { type: 'notMultipleOf'; k: number }
  | { type: 'digitSum'; sum: number }
  | { type: 'onesDigit'; d: number }
  | { type: 'tensDigit'; d: number }
  | { type: 'onesGreaterThanTens' }
  | { type: 'tensGreaterThanOnes' }
  | { type: 'greaterThan'; n: number }
  | { type: 'lessThan'; n: number };

export type MathSpec =
  | { kind: 'equation'; claim: Claim; lo: number; hi: number }
  | { kind: 'count'; n: number }
  | { kind: 'compare'; a: Expr; b: Expr }
  | { kind: 'extreme'; which: 'max' | 'min'; items: { value: string; expr: Expr }[] }
  | { kind: 'order'; items: { id: string; expr: Expr }[]; direction: 'ascending' | 'descending' }
  | { kind: 'clock'; h: number; m: number }
  | { kind: 'elapsed'; start: [number, number]; minutes: number; ask: 'end' | 'duration' }
  | { kind: 'shape'; shape: ShapeName; ask: 'name' | 'sides' | 'vertices' }
  | { kind: 'shape-property'; property: ShapeProperty }
  | { kind: 'repeating-pattern'; seq: string[] }
  | { kind: 'arith-sequence'; terms: (number | null)[] }
  | { kind: 'place'; h: number; t: number; o: number; ask: 'value' | 'hundreds' | 'tens' | 'ones' }
  | { kind: 'fraction'; parts: number; shaded: number; equal: boolean; ask: 'name' | 'equal-parts' | 'shade' | 'whole' }
  | { kind: 'money'; coins: CoinName[]; ask: 'total' | 'coin-value' }
  | { kind: 'change'; price: number; paid: number }
  | { kind: 'length'; len: number; unit: string }
  | { kind: 'length-compare'; a: number; b: number; ask: 'longer' | 'shorter' }
  | { kind: 'size-compare'; a: number; b: number; ask: 'bigger' | 'smaller' }
  | { kind: 'unit-choice'; object: string }
  | { kind: 'convert'; from: Unit; to: Unit; amount: number }
  | { kind: 'data'; ask: 'read' | 'most' | 'least' | 'diff' | 'total'; target?: string; other?: string }
  | { kind: 'rect'; w: number; h: number; ask: 'area' | 'perimeter' }
  | { kind: 'clues'; lo: number; hi: number; clues: Clue[] }
  | { kind: 'claims' }
  | { kind: 'shape-family'; subject: ShapeName; category: ShapeCategory }
  | { kind: 'asn'; key: string }
  | { kind: 'function-table'; pairs: [number, number][]; query: number }
  | { kind: 'round'; n: number; to: 10 | 100 }
  | { kind: 'estimate'; a: number; b: number; op: '+' | '-'; to: 10 | 100 }
  | { kind: 'classify'; items: { value: string; group: string }[] }
  | { kind: 'position'; cells: string[]; target: string; anchor: string }
  | { kind: 'decompose'; total: number }
  | { kind: 'array-product'; product: number; fixedRows?: number }
  | { kind: 'array-count'; rows: number; cols: number }
  | {
      kind: 'story';
      structure: StoryStructure;
      expr: Expr;
      /** Every number that appears in the story text, in any order. */
      givens: number[];
      /** Numbers that appear in the text but are deliberately not needed. */
      irrelevant: number[];
      /** false for deliberately underdetermined "is there enough information?" items. */
      sufficient: boolean;
    };

export type ShapeProperty =
  | 'three-sides' | 'four-equal-sides-four-right-angles' | 'five-sides' | 'six-sides'
  | 'eight-sides' | 'round-no-corners' | 'four-right-angles' | 'four-equal-sides'
  | 'one-pair-parallel';

export type ShapeCategory = 'rectangle' | 'rhombus' | 'square' | 'quadrilateral' | 'parallelogram' | 'triangle' | 'polygon';

export type Unit =
  | 'minutes' | 'hours' | 'days' | 'weeks' | 'cents' | 'dollars'
  | 'centimeters' | 'meters' | 'grams' | 'kilograms' | 'milliliters' | 'liters';

/* --------------------------------------------------------------- Question */
export interface Question {
  id: string;
  generatorId: string;
  generatorVersion: number;
  seed: number;
  level: LevelId;
  domain: string;
  skill: string;
  objective: string;
  difficulty: Difficulty;
  mode: Mode;
  reasoningObjective?: string;
  readingDemand: ReadingDemand;
  badge: string;
  story?: string;
  prompt: string;
  visual?: VisualSpec;
  interaction: Interaction;
  /** Progressive hints, least to most revealing (≥ 2). */
  hints: string[];
  explanation: string;
  steps: string[];
  math: MathSpec;
  /** Structure + numbers; identical signatures are treated as repeats. */
  signature: string;
  /** Labels that state the correct answer (used by "explanation mentions answer" check). */
  answerText: string;
  validation: { status: 'unvalidated' | 'validated' | 'failed'; issues: string[] };
  /** Math Story Adventures: Understand → Plan → (Solve) → Explain phases. */
  phases?: StoryPhases;
}

export interface ChoicePhase {
  prompt: string;
  interaction: Extract<Interaction, { type: 'choice' }>;
}
export interface StoryPhases {
  understand: ChoicePhase;
  plan: ChoicePhase;
  explain: ChoicePhase;
  check: string;
}

/** What a generator must supply; the registry fills in level/skill metadata. */
export type QuestionDraft = Omit<
  Question,
  'id' | 'generatorId' | 'generatorVersion' | 'seed' | 'level' | 'domain' | 'skill' | 'objective' | 'difficulty' | 'validation' | 'mode' | 'readingDemand'
> & { mode?: Mode; readingDemand?: ReadingDemand };
