# Curriculum: Four Learning Levels

> **Generated from source** (`src/curriculum/levels.ts`, `src/curriculum/lessons.ts`, `src/engine/registry.ts`) by `npm run docs:curriculum`. Do not edit by hand.

Children see only **Level 1–4** (with optional world names). Levels describe *competencies*, not ages or school grades; a child can work at any level, and the optional "Find my level" check suggests a starting point that a grown-up can override.

The Common Core (CCSS-M) codes are an **approximate, parent-facing interpretation aid**. They have not been reviewed by a standards-alignment expert (see `docs/KNOWN_LIMITATIONS.md`).

## Instructional sequence (every skill)

1. **Lesson**: a big idea, a concrete visual model, and a worked example revealed one step at a time (concrete → representational → abstract).
2. **Guided practice**: easier items with visuals; hints and a second try are available.
3. **Independent practice**: difficulty adapts to evidence (two independent successes → harder; two misses → easier).
4. **Reasoning**: Explain Your Thinking, Find the Mistake, Solve It Another Way, and Math Detective items.
5. **Skill Check**: six items, no hints, one try. Passing gives *provisional* mastery.
6. **Check-back**: five items after a parent-chosen delay (1/3/7 days). Passing shows *retained* mastery.
7. **Daily Review**: mixed retrieval practice across learned skills.

## Levels at a glance

| Level | World | Title | Focus | Approx. standards (parents) | Skills |
|---|---|---|---|---|---|
| Level 1 | 🌱 Discovery Garden | Mathematical Explorers | Building number sense and foundational reasoning | Roughly CCSS Kindergarten (K.CC, K.OA, K.MD, K.G) | 12 |
| Level 2 | 🏰 Number Kingdom | Number Adventurers | Developing arithmetic fluency with understanding | Roughly CCSS Grade 1 (1.OA, 1.NBT, 1.MD) with early Grade 2 counting and money | 14 |
| Level 3 | 🏝️ Puzzle Island | Problem-Solving Champions | Building mathematical structure and multi-step reasoning | Roughly CCSS Grade 2 (2.OA, 2.NBT, 2.MD, 2.G) with early Grade 3 multiplication | 17 |
| Level 4 | 🪐 Logic Galaxy | Mathematical Thinkers | Advanced elementary reasoning and flexible problem solving | Roughly CCSS Grade 3 (3.OA, 3.NBT, 3.NF, 3.MD, 3.G) | 16 |

## Level 1 — Mathematical Explorers (Discovery Garden)

**Focus:** Building number sense and foundational reasoning.

