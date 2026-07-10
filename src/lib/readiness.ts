import { PASS_BAR, READY_BAR } from "./scoring";

// A trustworthy readiness estimate — NOT raw accuracy. Three ideas:
//   1. Exam-weighted: each area counts by its real exam weight, not equally.
//   2. Shrinkage: thin samples are pulled toward a conservative prior, so
//      "6/6 in one area" doesn't masquerade as exam-wide readiness.
//   3. Confidence: how much of the exam you've actually sampled enough to judge.
// Conservative by design — this is a licensing exam; over-promising is the failure.

export const MIN_SAMPLE = 12;   // per-area answers for a "confident" read
const PRIOR_MEAN = 0.5;         // neutral prior an unseen area shrinks toward
const PRIOR_STRENGTH = 6;       // pseudo-observations of that prior

export type AreaInput = { key: string; weight: number; correct: number; total: number };

export type AreaReadiness = {
  key: string;
  weight: number;
  total: number;
  rawPct: number | null;        // observed accuracy, null if unseen
  estPct: number;               // shrinkage-adjusted accuracy (0-100)
  confident: boolean;           // total >= MIN_SAMPLE
};

export type Readiness = {
  score: number;                // 0-100, weighted + shrunk
  band: "unknown" | "not-ready" | "borderline" | "ready";
  label: string;
  confidence: number;           // 0-1 share of exam weight adequately sampled
  areas: AreaReadiness[];
  weakest: AreaReadiness[];     // seen areas, worst first (up to 3)
  thinAreas: AreaReadiness[];   // areas below MIN_SAMPLE (incl. unseen)
};

function shrink(correct: number, total: number): number {
  return (correct + PRIOR_MEAN * PRIOR_STRENGTH) / (total + PRIOR_STRENGTH);
}

export function computeReadiness(inputs: AreaInput[]): Readiness {
  const totalWeight = inputs.reduce((s, a) => s + a.weight, 0) || 1;

  const areas: AreaReadiness[] = inputs.map((a) => ({
    key: a.key,
    weight: a.weight,
    total: a.total,
    rawPct: a.total ? Math.round((a.correct / a.total) * 100) : null,
    estPct: Math.round(shrink(a.correct, a.total) * 100),
    confident: a.total >= MIN_SAMPLE,
  }));

  const score = Math.round(
    areas.reduce((s, a) => s + a.weight * (a.estPct / 100), 0) / totalWeight * 100
  );

  // Confidence: exam weight covered, each area capped at full once it hits MIN_SAMPLE.
  const confidence =
    inputs.reduce((s, a) => s + a.weight * Math.min(1, a.total / MIN_SAMPLE), 0) / totalWeight;

  let band: Readiness["band"];
  let label: string;
  if (confidence < 0.5) {
    band = "unknown";
    label = "Keep practicing to gauge readiness";
  } else if (score >= READY_BAR) {
    band = "ready";
    label = "Ready — above the bar with a buffer";
  } else if (score >= PASS_BAR) {
    band = "borderline";
    label = "Borderline — clear the bar with more room";
  } else {
    band = "not-ready";
    label = "Not ready yet — keep drilling";
  }

  const weakest = areas
    .filter((a) => a.total > 0)
    .sort((x, y) => (x.rawPct ?? 0) - (y.rawPct ?? 0))
    .slice(0, 3);
  const thinAreas = areas.filter((a) => a.total < MIN_SAMPLE);

  return { score, band, label, confidence, areas, weakest, thinAreas };
}

export const bandColor = (band: Readiness["band"]) =>
  band === "ready" ? "#2E7A57" : band === "borderline" ? "#A9781F" : band === "not-ready" ? "#B2422A" : "#5A6478";

export { PASS_BAR, READY_BAR };
