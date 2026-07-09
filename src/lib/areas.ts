// Canonical content areas. `key` matches the questions.content_area DB enum
// exactly — do not rename without a migration. `weight` is the official NMLS
// exam weighting (see CLAUDE.md); used to shape the "Smart mix" session.
export type Area = { key: string; label: string; short: string; weight: number };

export const AREAS: Area[] = [
  { key: "Origination Activities", label: "Origination Activities", short: "Origination", weight: 27 },
  { key: "Federal Laws", label: "Federal Laws", short: "Federal", weight: 24 },
  { key: "General Mortgage Knowledge", label: "General Mortgage Knowledge", short: "General", weight: 20 },
  { key: "Ethics", label: "Ethics", short: "Ethics", weight: 18 },
  { key: "Uniform State", label: "Uniform State Content", short: "Uniform State", weight: 11 },
];

export const AREA_KEYS = AREAS.map((a) => a.key);