| Skill | Domain | Objective | Prerequisites | CCSS (approx.) | Question generators (mode) |
|---|---|---|---|---|---|
| 🔢 **Counting** (`L1-count`) | Number sense & counting | Count a set of up to 20 objects and tell how many. | — | K.CC.4, K.CC.5 | `count.objects` (Think & Solve)<br>`count.tenframe` (Think & Solve, from difficulty 2)<br>`count.explain` (Explain Your Thinking)<br>`count.any-order` (Explain Your Thinking, from difficulty 2) |
| 🔤 **Number Friends** (`L1-numerals`) | Number sense & counting | Recognize written numbers 0–20 and match them to quantities. | Counting | K.CC.3 | `numerals.word` (Think & Solve)<br>`numerals.match` (Think & Solve) |
| ⚖️ **More, Fewer, Same** (`L1-compare`) | Comparing & ordering | Compare two groups or two numbers using more, fewer, and the same as. | Counting | K.CC.6, K.CC.7 | `compare.groups` (Think & Solve)<br>`compare.numbers` (Think & Solve, from difficulty 2)<br>`compare.same-number` (Explain Your Thinking) |
| 🪜 **Number Order** (`L1-order`) | Comparing & ordering | Order numbers to 20 and find missing numbers in a counting sequence. | Counting | K.CC.2 | `order.next-before` (Think & Solve)<br>`order.missing` (Think & Solve)<br>`order.sort` (Think & Solve, from difficulty 2) |
| ➕ **Putting Together** (`L1-add`) | Operations | Add within 10 by joining groups of objects. | Counting | K.OA.1, K.OA.2, K.OA.5 | `add.objects` (Think & Solve)<br>`add.tenframe` (Think & Solve, from difficulty 2)<br>`add.what-changes` (Explain Your Thinking) |
| ➖ **Taking Apart** (`L1-sub`) | Operations | Subtract within 10 by taking objects away. | Counting | K.OA.1, K.OA.2, K.OA.5 | `sub.objects` (Think & Solve)<br>`sub.what-changes` (Explain Your Thinking) |
| 🔗 **Number Bonds** (`L1-compose`) | Operations | Show a number up to 10 as two parts in more than one way. | Putting Together | K.OA.3, K.OA.4 | `compose.bond` (Think & Solve)<br>`compose.ways` (Solve It Another Way) |
| 🔷 **Shapes & Places** (`L1-shapes`) | Geometry & spatial reasoning | Name flat shapes and describe positions (above, below, next to). | — | K.G.1, K.G.2, K.G.4 | `shapes.name` (Think & Solve)<br>`shapes.corners` (Think & Solve, from difficulty 2)<br>`position.words` (Think & Solve) |
| 🧩 **Pattern Garden** (`L1-patterns`) | Patterns | Find and extend repeating patterns. | — | K.OA (patterns, informal) | `patterns.next` (Think & Solve) |
| 🧺 **Sorting** (`L1-sort`) | Logic & reasoning | Sort objects into groups and find the one that does not belong. | — | K.MD.3 | `sort.odd-one-out` (Think & Solve) |
| 📏 **Long & Short** (`L1-measure`) | Measurement | Compare two objects by length or size. | — | K.MD.1, K.MD.2 | `measure.length-pair` (Think & Solve)<br>`measure.size-pair` (Think & Solve) |
| 📖 **Garden Stories** (`L1-stories`) | Math Story Adventures | Solve joining and separating stories within 10 using pictures. | Putting Together, Taking Apart | K.OA.2 | `story.level1` (Story Adventure) |

**Lesson big ideas:**

- *Counting*: The last number you say tells how many.
- *Number Friends*: Each number has a name and a written shape.
- *More, Fewer, Same*: Match objects one to one. The group with extras has more.
- *Number Order*: Counting numbers come in order. Each one is 1 more than the one before.
- *Putting Together*: Adding means putting groups together to find how many in all.
- *Taking Apart*: Subtracting can mean taking some away and finding how many are left.
- *Number Bonds*: A number can be split into two parts in more than one way.
- *Shapes & Places*: Shapes are named by their sides and corners, not by their size or how they are turned.
- *Pattern Garden*: A pattern has a part that repeats.
- *Sorting*: We can sort things into groups by how they are alike.
- *Long & Short*: To compare lengths, line up the starts and look at the ends.
- *Garden Stories*: Picture the story. Ask: are groups joining, or are some leaving?

**Reasoning modes present in Level 1:** Think & Solve, Explain Your Thinking, Solve It Another Way, Story Adventure.

## Level 2 — Number Adventurers (Number Kingdom)

**Focus:** Developing arithmetic fluency with understanding.

