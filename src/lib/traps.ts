// Heuristic trap-word detector. MLO questions hinge on qualifier words people
// skim past — "EXCEPT", "NOT", "LEAST", "most likely". Highlighting them trains
// the exact skill this product sells. Pure + content-free (no per-question data).

const PHRASES = [
  "all of the above", "none of the above", "least likely", "most likely",
  "not true", "best describes", "best describe", "except when", "only if",
];
const WORDS = [
  "except", "not", "never", "always", "least", "only", "cannot",
  "unless", "neither", "incorrect", "false",
];

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const RE = new RegExp(`(${PHRASES.map(esc).join("|")}|\\b(?:${WORDS.join("|")})\\b)`, "gi");

export type Seg = { text: string; trap: boolean };

export function splitTraps(stem: string): Seg[] {
  const segs: Seg[] = [];
  let last = 0;
  for (const m of stem.matchAll(RE)) {
    const i = m.index ?? 0;
    if (i > last) segs.push({ text: stem.slice(last, i), trap: false });
    segs.push({ text: m[0], trap: true });
    last = i + m[0].length;
  }
  if (last < stem.length) segs.push({ text: stem.slice(last), trap: false });
  return segs;
}

export function hasTraps(stem: string): boolean {
  return splitTraps(stem).some((s) => s.trap);
}
