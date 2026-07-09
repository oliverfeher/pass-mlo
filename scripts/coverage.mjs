// Coverage report: cross-references content/questions.json against the official
// outline in content/outline.json. Shows, per content area, how the current bank
// compares to the target count and which official outline nodes still have zero
// questions. Run: npm run coverage
import { readFileSync } from "node:fs";

const outline = JSON.parse(readFileSync("content/outline.json", "utf8"));
const bank = JSON.parse(readFileSync("content/questions.json", "utf8"));

const byRef = new Map();
const byArea = new Map();
for (const q of bank.questions) {
  byRef.set(q.outline_ref, (byRef.get(q.outline_ref) ?? 0) + 1);
  byArea.set(q.content_area, (byArea.get(q.content_area) ?? 0) + 1);
}

const bar = (n, width = 24) => "\u2588".repeat(Math.min(n, width)) + "\u00b7".repeat(Math.max(0, width - n));

let totalHave = 0;
let totalTarget = 0;
console.log("\n  MLO QUESTION BANK — COVERAGE vs. OFFICIAL OUTLINE\n  " + "=".repeat(60));

for (const area of outline.areas) {
  const have = byArea.get(area.content_area) ?? 0;
  totalHave += have;
  totalTarget += area.target_count;
  const pct = Math.round((have / area.target_count) * 100);
  const covered = area.leaves.filter((l) => byRef.has(l.id)).length;
  console.log(
    `\n  ${area.official_name}  (${(area.weight * 100).toFixed(0)}%)\n` +
      `  ${bar(Math.round(pct / 4))}  ${have}/${area.target_count} questions (${pct}%)\n` +
      `  outline nodes covered: ${covered}/${area.leaves.length}`
  );
  const gaps = area.leaves.filter((l) => !byRef.has(l.id));
  if (gaps.length) {
    console.log("  uncovered nodes:");
    for (const g of gaps) console.log(`    ${g.id}  ${g.label}`);
  }
}

console.log(
  "\n  " + "=".repeat(60) +
  `\n  TOTAL: ${totalHave}/${totalTarget} questions ` +
  `(${Math.round((totalHave / totalTarget) * 100)}% of v1 launch target)\n`
);
