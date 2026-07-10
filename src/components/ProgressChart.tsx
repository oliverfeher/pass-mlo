import type { DayPoint } from "@/lib/trends";
import { PASS_BAR } from "@/lib/scoring";

// Single-series change-over-time chart (daily accuracy). Product palette: gold
// line/area on white, green dashed pass-bar reference. One series → no legend;
// the heading names it. Native <title> gives per-point hover with zero JS.
const W = 320, H = 140, PADL = 10, PADR = 30, PADT = 14, PADB = 22;
const plotW = W - PADL - PADR;
const plotH = H - PADT - PADB;

const x = (i: number, n: number) => PADL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
const y = (pct: number) => PADT + (1 - pct / 100) * plotH;

function shortDate(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export default function ProgressChart({ series }: { series: DayPoint[] }) {
  const n = series.length;
  const pts = series.map((p, i) => ({ ...p, cx: x(i, n), cy: y(p.pct) }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[n - 1].cx.toFixed(1)},${(PADT + plotH).toFixed(1)} L${pts[0].cx.toFixed(1)},${(PADT + plotH).toFixed(1)} Z`;
  const last = pts[n - 1];
  const passY = y(PASS_BAR);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Accuracy by day" style={{ display: "block", maxWidth: 460, margin: "0 auto" }}>
      {/* bounds + pass reference */}
      <line x1={PADL} y1={PADT} x2={PADL} y2={PADT + plotH} stroke="#EAE4D7" strokeWidth={1} />
      <line x1={PADL} y1={PADT + plotH} x2={W - PADR} y2={PADT + plotH} stroke="#EAE4D7" strokeWidth={1} />
      <line x1={PADL} y1={passY} x2={W - PADR} y2={passY} stroke="#2E7A57" strokeWidth={1} strokeDasharray="3 3" />
      <text x={W - PADR + 2} y={passY + 3} fontSize={8.5} fill="#2E7A57">pass {PASS_BAR}%</text>

      <path d={area} fill="#A9781F" fillOpacity={0.12} />
      <path d={line} fill="none" stroke="#A9781F" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {pts.map((p) => (
        <circle key={p.date} cx={p.cx} cy={p.cy} r={2.6} fill="#A9781F">
          <title>{shortDate(p.date)}: {p.pct}% ({p.correct}/{p.total})</title>
        </circle>
      ))}

      {/* direct label on the latest point */}
      <circle cx={last.cx} cy={last.cy} r={3.6} fill="#A9781F" stroke="#fff" strokeWidth={1.5} />
      <text x={Math.min(last.cx + 5, W - PADR)} y={Math.max(last.cy - 5, PADT + 6)} fontSize={10} fontWeight={700} fill="#15233B">{last.pct}%</text>

      {/* x-axis endpoints */}
      <text x={PADL} y={H - 6} fontSize={8.5} fill="#98A0AE">{shortDate(series[0].date)}</text>
      {n > 1 && <text x={W - PADR} y={H - 6} fontSize={8.5} fill="#98A0AE" textAnchor="end">{shortDate(series[n - 1].date)}</text>}
    </svg>
  );
}
