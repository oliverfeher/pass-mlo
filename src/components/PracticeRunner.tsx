"use client";
import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { areaBreakdown, overallPct, PASS_BAR, READY_BAR } from "@/lib/scoring";

export type Question = {
  id: string;
  content_area: string;
  subtopic?: string;
  stem: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

const LETTERS = ["A", "B", "C", "D", "E"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PracticeRunner({
  mode,
  initialQuestions,
  persist,
}: {
  mode: "practice" | "exam" | "diagnostic";
  initialQuestions: Question[];
  persist: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const sessionIdRef = useRef<string | null>(null);

  // Shuffle question order and option order once, remapping the correct index.
  const session = useMemo(() => {
    return shuffle(initialQuestions).map((q) => {
      const order = shuffle(q.options.map((_, i) => i));
      return {
        ...q,
        options: order.map((i) => q.options[i]),
        correct_index: order.indexOf(q.correct_index),
      };
    });
  }, [initialQuestions]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(false);

  async function ensureSession() {
    if (!persist || sessionIdRef.current) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("sessions")
      .insert({ user_id: user.id, mode })
      .select("id")
      .single();
    if (data) sessionIdRef.current = data.id;
  }

  async function recordItem(q: Question, chosen: number, order: number) {
    if (!persist) return;
    await ensureSession();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !sessionIdRef.current) return;
    await supabase.from("session_items").insert({
      session_id: sessionIdRef.current,
      user_id: user.id,
      question_id: q.id,
      chosen_index: chosen,
      is_correct: chosen === q.correct_index,
      presented_order: order,
    });
  }

  function choose(optIdx: number) {
    const q = session[idx];
    if (mode === "practice" || mode === "diagnostic") {
      if (revealed[idx]) return;
      setAnswers((a) => ({ ...a, [idx]: optIdx }));
      setRevealed((r) => ({ ...r, [idx]: true }));
      void recordItem(q, optIdx, idx);
    } else {
      setAnswers((a) => ({ ...a, [idx]: optIdx }));
    }
  }

  async function next() {
    if (mode === "exam") {
      const q = session[idx];
      if (answers[idx] !== undefined) void recordItem(q, answers[idx], idx);
    }
    if (idx < session.length - 1) setIdx(idx + 1);
    else {
      if (persist && sessionIdRef.current) {
        await supabase
          .from("sessions")
          .update({ finished_at: new Date().toISOString() })
          .eq("id", sessionIdRef.current);
      }
      setDone(true);
    }
  }

  if (!session.length) {
    return <Shell><p>No questions available yet. Seed the bank and try again.</p></Shell>;
  }

  if (done) {
    const items = session.map((q, i) => ({
      content_area: q.content_area,
      is_correct: answers[i] === q.correct_index,
    }));
    const pct = overallPct(items);
    const areas = areaBreakdown(items);
    const ready = pct >= READY_BAR;
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "6px 0 20px" }}>
          <div style={{ fontSize: 60, fontWeight: 800, color: pct >= PASS_BAR ? "#2E7A57" : "#B2422A", letterSpacing: -2 }}>
            {pct}%
          </div>
          <p style={{ color: "#5A6478" }}>Passing bar is {PASS_BAR}%.</p>
          <p style={{ fontWeight: 700, color: ready ? "#2E7A57" : "#B2422A" }}>
            {ready ? "Ready — you're above the bar with a buffer." : "Keep drilling to clear the bar with room to spare."}
          </p>
        </div>
        <h3 style={{ fontSize: 17, margin: "10px 0 12px" }}>By content area</h3>
        {areas.map((a) => (
          <div key={a.area} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 5 }}>
              <span style={{ fontWeight: 600 }}>{a.area}</span>
              <span style={{ color: "#5A6478" }}>{a.correct}/{a.total} · {a.pct}%</span>
            </div>
            <div style={{ height: 8, background: "#EAE4D7", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${a.pct}%`, height: "100%", background: a.pct >= PASS_BAR ? "#2E7A57" : a.pct >= 50 ? "#A9781F" : "#B2422A" }} />
            </div>
          </div>
        ))}
        {mode === "diagnostic" && (
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <a href="/pricing" style={{ background: "#A9781F", color: "#fff", padding: "13px 24px", borderRadius: 10, fontWeight: 600, textDecoration: "none" }}>
              Unlock the full bank
            </a>
          </div>
        )}
      </Shell>
    );
  }

  const q = session[idx];
  const chosen = answers[idx];
  const isRevealed = (mode !== "exam") && revealed[idx];
  const canAdvance = mode === "exam" ? chosen !== undefined : isRevealed;
  const pctBar = Math.round(((idx + (canAdvance ? 1 : 0)) / session.length) * 100);

  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 13, color: "#5A6478" }}>
        <span>Question {idx + 1} of {session.length}</span>
        <span style={{ color: "#A9781F", fontWeight: 700, textTransform: "uppercase", fontSize: 11 }}>{q.content_area}</span>
      </div>
      <div style={{ height: 6, background: "#E9E3D6", borderRadius: 99, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ width: `${pctBar}%`, height: "100%", background: "#A9781F" }} />
      </div>

      <p style={{ fontSize: 18, lineHeight: 1.45, fontWeight: 500, marginBottom: 18 }}>{q.stem}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.options.map((opt, i) => {
          let bg = "#fff", border = "#E4DDCF";
          if (isRevealed) {
            if (i === q.correct_index) { bg = "#E7F1EB"; border = "#2E7A57"; }
            else if (i === chosen) { bg = "#F6E7E1"; border = "#B2422A"; }
          } else if (mode === "exam" && chosen === i) { bg = "#F3F1EC"; border = "#15233B"; }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={isRevealed}
              style={{
                display: "flex", gap: 12, alignItems: "flex-start", textAlign: "left",
                padding: "14px 15px", border: `1.5px solid ${border}`, borderRadius: 11,
                background: bg, cursor: isRevealed ? "default" : "pointer", fontSize: 15, lineHeight: 1.4,
              }}
            >
              <span style={{ fontWeight: 700, color: "#5A6478" }}>{LETTERS[i]}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {isRevealed && (
        <div style={{ marginTop: 16, borderLeft: "3px solid #A9781F", background: "#FBF7EE", borderRadius: "0 10px 10px 0", padding: "14px 16px" }}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "#A9781F", marginBottom: 6 }}>
            {chosen === q.correct_index ? "Correct" : `Answer: ${LETTERS[q.correct_index]}`}
          </div>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "#33404F" }}>{q.explanation}</p>
        </div>
      )}

      <button
        onClick={next}
        disabled={!canAdvance}
        style={{
          marginTop: 20, width: "100%", background: "#A9781F", color: "#fff",
          padding: "15px", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 16,
          cursor: canAdvance ? "pointer" : "not-allowed", opacity: canAdvance ? 1 : 0.45,
        }}
      >
        {idx === session.length - 1 ? "Finish & see results" : "Next question"}
      </button>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 18px 60px" }}>
      <div style={{ background: "#fff", border: "1px solid #E4DDCF", borderRadius: 14, padding: "24px 22px", boxShadow: "0 12px 30px -18px rgba(21,35,59,.35)" }}>
        {children}
      </div>
    </main>
  );
}
