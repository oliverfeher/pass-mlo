import type { ProgressItem } from "./progress";

// Accuracy per calendar day (UTC), oldest first — the change-over-time series.
export type DayPoint = { date: string; correct: number; total: number; pct: number };

export function dailyAccuracy(items: ProgressItem[]): DayPoint[] {
  const byDay = new Map<string, { correct: number; total: number }>();
  for (const it of items) {
    const d = it.answered_at.slice(0, 10);
    const cur = byDay.get(d) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (it.is_correct) cur.correct += 1;
    byDay.set(d, cur);
  }
  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, s]) => ({ date, correct: s.correct, total: s.total, pct: Math.round((s.correct / s.total) * 100) }));
}

// Approximate seconds-per-question from the gap between consecutive answers
// WITHIN a session. Cross-session gaps and "walked away" pauses are excluded by
// dropping the first answer of each session and capping deltas. Approximate by
// nature — labelled as such in the UI.
const MAX_GAP = 180; // seconds; longer = treated as a pause, dropped

export type TimeStats = { medianSec: number; sampleSize: number } | null;

export function timePerQuestion(items: ProgressItem[]): TimeStats {
  const bySession = new Map<string, number[]>();
  for (const it of items) {
    const arr = bySession.get(it.session_id) ?? bySession.set(it.session_id, []).get(it.session_id)!;
    arr.push(Date.parse(it.answered_at));
  }
  const deltas: number[] = [];
  for (const times of bySession.values()) {
    times.sort((a, b) => a - b);
    for (let i = 1; i < times.length; i++) {
      const sec = (times[i] - times[i - 1]) / 1000;
      if (sec > 0 && sec <= MAX_GAP) deltas.push(sec);
    }
  }
  if (deltas.length < 15) return null; // too little signal to be honest about
  deltas.sort((a, b) => a - b);
  const mid = Math.floor(deltas.length / 2);
  const median = deltas.length % 2 ? deltas[mid] : (deltas[mid - 1] + deltas[mid]) / 2;
  return { medianSec: Math.round(median), sampleSize: deltas.length };
}
