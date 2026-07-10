"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Exam date is stored in Supabase user metadata (no table needed).
export default function ExamDateCard({
  examDate,
  daysLeft,
  dailyGoal,
  onTrack,
  todayISO,
}: {
  examDate: string | null;
  daysLeft: number | null;
  dailyGoal: number;
  onTrack: boolean;
  todayISO: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(examDate ?? "");
  const [busy, setBusy] = useState(false);

  async function save(date: string | null) {
    setBusy(true);
    await createClient().auth.updateUser({ data: { exam_date: date } });
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  const wrap: React.CSSProperties = {
    background: "#15233B", color: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 12,
  };

  // ----- edit / set state -----
  if (editing || !examDate || daysLeft === null || daysLeft < 0) {
    const past = examDate && daysLeft !== null && daysLeft < 0;
    return (
      <div style={wrap}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
          {past ? "Your exam date has passed" : "When's your exam?"}
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#B8C2D4", lineHeight: 1.5 }}>
          Set your test date and we&rsquo;ll show a countdown and a daily pace to be ready.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="date"
            min={todayISO}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{ padding: "9px 11px", borderRadius: 9, border: "none", fontSize: 14, fontFamily: "inherit" }}
          />
          <button
            onClick={() => value && save(value)}
            disabled={busy || !value}
            style={{ background: "#A9781F", color: "#fff", border: "none", borderRadius: 9, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: value ? "pointer" : "not-allowed", opacity: value ? 1 : 0.5 }}
          >
            {busy ? "…" : "Save"}
          </button>
          {examDate && (
            <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", color: "#B8C2D4", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  // ----- countdown state -----
  const dateLabel = new Date(examDate + "T00:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  return (
    <div style={wrap}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
            {daysLeft === 0 ? "Exam is today 🍀" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} to go`}
          </div>
          <div style={{ fontSize: 13, color: "#B8C2D4", marginTop: 2 }}>Exam on {dateLabel}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          {onTrack ? (
            <div style={{ fontSize: 13.5, color: "#8FD3AE", fontWeight: 600, maxWidth: 200 }}>
              On track — keep reviewing to stay sharp.
            </div>
          ) : (
            <div style={{ fontSize: 13.5, color: "#EBD9B4", maxWidth: 200 }}>
              Aim for <strong style={{ color: "#fff" }}>~{dailyGoal}</strong> questions/day to be ready.
            </div>
          )}
          <button onClick={() => { setValue(examDate); setEditing(true); }} style={{ background: "none", border: "none", color: "#7E8AA0", fontSize: 12, cursor: "pointer", marginTop: 6, padding: 0 }}>
            Change date
          </button>
        </div>
      </div>
    </div>
  );
}
