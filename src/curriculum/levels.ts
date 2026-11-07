/**
 * The four learning levels. Child-facing labels are exactly "Level 1"–"Level 4".
 * CCSS codes are an approximate, parent-facing interpretation aid only — levels
 * describe competencies, not ages or school grades.
 */
import type { LevelId } from '../core/types';

export interface Skill {
  id: string;
  level: LevelId;
  domain: DomainId;
  name: string;
  icon: string;
  desc: string;
  objective: string;
  prereqs: string[];
  ccss: string[];
  /** v1.1 topic ids whose progress migrates into this skill. */
  legacy?: string[];
}

export type DomainId =
  | 'number' | 'compare' | 'operations' | 'place-value' | 'algebraic' | 'fractions'
  | 'geometry' | 'measurement' | 'time-money' | 'data' | 'patterns' | 'stories' | 'reasoning';

export const DOMAINS: Record<DomainId, string> = {
  number: 'Number sense & counting',
  compare: 'Comparing & ordering',
  operations: 'Operations',
  'place-value': 'Place value',
  algebraic: 'Equality & algebraic thinking',
  fractions: 'Fractions',
  geometry: 'Geometry & spatial reasoning',
  measurement: 'Measurement',
  'time-money': 'Time & money',
  data: 'Data',
  patterns: 'Patterns',
  stories: 'Math Story Adventures',
  reasoning: 'Logic & reasoning',
};

export interface Level {
  id: LevelId;
  label: string; // exactly "Level N"
  title: string;
  world: string;
  emoji: string;
  cls: string;
  focus: string;
  approxStandards: string; // parent-facing only
  skills: Skill[];
}

const S = (level: LevelId, domain: DomainId, id: string, name: string, icon: string, desc: string, objective: string, prereqs: string[], ccss: string[], legacy?: string[]): Skill =>
  ({ id, level, domain, name, icon, desc, objective, prereqs, ccss, ...(legacy ? { legacy } : {}) });