| Skill | Domain | Objective | Prerequisites | CCSS (approx.) | Question generators (mode) |
|---|---|---|---|---|---|
| ➕ **Adding to 20** (`L2-add20`) | Operations | Add within 20 using strategies such as making ten and counting on. | Putting Together, Number Bonds | 1.OA.6, 1.OA.3 | `add20.facts` (Think & Solve)<br>`add20.make-ten` (Solve It Another Way, from difficulty 2)<br>`add20.mistake` (Find the Mistake)<br>`add20.doubles` (Solve It Another Way, from difficulty 2) |
| ➖ **Subtracting to 20** (`L2-sub20`) | Operations | Subtract within 20, including by thinking of a related addition. | Taking Apart, Adding to 20 | 1.OA.4, 1.OA.6 | `sub20.facts` (Think & Solve)<br>`sub20.think-addition` (Solve It Another Way, from difficulty 2) |
| 🔟 **Tens & Ones** (`L2-placevalue`) | Place value | Understand two-digit numbers as tens and ones. | Counting | 1.NBT.2 | `pv.blocks` (Think & Solve)<br>`pv.digit` (Think & Solve)<br>`pv.expanded` (Think & Solve, from difficulty 2)<br>`pv.mistake` (Find the Mistake, from difficulty 2) |
| 📍 **Number Lines** (`L2-numberline`) | Number sense & counting | Locate and read whole numbers on a number line. | Number Order | 2.MD.6 (early) | `nl.locate` (Think & Solve)<br>`nl.read` (Think & Solve) |
| ❓ **Missing Numbers** (`L2-missing`) | Equality & algebraic thinking | Find the unknown number in an addition or subtraction equation. | Adding to 20 | 1.OA.8 | `missing.number` (Think & Solve) |
| ⚖️ **Balance & Equal** (`L2-equality`) | Equality & algebraic thinking | Decide whether equations are true and explain why both sides are equal. | Adding to 20 | 1.OA.7 | `equality.tf` (Explain Your Thinking)<br>`equality.balance` (Think & Solve) |
| 🐊 **Comparing Numbers** (`L2-compare`) | Comparing & ordering | Compare two-digit numbers using tens and ones. | Tens & Ones | 1.NBT.3 | `cmp2.symbols` (Think & Solve)<br>`cmp2.greatest` (Think & Solve)<br>`cmp2.explain` (Explain Your Thinking, from difficulty 2) |
| ⏭️ **Skip Counting** (`L2-skip`) | Patterns | Skip count by 2s, 5s, and 10s and find missing terms. | Number Order | 1.NBT.1, 2.NBT.2 | `skip.basic` (Think & Solve) |
| 💰 **Coins** (`L2-money`) | Time & money | Name coin values and count collections of coins. | Skip Counting | 2.MD.8 (early) | `money.coin-value` (Think & Solve)<br>`money.count` (Think & Solve) |
| 🕐 **Telling Time** (`L2-time`) | Time & money | Tell time to the hour and half hour on an analog clock. | — | 1.MD.3 | `time.hour-half` (Think & Solve) |
| 📐 **Measuring** (`L2-measure`) | Measurement | Measure lengths in whole units starting from zero. | Long & Short | 1.MD.1, 1.MD.2 | `measure.ruler` (Think & Solve)<br>`measure.length-pair` (Think & Solve) |
| 📊 **Picture Graphs** (`L2-data`) | Data | Read and compare data in a simple graph. | Subtracting to 20 | 1.MD.4 | `data.simple` (Think & Solve) |
| 📚 **Kingdom Stories** (`L2-stories`) | Math Story Adventures | Solve one-step addition and subtraction stories, including comparison and missing-start problems. | Adding to 20, Subtracting to 20 | 1.OA.1 | `story.level2` (Story Adventure) |
| 🕵️ **Number Detective** (`L2-puzzles`) | Logic & reasoning | Use clues to find a number and find more than one way to make a total. | Tens & Ones, Adding to 20 | MP.1, MP.3 | `detective.clues-50` (Math Detective)<br>`detective.ways-to-make` (Solve It Another Way) |

**Lesson big ideas:**

- *Adding to 20*: Making a ten makes adding easier.
- *Subtracting to 20*: Subtraction can be solved by thinking of addition.
- *Tens & Ones*: In a two-digit number, the left digit counts tens and the right digit counts ones.
- *Number Lines*: On a number line, every space is the same size and numbers grow to the right.
- *Missing Numbers*: A missing number makes both sides of the equal sign the same amount.
- *Balance & Equal*: The equal sign means "is the same amount as."
- *Comparing Numbers*: Compare tens first. If the tens match, compare the ones.
- *Skip Counting*: Skip counting adds the same amount each time.
- *Coins*: A coin’s value is not about its size. A dime is small but worth 10¢.
- *Telling Time*: The short hand shows the hour. The long hand shows the minutes.
- *Measuring*: Measure from zero, and count the spaces (units), not the lines.
- *Picture Graphs*: A graph turns counts into pictures we can compare.
- *Kingdom Stories*: Understand the situation before choosing an operation.
- *Number Detective*: Detectives use each clue to cross out what cannot be true.

**Reasoning modes present in Level 2:** Think & Solve, Solve It Another Way, Find the Mistake, Explain Your Thinking, Story Adventure, Math Detective.

## Level 3 — Problem-Solving Champions (Puzzle Island)

**Focus:** Building mathematical structure and multi-step reasoning.

