// Static QA audit for content/questions.json. Runs with no live data.
// Flags the kinds of issues that hint at a bad answer key or weak item:
//   - answer-position bias (correct answer clustering on one letter)
//   - duplicate or near-duplicate stems
//   - missing/short explanations or citations
//   - duplicate/blank options, out-of-range keys
//   - outline_ref values not present in content/outline.json
// Run: npm run qa
import { readFileSync } from "node:fs";

const bank = JSON.parse(readFileSync("content/questions.json", "utf8")).questions;
const outline = JSON.parse(readFileSync("content/outline.json", "utf8"));
const validRefs = new Set(outline.areas.flatMap((a) => a.leaves.map((l) => l.id)));
const LETTERS = ["A", "B", "C", "D", "E"];

const issues = [];
const flag = (sev, id, msg) => issues.push({ sev, id, msg });

// --- answer-position distribution (global + should be roughly even) ---
const pos = [0, 0, 0, 0];
for (const q of bank) pos[q.correct_index]++;
const n = bank.length;
const expected = n / 4;
console.log("\n  ANSWER-KEY QA AUDIT");
console.log("  " + "=".repeat(56));
console.log(`\n  Answer-position distribution (n=${n}, ideal ~${expected.toFixed(0)} each):`);
LETTERS.slice(0, 4).forEach((L, i) => {
  const pct = ((pos[i] / n) * 100).toFixed(1);
  const skew = pos[i] > expected * 1.4 || pos[i] < expected * 0.6 ? "  <-- skew" : "";
  console.log(`    ${L}: ${String(pos[i]).padStart(3)}  (${pct}%)${skew}`);
});
// chi-square-ish flag
const chi = pos.reduce((s, o) => s + (o - expected) ** 2 / expected, 0);
if (chi > 7.815) flag("warn", "-", `answer positions look uneven (chi-sq ${chi.toFixed(1)} > 7.815); consider re-balancing keys`);

// --- per-question checks ---
const stems = new Map();
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
for (const q of bank) {
  if (!q.outline_ref || !validRefs.has(q.outline_ref)) flag("error", q.id, `outline_ref '${q.outline_ref}' not in outline.json`);
  if (q.correct_index < 0 || q.correct_index >= q.options.length) flag("error", q.id, "correct_index out of range");
  if (q.options.length !== 4) flag("error", q.id, `has ${q.options.length} options (expected 4)`);
  if (new Set(q.options.map((o) => norm(o))).size !== q.options.length) flag("error", q.id, "duplicate/near-duplicate options");
  if (q.options.some((o) => !o || !o.trim())) flag("error", q.id, "blank option");
  if (!q.primary_source_citation) flag("warn", q.id, "missing citation");
  if (!q.explanation || q.explanation.split(/\s+/).length < 12) flag("warn", q.id, "explanation is very short (<12 words)");
  if (!/why|because|not|prohibit|require|distractor|is the|equals|=/.test((q.explanation || "").toLowerCase()))
    flag("info", q.id, "explanation may not address why distractors are wrong");
  const key = norm(q.stem);
  if (stems.has(key)) flag("warn", q.id, `stem duplicates ${stems.get(key)}`);
  else stems.set(key, q.id);
}

// --- report ---
const bySev = { error: [], warn: [], info: [] };
for (const it of issues) bySev[it.sev].push(it);
console.log(`\n  Findings: ${bySev.error.length} errors, ${bySev.warn.length} warnings, ${bySev.info.length} info\n`);
for (const sev of ["error", "warn", "info"]) {
  if (!bySev[sev].length) continue;
  console.log(`  ${sev.toUpperCase()}:`);
  for (const it of bySev[sev].slice(0, 40)) console.log(`    [${it.id}] ${it.msg}`);
  if (bySev[sev].length > 40) console.log(`    ...and ${bySev[sev].length - 40} more`);
  console.log("");
}
if (!bySev.error.length) console.log("  No structural errors. Warnings/info are review hints, not blockers.\n");
process.exit(bySev.error.length ? 1 : 0);