export const LEVELS: Level[] = [
  {
    id: 1, label: 'Level 1', title: 'Mathematical Explorers', world: 'Discovery Garden', emoji: '🌱', cls: 'lv1',
    focus: 'Building number sense and foundational reasoning',
    approxStandards: 'Roughly CCSS Kindergarten (K.CC, K.OA, K.MD, K.G)',
    skills: [
      S(1, 'number', 'L1-count', 'Counting', '🔢', 'Count objects to 20', 'Count a set of up to 20 objects and tell how many.', [], ['K.CC.4', 'K.CC.5'], ['k_count']),
      S(1, 'number', 'L1-numerals', 'Number Friends', '🔤', 'Match numbers to amounts', 'Recognize written numbers 0–20 and match them to quantities.', ['L1-count'], ['K.CC.3']),
      S(1, 'compare', 'L1-compare', 'More, Fewer, Same', '⚖️', 'Compare groups and numbers', 'Compare two groups or two numbers using more, fewer, and the same as.', ['L1-count'], ['K.CC.6', 'K.CC.7'], ['k_compare']),
      S(1, 'compare', 'L1-order', 'Number Order', '🪜', 'What comes before and after', 'Order numbers to 20 and find missing numbers in a counting sequence.', ['L1-count'], ['K.CC.2']),
      S(1, 'operations', 'L1-add', 'Putting Together', '➕', 'Add with objects within 10', 'Add within 10 by joining groups of objects.', ['L1-count'], ['K.OA.1', 'K.OA.2', 'K.OA.5'], ['k_addsub']),
      S(1, 'operations', 'L1-sub', 'Taking Apart', '➖', 'Subtract with objects within 10', 'Subtract within 10 by taking objects away.', ['L1-count'], ['K.OA.1', 'K.OA.2', 'K.OA.5']),
      S(1, 'operations', 'L1-compose', 'Number Bonds', '🔗', 'Break numbers into parts', 'Show a number up to 10 as two parts in more than one way.', ['L1-add'], ['K.OA.3', 'K.OA.4']),
      S(1, 'geometry', 'L1-shapes', 'Shapes & Places', '🔷', 'Name shapes and position words', 'Name flat shapes and describe positions (above, below, next to).', [], ['K.G.1', 'K.G.2', 'K.G.4'], ['k_shapes', 'k_position']),
      S(1, 'patterns', 'L1-patterns', 'Pattern Garden', '🧩', 'Find what comes next', 'Find and extend repeating patterns.', [], ['K.OA (patterns, informal)'], ['k_patterns']),
      S(1, 'reasoning', 'L1-sort', 'Sorting', '🧺', 'Sort and classify', 'Sort objects into groups and find the one that does not belong.', [], ['K.MD.3'], ['k_sort']),
      S(1, 'measurement', 'L1-measure', 'Long & Short', '📏', 'Compare lengths and sizes', 'Compare two objects by length or size.', [], ['K.MD.1', 'K.MD.2']),
      S(1, 'stories', 'L1-stories', 'Garden Stories', '📖', 'Little math stories', 'Solve joining and separating stories within 10 using pictures.', ['L1-add', 'L1-sub'], ['K.OA.2'], ['k_stories']),
    ],
  },
  {
    id: 2, label: 'Level 2', title: 'Number Adventurers', world: 'Number Kingdom', emoji: '🏰', cls: 'lv2',
    focus: 'Developing arithmetic fluency with understanding',
    approxStandards: 'Roughly CCSS Grade 1 (1.OA, 1.NBT, 1.MD) with early Grade 2 counting and money',
    skills: [
      S(2, 'operations', 'L2-add20', 'Adding to 20', '➕', 'Make ten and count on', 'Add within 20 using strategies such as making ten and counting on.', ['L1-add', 'L1-compose'], ['1.OA.6', '1.OA.3'], ['g1_add']),
      S(2, 'operations', 'L2-sub20', 'Subtracting to 20', '➖', 'Count back and think addition', 'Subtract within 20, including by thinking of a related addition.', ['L1-sub', 'L2-add20'], ['1.OA.4', '1.OA.6'], ['g1_sub']),
      S(2, 'place-value', 'L2-placevalue', 'Tens & Ones', '🔟', 'Build numbers with tens', 'Understand two-digit numbers as tens and ones.', ['L1-count'], ['1.NBT.2'], ['g1_place']),
      S(2, 'number', 'L2-numberline', 'Number Lines', '📍', 'Find numbers on a line', 'Locate and read whole numbers on a number line.', ['L1-order'], ['2.MD.6 (early)']),
      S(2, 'algebraic', 'L2-missing', 'Missing Numbers', '❓', 'Find the hidden number', 'Find the unknown number in an addition or subtraction equation.', ['L2-add20'], ['1.OA.8']),
      S(2, 'algebraic', 'L2-equality', 'Balance & Equal', '⚖️', 'What the equal sign means', 'Decide whether equations are true and explain why both sides are equal.', ['L2-add20'], ['1.OA.7']),
      S(2, 'compare', 'L2-compare', 'Comparing Numbers', '🐊', 'Use >, <, and =', 'Compare two-digit numbers using tens and ones.', ['L2-placevalue'], ['1.NBT.3'], ['g1_compare']),
      S(2, 'patterns', 'L2-skip', 'Skip Counting', '⏭️', 'Count by 2s, 5s, and 10s', 'Skip count by 2s, 5s, and 10s and find missing terms.', ['L1-order'], ['1.NBT.1', '2.NBT.2'], ['g1_skip']),
      S(2, 'time-money', 'L2-money', 'Coins', '💰', 'Know and count coins', 'Name coin values and count collections of coins.', ['L2-skip'], ['2.MD.8 (early)'], ['g1_money']),
      S(2, 'time-money', 'L2-time', 'Telling Time', '🕐', "O'clock and half past", 'Tell time to the hour and half hour on an analog clock.', [], ['1.MD.3'], ['g1_time']),
      S(2, 'measurement', 'L2-measure', 'Measuring', '📐', 'Measure with a ruler', 'Measure lengths in whole units starting from zero.', ['L1-measure'], ['1.MD.1', '1.MD.2'], ['g1_measure']),
      S(2, 'data', 'L2-data', 'Picture Graphs', '📊', 'Read simple graphs', 'Read and compare data in a simple graph.', ['L2-sub20'], ['1.MD.4']),
      S(2, 'stories', 'L2-stories', 'Kingdom Stories', '📚', 'One-step story problems', 'Solve one-step addition and subtraction stories, including comparison and missing-start problems.', ['L2-add20', 'L2-sub20'], ['1.OA.1'], ['g1_stories']),
      S(2, 'reasoning', 'L2-puzzles', 'Number Detective', '🕵️', 'Clues and many ways', 'Use clues to find a number and find more than one way to make a total.', ['L2-placevalue', 'L2-add20'], ['MP.1', 'MP.3']),
    ],
  },
  {
    id: 3, label: 'Level 3', title: 'Problem-Solving Champions', world: 'Puzzle Island', emoji: '🏝️', cls: 'lv3',
    focus: 'Building mathematical structure and multi-step reasoning',
    approxStandards: 'Roughly CCSS Grade 2 (2.OA, 2.NBT, 2.MD, 2.G) with early Grade 3 multiplication',
    skills: [
      S(3, 'operations', 'L3-addregroup', 'Two-Digit Adding', '➕', 'Add with regrouping', 'Add two-digit numbers, regrouping ones into a ten when needed.', ['L2-placevalue', 'L2-add20'], ['2.NBT.5'], ['g2_add']),
      S(3, 'operations', 'L3-subregroup', 'Two-Digit Subtracting', '➖', 'Subtract with regrouping', 'Subtract two-digit numbers, regrouping a ten into ones when needed.', ['L2-placevalue', 'L2-sub20'], ['2.NBT.5'], ['g2_sub']),
      S(3, 'place-value', 'L3-placevalue', 'Hundreds, Tens & Ones', '🏛️', 'Numbers to 1,000', 'Read, build, and compare three-digit numbers.', ['L2-placevalue'], ['2.NBT.1', '2.NBT.3', '2.NBT.4'], ['g2_place']),
      S(3, 'operations', 'L3-equalgroups', 'Equal Groups', '🧺', 'Repeated addition', 'Find totals of equal groups using repeated addition.', ['L2-skip'], ['2.OA.4']),
      S(3, 'operations', 'L3-multintro', 'Arrays', '🧮', 'Rows and columns', 'Use arrays to understand multiplication.', ['L3-equalgroups'], ['2.OA.4', '3.OA.1'], ['g2_array']),
      S(3, 'operations', 'L3-divintro', 'Fair Sharing', '🍪', 'Share into equal groups', 'Share objects equally and find how many in each group.', ['L3-equalgroups'], ['3.OA.2']),
      S(3, 'patterns', 'L3-skip', 'Skip Counting Plus', '🦘', 'By 2s, 3s, 4s, 5s, 10s, 100s', 'Skip count forward and backward by 2, 3, 4, 5, 10, and 100.', ['L2-skip'], ['2.NBT.2']),
      S(3, 'fractions', 'L3-fractions', 'Equal Parts', '🍫', 'Halves, thirds, fourths', 'Recognize equal parts and name halves, thirds, and fourths.', ['L1-shapes'], ['2.G.3', '3.NF.1'], ['g2_frac']),
      S(3, 'measurement', 'L3-measure', 'Units & Rulers', '📏', 'Inches, centimeters, meters', 'Measure lengths and choose sensible units.', ['L2-measure'], ['2.MD.1', '2.MD.3'], ['g2_measure']),
      S(3, 'geometry', 'L3-geometry', 'Shape Explorer', '🔺', 'Sides, corners, and names', 'Identify shapes by their attributes, including sides and vertices.', ['L1-shapes'], ['2.G.1'], []),
      S(3, 'measurement', 'L3-perimeter', 'Around the Edge', '🧱', 'Perimeter of rectangles', 'Find the perimeter of a rectangle by adding its side lengths.', ['L3-addregroup'], ['3.MD.8']),
      S(3, 'time-money', 'L3-time', 'Time to 5 Minutes', '🕒', 'Read the clock like a pro', 'Tell time to the nearest five minutes.', ['L2-time', 'L2-skip'], ['2.MD.7'], ['g2_time']),
      S(3, 'time-money', 'L3-money', 'Money Math', '🪙', 'Coins, dollars, and change', 'Count coins and make change from one dollar.', ['L2-money', 'L3-subregroup'], ['2.MD.8'], ['g2_money']),
      S(3, 'data', 'L3-data', 'Bar Graphs', '📊', 'Read and compare bars', 'Answer put-together, take-apart, and compare questions using a bar graph.', ['L2-data'], ['2.MD.10']),
      S(3, 'number', 'L3-estimate', 'Estimate & Check', '🎯', 'Round to the nearest ten', 'Round to the nearest ten and judge whether an answer is reasonable.', ['L3-placevalue'], ['3.NBT.1 (early)']),
      S(3, 'stories', 'L3-stories', 'Island Stories', '🗺️', 'Two-step story problems', 'Solve two-step addition and subtraction stories.', ['L2-stories', 'L3-addregroup'], ['2.OA.1'], ['g2_stories']),
      S(3, 'reasoning', 'L3-logic', 'Puzzle Detective', '🔍', 'Clues and missing information', 'Use logical clues and decide whether a problem has enough information.', ['L2-puzzles'], ['MP.1', 'MP.3']),
    ],
  },
  {
    id: 4, label: 'Level 4', title: 'Mathematical Thinkers', world: 'Logic Galaxy', emoji: '🪐', cls: 'lv4',
    focus: 'Advanced elementary reasoning and flexible problem solving',
    approxStandards: 'Roughly CCSS Grade 3 (3.OA, 3.NBT, 3.NF, 3.MD, 3.G)',
    skills: [
      S(4, 'operations', 'L4-mult', 'Multiplication', '✖️', 'Facts to 10 × 10', 'Multiply within 100 and use strategies such as breaking apart a factor.', ['L3-multintro'], ['3.OA.5', '3.OA.7'], ['g3_mult']),
      S(4, 'operations', 'L4-div', 'Division', '➗', 'Divide and connect to multiplication', 'Divide within 100 by thinking about an unknown factor.', ['L3-divintro', 'L4-mult'], ['3.OA.6', '3.OA.7'], ['g3_div']),
      S(4, 'algebraic', 'L4-properties', 'Number Rules', '🔁', 'Properties of operations', 'Use commutative, associative, distributive, zero, and identity properties.', ['L4-mult'], ['3.OA.5']),
      S(4, 'operations', 'L4-multistep', 'Multi-Step Math', '🪜', 'Two steps, four operations', 'Evaluate two-step expressions and match them to situations.', ['L4-mult', 'L4-div'], ['3.OA.8']),
      S(4, 'fractions', 'L4-fracequiv', 'Equal Fractions', '🍕', 'Different names, same amount', 'Recognize and generate equivalent fractions.', ['L3-fractions'], ['3.NF.3a', '3.NF.3b', '3.NF.3c'], ['g3_frac']),
      S(4, 'fractions', 'L4-fraccompare', 'Comparing Fractions', '🥧', 'Same top or same bottom', 'Compare fractions with the same numerator or the same denominator by reasoning about size.', ['L3-fractions'], ['3.NF.3d']),
      S(4, 'fractions', 'L4-fracline', 'Fraction Number Line', '📏', 'Fractions are numbers', 'Place and read fractions on a number line.', ['L3-fractions', 'L2-numberline'], ['3.NF.2']),
      S(4, 'measurement', 'L4-area', 'Area & Perimeter', '📦', 'Inside and around', 'Find area and perimeter of rectangles and tell them apart.', ['L3-perimeter', 'L4-mult'], ['3.MD.5', '3.MD.6', '3.MD.7', '3.MD.8'], ['g3_area']),
      S(4, 'measurement', 'L4-measure', 'Units & Conversions', '⚖️', 'Mass, liquid volume, and units', 'Choose units for mass and liquid volume and convert simple units of time and money.', ['L3-measure'], ['3.MD.2'], ['g3_measure']),
      S(4, 'time-money', 'L4-elapsed', 'Time Travelers', '⏱️', 'Elapsed time', 'Tell time to the minute and solve elapsed-time problems.', ['L3-time'], ['3.MD.1']),
      S(4, 'data', 'L4-data', 'Scaled Graphs', '📈', 'Each picture counts more', 'Read scaled bar graphs and solve one- and two-step questions.', ['L3-data', 'L4-mult'], ['3.MD.3'], ['g3_data']),
      S(4, 'number', 'L4-rounding', 'Rounding & Reasonableness', '🎯', 'Round to tens and hundreds', 'Round to the nearest 10 or 100 and use estimates to check answers.', ['L3-estimate'], ['3.NBT.1', '3.OA.8'], ['g3_round']),
      S(4, 'patterns', 'L4-patterns', 'Pattern Rules', '🔮', 'Find and explain rules', 'Identify arithmetic patterns and explain them using properties.', ['L3-skip', 'L4-mult'], ['3.OA.9'], ['g3_pattern']),
      S(4, 'geometry', 'L4-geometry', 'Shape Families', '🔶', 'Quadrilaterals and their families', 'Understand that shapes in different categories can share attributes (a square is a rectangle).', ['L3-geometry'], ['3.G.1'], ['g3_geo']),
      S(4, 'stories', 'L4-stories', 'Galaxy Stories', '🚀', 'Multi-step stories', 'Solve multi-step stories with all four operations and decide if information is sufficient.', ['L3-stories', 'L4-multistep'], ['3.OA.3', '3.OA.8'], ['g3_stories']),
      S(4, 'reasoning', 'L4-logic', 'Logic Lab', '🧠', 'Find the mistake, prove it', 'Analyze worked solutions, find errors, and justify answers.', ['L3-logic'], ['MP.3', 'MP.6']),
    ],
  },
];

export const ALL_SKILLS: Skill[] = LEVELS.flatMap(l => l.skills);
export const SKILL_INDEX: Record<string, Skill> = Object.fromEntries(ALL_SKILLS.map(s => [s.id, s]));
export const levelOf = (id: LevelId): Level => LEVELS.find(l => l.id === id)!;

/** v1.1 grade key → new level. */
export const LEGACY_GRADE_TO_LEVEL: Record<string, LevelId> = { k: 1, '1': 2, '2': 3, '3': 4 };
/** v1.1 topic id → new skill id. */
export const LEGACY_TOPIC_TO_SKILL: Record<string, string> = Object.fromEntries(
  ALL_SKILLS.flatMap(s => (s.legacy ?? []).map(t => [t, s.id])),
);