| Skill | Domain | Objective | Prerequisites | CCSS (approx.) | Question generators (mode) |
|---|---|---|---|---|---|
| ➕ **Two-Digit Adding** (`L3-addregroup`) | Operations | Add two-digit numbers, regrouping ones into a ten when needed. | Tens & Ones, Adding to 20 | 2.NBT.5 | `add2.regroup` (Think & Solve)<br>`add2.mistake` (Find the Mistake, from difficulty 2)<br>`add2.another-way` (Solve It Another Way, from difficulty 2) |
| ➖ **Two-Digit Subtracting** (`L3-subregroup`) | Operations | Subtract two-digit numbers, regrouping a ten into ones when needed. | Tens & Ones, Subtracting to 20 | 2.NBT.5 | `sub2.regroup` (Think & Solve)<br>`sub2.mistake` (Find the Mistake, from difficulty 2) |
| 🏛️ **Hundreds, Tens & Ones** (`L3-placevalue`) | Place value | Read, build, and compare three-digit numbers. | Tens & Ones | 2.NBT.1, 2.NBT.3, 2.NBT.4 | `pv3.blocks` (Think & Solve)<br>`pv3.digit` (Think & Solve)<br>`pv3.compare` (Think & Solve)<br>`pv.expanded` (Think & Solve, from difficulty 3) |
| 🧺 **Equal Groups** (`L3-equalgroups`) | Operations | Find totals of equal groups using repeated addition. | Skip Counting | 2.OA.4 | `groups.repeated` (Think & Solve) |
| 🧮 **Arrays** (`L3-multintro`) | Operations | Use arrays to understand multiplication. | Equal Groups | 2.OA.4, 3.OA.1 | `mult.array-count` (Think & Solve)<br>`mult.build-array` (Solve It Another Way)<br>`mult.commutative` (Explain Your Thinking, from difficulty 2) |
| 🍪 **Fair Sharing** (`L3-divintro`) | Operations | Share objects equally and find how many in each group. | Equal Groups | 3.OA.2 | `div.share` (Think & Solve)<br>`div.groups-of` (Think & Solve) |
| 🦘 **Skip Counting Plus** (`L3-skip`) | Patterns | Skip count forward and backward by 2, 3, 4, 5, 10, and 100. | Skip Counting | 2.NBT.2 | `skip.plus` (Think & Solve) |
| 🍫 **Equal Parts** (`L3-fractions`) | Fractions | Recognize equal parts and name halves, thirds, and fourths. | Shapes & Places | 2.G.3, 3.NF.1 | `frac.name` (Think & Solve)<br>`frac.shade` (Think & Solve)<br>`frac.equal-parts` (Explain Your Thinking)<br>`frac.whole` (Think & Solve, from difficulty 2) |
| 📏 **Units & Rulers** (`L3-measure`) | Measurement | Measure lengths and choose sensible units. | Measuring | 2.MD.1, 2.MD.3 | `measure.ruler` (Think & Solve)<br>`units.choose` (Think & Solve) |
| 🔺 **Shape Explorer** (`L3-geometry`) | Geometry & spatial reasoning | Identify shapes by their attributes, including sides and vertices. | Shapes & Places | 2.G.1 | `shapes.name` (Think & Solve)<br>`shapes.corners` (Think & Solve)<br>`geo.property` (Think & Solve) |
| 🧱 **Around the Edge** (`L3-perimeter`) | Measurement | Find the perimeter of a rectangle by adding its side lengths. | Two-Digit Adding | 3.MD.8 | `perimeter.rect` (Think & Solve)<br>`perimeter.mistake` (Find the Mistake, from difficulty 2) |
| 🕒 **Time to 5 Minutes** (`L3-time`) | Time & money | Tell time to the nearest five minutes. | Telling Time, Skip Counting | 2.MD.7 | `time.five` (Think & Solve) |
| 🪙 **Money Math** (`L3-money`) | Time & money | Count coins and make change from one dollar. | Coins, Two-Digit Subtracting | 2.MD.8 | `money.count` (Think & Solve)<br>`money.change` (Think & Solve) |
| 📊 **Bar Graphs** (`L3-data`) | Data | Answer put-together, take-apart, and compare questions using a bar graph. | Picture Graphs | 2.MD.10 | `data.bars` (Think & Solve) |
| 🎯 **Estimate & Check** (`L3-estimate`) | Number sense & counting | Round to the nearest ten and judge whether an answer is reasonable. | Hundreds, Tens & Ones | 3.NBT.1 (early) | `round.ten` (Think & Solve)<br>`estimate.reasonable` (Explain Your Thinking, from difficulty 2) |
| 🗺️ **Island Stories** (`L3-stories`) | Math Story Adventures | Solve two-step addition and subtraction stories. | Kingdom Stories, Two-Digit Adding | 2.OA.1 | `story.level3` (Story Adventure) |
| 🔍 **Puzzle Detective** (`L3-logic`) | Logic & reasoning | Use logical clues and decide whether a problem has enough information. | Number Detective | MP.1, MP.3 | `detective.clues-100` (Math Detective)<br>`detective.enough-info` (Math Detective) |

