export type AreaStat = { area: string; correct: number; total: number; pct: number };

export function areaBreakdown(
  items: { content_area: string; is_correct: boolean }[]
): AreaStat[] {
  const map = new Map<string, { correct: number; total: number }>();
  for (const it of items) {
    const cur = map.get(it.content_area) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (it.is_correct) cur.correct += 1;
    map.set(it.content_area, cur);
  }
  return [...map.entries()].map(([area, s]) => ({
    area,
    correct: s.correct,
    total: s.total,
    pct: Math.round((s.correct / s.total) * 100),
  }));
}

// Passing bar is 75%. We only flag "ready" with a buffer above it.
export const PASS_BAR = 75;
export const READY_BAR = 80;

export function overallPct(items: { is_correct: boolean }[]): number {
  if (!items.length) return 0;
  return Math.round((items.filter((i) => i.is_correct).length / items.length) * 100);
}
