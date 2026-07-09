"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type AreaRow = {
  key: string;
  label: string;
  pct: number | null; // null = not practiced yet
  total: number;
};

const LENGTHS = [10, 15, 25, 40];

function barColor(pct: number) {
  return pct >= 75 ? "#2E7A57" : pct >= 50 ? "#A9781F" : "#B2422A";
}

export default function CategoryPicker({ areas }: { areas: AreaRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [length, setLength] = useState(15);
  const [busy, setBusy] = useState<null | "selected" | "mix">(null);

  const toggle = (key: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const go = (href: string, which: "selected" | "mix") => {
    setBusy(which);
    router.push(href);
  };

  const practiceSelected = () => {
    const areasParam = encodeURIComponent([...selected].join(","));
    go(`/practice?areas=${areasParam}&length=${length}`, "selected");
  };

  const smartMix = () => go(`/practice?mix=weak&length=${length}`, "mix");

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {areas.map((a) => {
          const on = selected.has(a.key);
          return (
            <button
              key={a.key}
              onClick={() => toggle(a.key)}
              style={{
                display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                padding: "12px 14px", borderRadius: 11, cursor: "pointer",
                border: `1.5px solid ${on ? "#A9781F" : "#E4DDCF"}`,
                background: on ? "#FBF7EE" : "#fff",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: `1.5px solid ${on ? "#A9781F" : "#C9C0AE"}`,
                  background: on ? "#A9781F" : "#fff", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800,
                }}
              >
                {on ? "✓" : ""}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", justifyContent: "space-between", fontSize: 14.5, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>{a.label}</span>
                  <span style={{ color: "#5A6478", fontSize: 13 }}>
                    {a.pct === null ? "—" : `${a.pct}%`}
                    <span style={{ color: "#98A0AE" }}> · {a.total} ans</span>
                  </span>
                </span>
                <span style={{ display: "block", height: 6, background: "#EAE4D7", borderRadius: 99, overflow: "hidden" }}>
                  <span style={{ display: "block", width: `${a.pct ?? 0}%`, height: "100%", background: a.pct === null ? "#EAE4D7" : barColor(a.pct) }} />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 4px", flexWrap: "wrap" }}>
        <label style={{ fontSize: 13, color: "#5A6478" }}>Questions</label>
        <select
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          style={{ padding: "8px 10px", borderRadius: 9, border: "1.5px solid #E4DDCF", fontSize: 14, background: "#fff" }}
        >
          {LENGTHS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button
          onClick={practiceSelected}
          disabled={selected.size === 0 || busy !== null}
          style={{
            flex: "1 1 180px", padding: "13px", borderRadius: 10, fontWeight: 600, fontSize: 15,
            border: "1.5px solid #E4DDCF", background: "#fff", color: "#15233B",
            cursor: selected.size === 0 || busy ? "not-allowed" : "pointer",
            opacity: selected.size === 0 ? 0.5 : 1,
          }}
        >
          {busy === "selected" ? "Starting…" : `Practice selected${selected.size ? ` (${selected.size})` : ""}`}
        </button>
        <button
          onClick={smartMix}
          disabled={busy !== null}
          style={{
            flex: "1 1 180px", padding: "13px", borderRadius: 10, fontWeight: 600, fontSize: 15,
            border: "none", background: "#A9781F", color: "#fff",
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy === "mix" ? "Building…" : "⚡ Smart mix"}
        </button>
      </div>
      <p style={{ margin: "10px 2px 0", fontSize: 12.5, color: "#5A6478", lineHeight: 1.5 }}>
        Smart mix weights questions toward your weakest areas and the exam&rsquo;s real topic split.
      </p>
    </div>
  );
}