**Lesson big ideas:**

- *Two-Digit Adding*: When the ones make 10 or more, trade 10 ones for 1 ten.
- *Two-Digit Subtracting*: When there are not enough ones, regroup 1 ten as 10 ones.
- *Hundreds, Tens & Ones*: Each place is worth 10 times the place to its right.
- *Equal Groups*: Equal groups can be added with repeated addition.
- *Arrays*: An array shows equal rows. Rows × items in each row = total.
- *Fair Sharing*: Dividing shares a total into equal groups.
- *Skip Counting Plus*: Skip counting builds multiplication facts.
- *Equal Parts*: A fraction names equal parts of a whole.
- *Units & Rulers*: Choose a unit that fits the size of the thing.
- *Shape Explorer*: Shapes are named by their attributes: sides, vertices, and angles.
- *Around the Edge*: Perimeter is the distance all the way around.
- *Time to 5 Minutes*: Each number on the clock is 5 minutes for the long hand.
- *Money Math*: Change is the difference between what you pay and the price.
- *Bar Graphs*: Graphs help answer “how many more” and “how many in all.”
- *Estimate & Check*: Estimating gives a quick, close answer to check your work.
- *Island Stories*: Some problems need two steps. Solve step 1 and use it in step 2.
- *Puzzle Detective*: Good thinkers check whether they have enough information.

**Reasoning modes present in Level 3:** Think & Solve, Find the Mistake, Solve It Another Way, Explain Your Thinking, Story Adventure, Math Detective.

## Level 4 — Mathematical Thinkers (Logic Galaxy)

**Focus:** Advanced elementary reasoning and flexible problem solving.

