# Activity inventory (generated)

Generated from the source by `npm run docs:activities`. "Distinct questions" counts different questions a child could see (prompt, picture and answer labels), sampled from 600 seeds per generator and difficulty, so it is a lower bound. Every question shown is checked by the independent validator first (`src/engine/validate.ts`). Session lengths are from `planSession`. The audit notes are in [ACTIVITY_AUDIT.md](ACTIVITY_AUDIT.md).

## Level 1: Discovery Garden

| Skill | Topic | Objective | Generators (mode) | Answer types | Distinct questions (d1 / d2 / d3) | Practice · Skill Check · Check-back |
|---|---|---|---|---|---|---|
| 🔢 Counting | number | Count a set of up to 20 objects and tell how many. | count.objects (solve), count.tenframe (solve), count.explain (explain), count.any-order (explain) | choice, tf | 287 / 478 / 565 | 10 · 6 · 5 |
| 🔤 Number Friends | number | Recognize written numbers 0–20 and match them to quantities. | numerals.word (solve), numerals.match (solve) | choice, match | 129 / 330 / 330 | 10 · 6 · 5 |
| ⚖️ More, Fewer, Same | compare | Compare two groups or two numbers using more, fewer, and the same as. | compare.groups (solve), compare.numbers (solve), compare.same-number (explain) | choice, tf | 691 / 1053 / 1138 | 10 · 6 · 5 |
| 🪜 Number Order | compare | Order numbers to 20 and find missing numbers in a counting sequence. | order.next-before (solve), order.missing (solve), order.sort (solve) | choice, order | 44 / 654 / 682 | 10 · 6 · 5 |
| ➕ Putting Together | operations | Add within 10 by joining groups of objects. | add.objects (solve), add.tenframe (solve), add.what-changes (explain) | choice | 167 / 399 / 503 | 10 · 6 · 5 |
| ➖ Taking Apart | operations | Subtract within 10 by taking objects away. | sub.objects (solve), sub.what-changes (explain) | choice | 151 / 333 / 429 | 10 · 6 · 5 |
| 🔗 Number Bonds | operations | Show a number up to 10 as two parts in more than one way. | compose.bond (solve), compose.ways (another-way) | choice | 626 / 686 / 718 | 10 · 6 · 5 |
| 🔷 Shapes & Places | geometry | Name flat shapes and describe positions (above, below, next to). | shapes.name (solve), shapes.corners (solve), position.words (solve) | choice | 55 / 237 / 548 | 10 · 6 · 5 |
| 🧩 Pattern Garden | patterns | Find and extend repeating patterns. | patterns.next (solve) | choice | 56 / 206 / 294 | 10 · 6 · 5 |
| 🧺 Sorting | reasoning | Sort objects into groups and find the one that does not belong. | sort.odd-one-out (solve) | choice | 592 / 592 / 592 | 10 · 6 · 5 |
| 📏 Long & Short | measurement | Compare two objects by length or size. | measure.length-pair (solve), measure.size-pair (solve) | choice | 744 / 808 / 857 | 10 · 6 · 5 |
| 📖 Garden Stories | stories | Solve joining and separating stories within 10 using pictures. | story.level1 (story) | choice | 600 / 600 / 600 | 3 stories |

## Level 2: Number Kingdom

