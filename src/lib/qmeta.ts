import type { ProgressItem } from "./progress";

// Question metadata (the questions.type / questions.difficulty columns) surfaced
// as ordered, labelled dimensions for analytics + practice filters.

export const TYPES: { key: string; label: string; short: string }[] = [
  { key: "recall", label: "Recall / knowledge", short: "Recall" },
  { key: "application-scenario", label: "Application scenarios", short: "Scenario" },
  { key: "calculation", label: "Calculations", short: "Calc" },
];

export const DIFFICULTIES: { key: string; label: string; short: string }[] = [
  { key: "easy", label: "Easy", short: "Easy" },
  { key: "medium", label: "Medium", short: "Medium" },
  { key: "hard", label: "Hard", short: "Hard" },
];

export const TYPE_KEYS = TYPES.map((t) => t.key);
export const DIFFICULTY_KEYS = DIFFICULTIES.map((d) => d.key);

export type Cut = { key: string; label: string; correct: number; total: number; pct: number };

// Group answered items by a dimension, following a fixed order and dropping
// buckets with no data. `pick` extracts the item's value for the dimension.
export function breakdown(
  items: ProgressItem[],
  order: { key: string; label: string }[],
  pick: (it: ProgressItem) => string | null
): Cut[] {
  const agg = new Map<string, { correct: number; total: number }>();
  for (const it of items) {
    const k = pick(it);
    if (!k) continue;
    const cur = agg.get(k) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (it.is_correct) cur.correct += 1;
    agg.set(k, cur);
  }
  return order
    .filter((o) => agg.has(o.key))
    .map((o) => {
      const s = agg.get(o.key)!;
      return { key: o.key, label: o.label, correct: s.correct, total: s.total, pct: Math.round((s.correct / s.total) * 100) };
    });
}