| Skill | Domain | Objective | Prerequisites | CCSS (approx.) | Question generators (mode) |
|---|---|---|---|---|---|
| ✖️ **Multiplication** (`L4-mult`) | Operations | Multiply within 100 and use strategies such as breaking apart a factor. | Arrays | 3.OA.5, 3.OA.7 | `mult.facts` (Think & Solve)<br>`mult.break-apart` (Solve It Another Way, from difficulty 2)<br>`mult.mistake` (Find the Mistake, from difficulty 2) |
| ➗ **Division** (`L4-div`) | Operations | Divide within 100 by thinking about an unknown factor. | Fair Sharing, Multiplication | 3.OA.6, 3.OA.7 | `div.facts` (Think & Solve)<br>`div.unknown-factor` (Think & Solve)<br>`div.explain` (Explain Your Thinking) |
| 🔁 **Number Rules** (`L4-properties`) | Equality & algebraic thinking | Use commutative, associative, distributive, zero, and identity properties. | Multiplication | 3.OA.5 | `properties.tf` (Explain Your Thinking)<br>`properties.match` (Explain Your Thinking) |
| 🪜 **Multi-Step Math** (`L4-multistep`) | Operations | Evaluate two-step expressions and match them to situations. | Multiplication, Division | 3.OA.8 | `multistep.expr` (Think & Solve) |
| 🍕 **Equal Fractions** (`L4-fracequiv`) | Fractions | Recognize and generate equivalent fractions. | Equal Parts | 3.NF.3a, 3.NF.3b, 3.NF.3c | `fequiv.missing` (Think & Solve)<br>`fequiv.which` (Think & Solve)<br>`fequiv.mistake` (Find the Mistake, from difficulty 2) |
| 🥧 **Comparing Fractions** (`L4-fraccompare`) | Fractions | Compare fractions with the same numerator or the same denominator by reasoning about size. | Equal Parts | 3.NF.3d | `fcmp.compare` (Think & Solve)<br>`fcmp.explain` (Explain Your Thinking) |
| 📏 **Fraction Number Line** (`L4-fracline`) | Fractions | Place and read fractions on a number line. | Equal Parts, Number Lines | 3.NF.2 | `fline.place` (Think & Solve)<br>`fline.read` (Think & Solve) |
| 📦 **Area & Perimeter** (`L4-area`) | Measurement | Find area and perimeter of rectangles and tell them apart. | Around the Edge, Multiplication | 3.MD.5, 3.MD.6, 3.MD.7, 3.MD.8 | `area.grid` (Think & Solve)<br>`area.mistake` (Find the Mistake, from difficulty 2)<br>`area.same-perimeter` (Explain Your Thinking, from difficulty 2) |
| ⚖️ **Units & Conversions** (`L4-measure`) | Measurement | Choose units for mass and liquid volume and convert simple units of time and money. | Units & Rulers | 3.MD.2 | `units.choose` (Think & Solve)<br>`units.convert` (Think & Solve) |
| ⏱️ **Time Travelers** (`L4-elapsed`) | Time & money | Tell time to the minute and solve elapsed-time problems. | Time to 5 Minutes | 3.MD.1 | `time.minute` (Think & Solve)<br>`time.elapsed` (Think & Solve) |
| 📈 **Scaled Graphs** (`L4-data`) | Data | Read scaled bar graphs and solve one- and two-step questions. | Bar Graphs, Multiplication | 3.MD.3 | `data.scaled` (Think & Solve) |
| 🎯 **Rounding & Reasonableness** (`L4-rounding`) | Number sense & counting | Round to the nearest 10 or 100 and use estimates to check answers. | Estimate & Check | 3.NBT.1, 3.OA.8 | `round.hundred` (Think & Solve)<br>`estimate.sum` (Think & Solve)<br>`estimate.reasonable` (Explain Your Thinking) |
| 🔮 **Pattern Rules** (`L4-patterns`) | Patterns | Identify arithmetic patterns and explain them using properties. | Skip Counting Plus, Multiplication | 3.OA.9 | `patterns.rule` (Think & Solve)<br>`patterns.machine` (Think & Solve)<br>`patterns.asn` (Explain Your Thinking) |
| 🔶 **Shape Families** (`L4-geometry`) | Geometry & spatial reasoning | Understand that shapes in different categories can share attributes (a square is a rectangle). | Shape Explorer | 3.G.1 | `geo.family` (Explain Your Thinking)<br>`geo.property` (Think & Solve) |
| 🚀 **Galaxy Stories** (`L4-stories`) | Math Story Adventures | Solve multi-step stories with all four operations and decide if information is sufficient. | Island Stories, Multi-Step Math | 3.OA.3, 3.OA.8 | `story.level4` (Story Adventure)<br>`detective.enough-info` (Math Detective) |
| 🧠 **Logic Lab** (`L4-logic`) | Logic & reasoning | Analyze worked solutions, find errors, and justify answers. | Puzzle Detective | MP.3, MP.6 | `detective.clues-100` (Math Detective)<br>`mult.mistake` (Find the Mistake)<br>`fequiv.mistake` (Find the Mistake)<br>`area.mistake` (Find the Mistake)<br>`sub2.mistake` (Find the Mistake) |

**Lesson big ideas:**

- *Multiplication*: Break a hard fact into easier facts you know.
- *Division*: Division asks for an unknown factor.
- *Number Rules*: Properties let us change a problem without changing its value.
- *Multi-Step Math*: Do one step at a time. Multiply and divide before adding and subtracting.
- *Equal Fractions*: Equivalent fractions are different names for the same amount.
- *Comparing Fractions*: With the same whole: same bottom → compare tops; same top → bigger bottom means smaller pieces.
- *Fraction Number Line*: Fractions are numbers with places on the number line.
- *Area & Perimeter*: Area counts squares inside. Perimeter measures around the edge.
- *Units & Conversions*: Mass tells how heavy; liquid volume tells how much a container holds.
- *Time Travelers*: Elapsed time is how much time passes. Jump to the next hour, then add the rest.
- *Scaled Graphs*: In a scaled graph, each grid line can stand for more than 1.
- *Rounding & Reasonableness*: Round to make estimates; use estimates to check answers.
- *Pattern Rules*: Explain patterns using what you know about numbers.
- *Shape Families*: A shape can belong to more than one family.
- *Galaxy Stories*: Plan multi-step problems, and ask whether you have enough information.
- *Logic Lab*: Finding a mistake means checking each step and explaining what went wrong.