| Skill | Topic | Objective | Generators (mode) | Answer types | Distinct questions (d1 / d2 / d3) | Practice · Skill Check · Check-back |
|---|---|---|---|---|---|---|
| ➕ Adding to 20 | operations | Add within 20 using strategies such as making ten and counting on. | add20.facts (solve), add20.make-ten (another-way), add20.mistake (mistake), add20.doubles (another-way) | choice, numeric, tf | 177 / 305 / 323 | 10 · 6 · 5 |
| ➖ Subtracting to 20 | operations | Subtract within 20, including by thinking of a related addition. | sub20.facts (solve), sub20.think-addition (another-way) | choice, numeric | 42 / 72 / 158 | 10 · 6 · 5 |
| 🔟 Tens & Ones | place-value | Understand two-digit numbers as tens and ones. | pv.blocks (solve), pv.digit (solve), pv.expanded (solve), pv.mistake (mistake) | choice | 223 / 623 / 885 | 10 · 6 · 5 |
| 📍 Number Lines | number | Locate and read whole numbers on a number line. | nl.locate (solve), nl.read (solve) | choice, numberline | 20 / 36 / 257 | 10 · 6 · 5 |
| ❓ Missing Numbers | algebraic | Find the unknown number in an addition or subtraction equation. | missing.number (solve) | choice, numeric | 87 / 409 / 557 | 10 · 6 · 5 |
| ⚖️ Balance & Equal | algebraic | Decide whether equations are true and explain why both sides are equal. | equality.tf (explain), equality.balance (solve) | choice, numeric, tf | 454 / 841 / 1020 | 10 · 6 · 5 |
| 🐊 Comparing Numbers | compare | Compare two-digit numbers using tens and ones. | cmp2.symbols (solve), cmp2.greatest (solve), cmp2.explain (explain) | choice | 384 / 1069 / 1145 | 10 · 6 · 5 |
| ⏭️ Skip Counting | patterns | Skip count by 2s, 5s, and 10s and find missing terms. | skip.basic (solve) | choice | 14 / 49 / 125 | 10 · 6 · 5 |
| 💰 Coins | time-money | Name coin values and count collections of coins. | money.coin-value (solve), money.count (solve) | choice | 17 / 23 / 93 | 10 · 6 · 5 |
| 🕐 Telling Time | time-money | Tell time to the hour and half hour on an analog clock. | time.hour-half (solve) | choice | 12 / 24 / 24 | 10 · 6 · 5 |
| 📐 Measuring | measurement | Measure lengths in whole units starting from zero. | measure.ruler (solve), measure.length-pair (solve) | choice | 268 / 380 / 534 | 10 · 6 · 5 |
| 📊 Picture Graphs | data | Read and compare data in a simple graph. | data.simple (solve) | choice | 573 / 580 / 584 | 10 · 6 · 5 |
| 📚 Kingdom Stories | stories | Solve one-step addition and subtraction stories, including comparison and missing-start problems. | story.level2 (story) | numeric | 600 / 600 / 600 | 3 stories |
| 🕵️ Number Detective | reasoning | Use clues to find a number and find more than one way to make a total. | detective.clues-50 (detective), detective.ways-to-make (another-way) | choice, numeric | 1158 / 1193 / 1193 | 10 · 6 · 5 |

## Level 3: Puzzle Island

| Skill | Topic | Objective | Generators (mode) | Answer types | Distinct questions (d1 / d2 / d3) | Practice · Skill Check · Check-back |
|---|---|---|---|---|---|---|
| ➕ Two-Digit Adding | operations | Add two-digit numbers, regrouping ones into a ten when needed. | add2.regroup (solve), add2.mistake (mistake), add2.another-way (another-way) | choice, numeric | 384 / 1173 / 1330 | 10 · 6 · 5 |
| ➖ Two-Digit Subtracting | operations | Subtract two-digit numbers, regrouping a ten into ones when needed. | sub2.regroup (solve), sub2.mistake (mistake) | choice, numeric | 490 / 1034 / 1034 | 10 · 6 · 5 |
| 🏛️ Hundreds, Tens & Ones | place-value | Read, build, and compare three-digit numbers. | pv3.blocks (solve), pv3.digit (solve), pv3.compare (solve), pv.expanded (solve) | choice | 1326 / 1433 / 1730 | 10 · 6 · 5 |
| 🧺 Equal Groups | operations | Find totals of equal groups using repeated addition. | groups.repeated (solve) | choice | 66 / 267 / 338 | 10 · 6 · 5 |
| 🧮 Arrays | operations | Use arrays to understand multiplication. | mult.array-count (solve), mult.build-array (another-way), mult.commutative (explain) | array, choice, tf | 94 / 177 / 241 | 10 · 6 · 5 |
| 🍪 Fair Sharing | operations | Share objects equally and find how many in each group. | div.share (solve), div.groups-of (solve) | choice | 168 / 367 / 496 | 10 · 6 · 5 |
| 🦘 Skip Counting Plus | patterns | Skip count forward and backward by 2, 3, 4, 5, 10, and 100. | skip.plus (solve) | choice | 27 / 77 / 156 | 10 · 6 · 5 |
| 🍫 Equal Parts | fractions | Recognize equal parts and name halves, thirds, and fourths. | frac.name (solve), frac.shade (solve), frac.equal-parts (explain), frac.whole (solve) | choice, shade, tf | 154 / 173 / 205 | 10 · 6 · 5 |
| 📏 Units & Rulers | measurement | Measure lengths and choose sensible units. | measure.ruler (solve), units.choose (solve) | choice | 53 / 107 / 212 | 10 · 6 · 5 |
| 🔺 Shape Explorer | geometry | Identify shapes by their attributes, including sides and vertices. | shapes.name (solve), shapes.corners (solve), geo.property (solve) | choice | 59 / 226 / 537 | 10 · 6 · 5 |
| 🧱 Around the Edge | measurement | Find the perimeter of a rectangle by adding its side lengths. | perimeter.rect (solve), perimeter.mistake (mistake) | choice, numeric | 42 / 256 / 525 | 10 · 6 · 5 |
| 🕒 Time to 5 Minutes | time-money | Tell time to the nearest five minutes. | time.five (solve) | choice | 48 / 129 / 129 | 10 · 6 · 5 |
| 🪙 Money Math | time-money | Count coins and make change from one dollar. | money.count (solve), money.change (solve) | choice, numeric | 187 / 476 / 396 | 10 · 6 · 5 |
| 📊 Bar Graphs | data | Answer put-together, take-apart, and compare questions using a bar graph. | data.bars (solve) | choice | 586 / 600 / 600 | 10 · 6 · 5 |
| 🎯 Estimate & Check | number | Round to the nearest ten and judge whether an answer is reasonable. | round.ten (solve), estimate.reasonable (explain) | choice, tf | 36 / 678 / 885 | 10 · 6 · 5 |
| 🗺️ Island Stories | stories | Solve two-step addition and subtraction stories. | story.level3 (story) | numeric | 600 / 600 / 600 | 3 stories |
| 🔍 Puzzle Detective | reasoning | Use logical clues and decide whether a problem has enough information. | detective.clues-100 (detective), detective.enough-info (detective) | choice, numeric | 1000 / 1036 / 1040 | 10 · 6 · 5 |

