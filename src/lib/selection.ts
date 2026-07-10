import { AREAS } from "./areas";

// Fisher-Yates sample. Runs server-side only (no hydration concern) — the client
// PracticeRunner reshuffles for presentation; this just picks WHICH n.
export function sample<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.max(0, n));
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

// Deterministic sample seeded by a string (e.g. a date) — same seed → same pick.
// Used for the daily challenge so it's stable all day and differs each day.
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function seededSample<T>(arr: T[], n: number, seed: string): T[] {
  const rand = mulberry32(hashStr(seed));
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.max(0, n));
}

// Allocate `length` questions across areas, blending exam weight with weakness:
// score = examWeight * factor, where factor rises as accuracy drops below the
// 75% pass bar. Untested areas (accuracy null) get a mild boost so they surface.
// Returns a per-area count via largest-remainder rounding (sums to `length`).
export function weightedAllocation(
  length: number,
  areas: { key: string; weight: number; accuracy: number | null }[]
): Record<string, number> {
  const PASS = 0.75;
  const scored = areas.map((a) => {
    const factor = a.accuracy == null ? 1.6 : clamp(1 + (PASS - a.accuracy) * 2, 0.5, 2);
    return { key: a.key, score: a.weight * factor };
  });
  const total = scored.reduce((s, x) => s + x.score, 0) || 1;

  const raw = scored.map((x) => ({ key: x.key, exact: (length * x.score) / total }));
  const out: Record<string, number> = {};
  let assigned = 0;
  for (const r of raw) {
    out[r.key] = Math.floor(r.exact);
    assigned += out[r.key];
  }
  // Distribute the remainder to the largest fractional parts.
  raw
    .map((r) => ({ key: r.key, frac: r.exact - Math.floor(r.exact) }))
    .sort((a, b) => b.frac - a.frac)
    .slice(0, length - assigned)
    .forEach((r) => {
      out[r.key] += 1;
    });
  return out;
}

// Convenience: build a weak-weighted session from a full candidate pool and a
// per-area accuracy map. Falls back to filling any shortfall (e.g. an area with
// too few questions) from the rest of the pool.
export function buildSmartMix<T extends { id: string; content_area: string }>(
  pool: T[],
  accuracyByArea: Record<string, number | null>,
  length: number
): T[] {
  const alloc = weightedAllocation(
    length,
    AREAS.map((a) => ({ key: a.key, weight: a.weight, accuracy: accuracyByArea[a.key] ?? null }))
  );
  const byArea = new Map<string, T[]>();
  for (const q of pool) {
    (byArea.get(q.content_area) ?? byArea.set(q.content_area, []).get(q.content_area)!).push(q);
  }
  const picked: T[] = [];
  for (const [key, count] of Object.entries(alloc)) {
    picked.push(...sample(byArea.get(key) ?? [], count));
  }
  if (picked.length < length) {
    const have = new Set(picked.map((q) => q.id));
    picked.push(...sample(pool.filter((q) => !have.has(q.id)), length - picked.length));
  }
  return sample(picked, length);
}