**Reasoning modes present in Level 4:** Think & Solve, Solve It Another Way, Find the Mistake, Explain Your Thinking, Story Adventure, Math Detective.

## Math Story Adventures

Each level has a story skill. Stories use 14 original settings (animal rescue, space station, ocean discovery, playground build, family cooking, garden, treasure hunt, market day, sports day, nature walk, robot lab, birthday party, picnic, library) and these problem structures:

| Structure | Example shape | Levels |
|---|---|---|
| Join, result unknown | A has a, gets b more | 1–2 |
| Separate, result unknown | A has a, gives b away | 1–3 |
| Part–part–whole | A has a, B has b; how many in all | 1–2 |
| Compare, difference unknown | How many more/fewer (drawn with a matching model, not take-away) | 1–3 |
| Join, change unknown | A had a, got some, now c | 2–3 |
| Compare, larger unknown | B has b; A has d more than B | 2 |
| Separate, change unknown | A had a, gave some, has c left | 2–3 |
| Join, start unknown | A had some, found b, now c | 3 |
| "More" that needs subtraction | A has a. That is d more than B. How many does B have? | 3–4 |
| Two-step | Finds more, then gives some away; or compare, then combine | 3–4 |
| Equal groups, sharing, measurement division | Bags of p; share t into g bags; boxes of p | 4 |
| Multi-step with ×/÷ | Packs × size − given away; trays × items ÷ tables | 4 |
| Sufficient vs. missing information | "Mia has some marbles…" — is there enough information? | 3–4 |

At higher difficulty, some stories include one clearly irrelevant number (e.g., "The market opens at 4 o'clock."). The validator requires every number in the text to be either used in the solution or explicitly declared irrelevant. Deliberately underdetermined "Is there enough information?" items are generated by a separate, labelled generator.

Each story runs **Read/Listen → Understand → Plan → Solve → Check → Explain → Celebrate**. The Understand, Plan and Explain steps are machine-checked: a plan is correct exactly when its equation has the story answer as its unique whole-number solution, so two different valid plans (e.g., `7 + ? = 12` and `12 − 7 = ?`) are both accepted.

## Family activities (offline)

| Level | Activity | Talk about it |
|---|---|---|
| 1 | 🥄 Count and Check | Did the number change when we moved them? Why not? |
| 1 | 🔎 Shape Hunt | How do you know it is a rectangle? |
| 1 | 🍇 Snack Compare | How many more does the bigger pile have? |
| 1 | 🧦 Sock Patterns | What part repeats? |
| 2 | 🥚 Egg Carton Ten | How did you figure it out without counting all of them? |
| 2 | 🪙 Coin Count | Why do we start with the coin worth the most? |
| 2 | 🕐 Clock Check | What will the clock show in one hour? |
| 2 | ✋ Hand Spans | Why did we get different numbers for the same table? |
| 3 | 🍎 Equal Groups at Home | Can you make the same total with different groups? |
| 3 | 🥪 Kitchen Fractions | Are the pieces really equal? How can we check? |
| 3 | 👣 Estimate the Steps | Was your estimate reasonable? How could you estimate better? |
| 3 | 📏 Perimeter Path | Which sides were equal? |
| 4 | 🧁 Double the Recipe | What is 1/2 + 1/2? How do you know? |
| 4 | 🛒 Shopping Estimate | Was the exact total close to the estimate? |
| 4 | ⏱️ Plan the Afternoon | How much time is left before dinner? |
| 4 | 🕵️ Number Detective | Which question helped the most? Why? |

_Totals: 59 skills; 130 skill–generator assignments; 16 family activities._