## Level 4: Logic Galaxy

| Skill | Topic | Objective | Generators (mode) | Answer types | Distinct questions (d1 / d2 / d3) | Practice · Skill Check · Check-back |
|---|---|---|---|---|---|---|
| ✖️ Multiplication | operations | Multiply within 100 and use strategies such as breaking apart a factor. | mult.facts (solve), mult.break-apart (another-way), mult.mistake (mistake) | choice, numeric | 62 / 363 / 373 | 10 · 6 · 5 |
| ➗ Division | operations | Divide within 100 by thinking about an unknown factor. | div.facts (solve), div.unknown-factor (solve), div.explain (explain) | choice, numeric | 136 / 233 / 275 | 10 · 6 · 5 |
| 🔁 Number Rules | algebraic | Use commutative, associative, distributive, zero, and identity properties. | properties.tf (explain), properties.match (explain) | match, tf | 397 / 397 / 397 | 10 · 6 · 5 |
| 🪜 Multi-Step Math | operations | Evaluate two-step expressions and match them to situations. | multistep.expr (solve) | numeric | 450 / 503 / 474 | 10 · 6 · 5 |
| 🍕 Equal Fractions | fractions | Recognize and generate equivalent fractions. | fequiv.missing (solve), fequiv.which (solve), fequiv.mistake (mistake) | choice | 17 / 40 / 40 | 10 · 6 · 5 |
| 🥧 Comparing Fractions | fractions | Compare fractions with the same numerator or the same denominator by reasoning about size. | fcmp.compare (solve), fcmp.explain (explain) | choice | 112 / 185 / 185 | 10 · 6 · 5 |
| 📏 Fraction Number Line | fractions | Place and read fractions on a number line. | fline.place (solve), fline.read (solve) | choice, numberline | 8 / 20 / 45 | 10 · 6 · 5 |
| 📦 Area & Perimeter | measurement | Find area and perimeter of rectangles and tell them apart. | area.grid (solve), area.mistake (mistake), area.same-perimeter (explain) | choice, numeric, tf | 49 / 254 / 268 | 10 · 6 · 5 |
| ⚖️ Units & Conversions | measurement | Choose units for mass and liquid volume and convert simple units of time and money. | units.choose (solve), units.convert (solve) | choice | 72 / 77 / 77 | 10 · 6 · 5 |
| ⏱️ Time Travelers | time-money | Tell time to the minute and solve elapsed-time problems. | time.minute (solve), time.elapsed (solve) | choice, numeric | 384 / 956 / 975 | 10 · 6 · 5 |
| 📈 Scaled Graphs | data | Read scaled bar graphs and solve one- and two-step questions. | data.scaled (solve) | choice | 597 / 599 / 599 | 10 · 6 · 5 |
| 🎯 Rounding & Reasonableness | number | Round to the nearest 10 or 100 and use estimates to check answers. | round.hundred (solve), estimate.sum (solve), estimate.reasonable (explain) | choice, tf | 1585 / 1677 / 1711 | 10 · 6 · 5 |
| 🔮 Pattern Rules | patterns | Identify arithmetic patterns and explain them using properties. | patterns.rule (solve), patterns.machine (solve), patterns.asn (explain) | choice, numeric | 665 / 809 / 1102 | 10 · 6 · 5 |
| 🔶 Shape Families | geometry | Understand that shapes in different categories can share attributes (a square is a rectangle). | geo.family (explain), geo.property (solve) | choice, tf | 23 / 32 / 32 | 10 · 6 · 5 |
| 🚀 Galaxy Stories | stories | Solve multi-step stories with all four operations and decide if information is sufficient. | story.level4 (story), detective.enough-info (detective) | choice, numeric | 1010 / 1041 / 1045 | 3 stories |
| 🧠 Logic Lab | reasoning | Analyze worked solutions, find errors, and justify answers. | detective.clues-100 (detective), mult.mistake (mistake), fequiv.mistake (mistake), area.mistake (mistake), sub2.mistake (mistake) | choice, numeric | 1575 / 1582 / 1582 | 10 · 6 · 5 |
