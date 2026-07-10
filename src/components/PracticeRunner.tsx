"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { areaBreakdown, overallPct, PASS_BAR, READY_BAR } from "@/lib/scoring";
import { TYPES } from "@/lib/qmeta";
import { splitTraps, hasTraps } from "@/lib/traps";
import ReportButton from "./ReportButton";
import LeadCapture from "./LeadCapture";

export type Question = {
  id: string;
  content_area: string;
  subtopic?: string;
  stem: string;
  options: string[];
  correct_index: number;
  explanation: string;
  type?: string | null;
  difficulty?: string | null;
  distractor_explanations?: (string | null)[] | null;
};

const LETTERS = ["A", "B", "C", "D", "E"];

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

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
  timedSeconds,
  askConfidence = false,
  initialBookmarkedIds = [],
}: {
  mode: "practice" | "exam" | "diagnostic";
  initialQuestions: Question[];
  persist: boolean;
  timedSeconds?: number;
  askConfidence?: boolean;
  initialBookmarkedIds?: string[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const sessionIdRef = useRef<string | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(() => new Set(initialBookmarkedIds));
  const [pendingChoice, setPendingChoice] = useState<number | null>(null);
  const [confidences, setConfidences] = useState<Record<number, number>>({});

  // Shuffle question + option order once, client-only. Doing this during render
  // (e.g. in useMemo) reruns Math.random() on both server and client and produces
  // a React hydration mismatch — keep all randomness in this effect.
  const [session, setSession] = useState<Question[] | null>(null);
  useEffect(() => {
    setSession(
      shuffle(initialQuestions).map((q) => {
        const order = shuffle(q.options.map((_, i) => i));
        return {
          ...q,
          options: order.map((i) => q.options[i]),
          correct_index: order.indexOf(q.correct_index),
          // Keep per-distractor rationales aligned to the shuffled options.
          distractor_explanations: q.distractor_explanations
            ? order.map((i) => q.distractor_explanations![i] ?? null)
            : null,
        };
      })
    );
  }, [initialQuestions]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(timedSeconds ?? null);

  const toggleFlag = (i: number) =>
    setFlagged((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  // Persistent bookmark (save to revisit). Optimistic; DB write is best-effort
  // (silently no-ops until migration 0003 adds the bookmarks table).
  async function toggleBookmark(qid: string) {
    const on = bookmarked.has(qid);
    setBookmarked((s) => {
      const n = new Set(s);
      on ? n.delete(qid) : n.add(qid);
      return n;
    });
    if (!persist) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    if (on) await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("question_id", qid);
    else await supabase.from("bookmarks").upsert({ user_id: user.id, question_id: qid });
  }

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

  async function recordItem(q: Question, chosen: number, order: number, confidence?: number) {
    if (!persist) return;
    await ensureSession();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !sessionIdRef.current) return;
    // Base insert uses only columns guaranteed to exist. Confidence is written
    // in a separate best-effort update so the core record never fails if the
    // confidence column isn't there yet (migration 0003).
    const { data } = await supabase
      .from("session_items")
      .insert({
        session_id: sessionIdRef.current,
        user_id: user.id,
        question_id: q.id,
        chosen_index: chosen,
        is_correct: chosen === q.correct_index,
        presented_order: order,
      })
      .select("id")
      .single();
    if (confidence && data?.id) {
      await supabase.from("session_items").update({ confidence }).eq("id", data.id);
    }
  }

  // In confidence mode, an option pick is held until the learner rates how sure
  // they are (before the answer is revealed — that's the whole point).
  function commit(optIdx: number, confidence?: number) {
    if (!session) return;
    const q = session[idx];
    setAnswers((a) => ({ ...a, [idx]: optIdx }));
    setRevealed((r) => ({ ...r, [idx]: true }));
    setPendingChoice(null);
    if (confidence) setConfidences((c) => ({ ...c, [idx]: confidence }));
    void recordItem(q, optIdx, idx, confidence);
  }

  function choose(optIdx: number) {
    if (!session) return;
    if (mode === "practice" || mode === "diagnostic") {
      if (revealed[idx]) return;
      if (askConfidence) setPendingChoice(optIdx); // hold for the confidence rating
      else commit(optIdx);
    } else {
      setAnswers((a) => ({ ...a, [idx]: optIdx }));
    }
  }

  const CONFIDENCE_OPTS = [
    { v: 1, label: "Guessing" },
    { v: 2, label: "Fairly sure" },
    { v: 3, label: "Certain" },
  ];

  // Exam answers are recorded in one batch at finish — so navigating back and
  // changing an answer doesn't leave stale duplicate rows.
  async function recordExamAnswers() {
    if (!persist || !session) return;
    await ensureSession();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !sessionIdRef.current) return;
    const rows = session.flatMap((q, i) =>
      answers[i] === undefined
        ? []
        : [{
            session_id: sessionIdRef.current!,
            user_id: user.id,
            question_id: q.id,
            chosen_index: answers[i],
            is_correct: answers[i] === q.correct_index,
            presented_order: i,
          }]
    );
    if (rows.length) await supabase.from("session_items").insert(rows);
  }

  async function finalize() {
    if (mode === "exam") await recordExamAnswers();
    if (persist && sessionIdRef.current) {
      await supabase
        .from("sessions")
        .update({ finished_at: new Date().toISOString() })
        .eq("id", sessionIdRef.current);
    }
    setDone(true);
  }

  function prev() {
    if (idx > 0) setIdx(idx - 1);
  }

  async function next() {
    if (!session) return;
    if (idx < session.length - 1) setIdx(idx + 1);
    else await finalize();
  }

  // Exam countdown. Starts once questions have loaded; auto-submits at zero.
  useEffect(() => {
    if (remaining === null || done || !session) return;
    if (remaining <= 0) {
      void finalize();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => (r === null ? r : r - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, done, session]);

  if (session === null) {
    return <Shell><p style={{ color: "#5A6478" }}>Loading questions…</p></Shell>;
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
    const correctCount = items.filter((i) => i.is_correct).length;
    const areas = areaBreakdown(items);
    const ready = pct >= READY_BAR;
    const passed = pct >= PASS_BAR;

    // Per-type breakdown (recall / scenario / calculation), if the set carries types.
    const typeStats = TYPES.map((t) => {
      const rel = session
        .map((qq, i) => ({ type: qq.type, ok: answers[i] === qq.correct_index }))
        .filter((x) => x.type === t.key);
      return rel.length ? { label: t.label, correct: rel.filter((x) => x.ok).length, total: rel.length } : null;
    }).filter(Boolean) as { label: string; correct: number; total: number }[];

    const Bar = ({ label, correct, total }: { label: string; correct: number; total: number }) => {
      const p = Math.round((correct / total) * 100);
      return (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 5 }}>
            <span style={{ fontWeight: 600 }}>{label}</span>
            <span style={{ color: "#5A6478" }}>{correct}/{total} · {p}%</span>
          </div>
          <div style={{ height: 8, background: "#EAE4D7", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${p}%`, height: "100%", background: p >= PASS_BAR ? "#2E7A57" : p >= 50 ? "#A9781F" : "#B2422A" }} />
          </div>
        </div>
      );
    };

    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "6px 0 18px" }}>
          <div style={{ display: "inline-block", padding: "3px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, color: "#fff", background: passed ? "#2E7A57" : "#B2422A" }}>
            {passed ? "Pass" : "Below bar"}
          </div>
          <div style={{ fontSize: 60, fontWeight: 800, color: passed ? "#2E7A57" : "#B2422A", letterSpacing: -2, lineHeight: 1 }}>
            {pct}%
          </div>
          <p style={{ color: "#5A6478", margin: "6px 0 0" }}>{correctCount} of {session.length} correct · passing bar {PASS_BAR}%</p>
          <p style={{ fontWeight: 700, color: ready ? "#2E7A57" : passed ? "#A9781F" : "#B2422A", margin: "6px 0 0" }}>
            {ready ? "Ready — above the bar with a buffer." : passed ? "At the bar — build more of a cushion." : "Keep drilling to clear the bar."}
          </p>
        </div>

        <h3 style={{ fontSize: 17, margin: "10px 0 12px" }}>By content area</h3>
        {areas.map((a) => <Bar key={a.area} label={a.area} correct={a.correct} total={a.total} />)}

        {typeStats.length > 0 && (
          <>
            <h3 style={{ fontSize: 17, margin: "20px 0 12px" }}>By question type</h3>
            {typeStats.map((t) => <Bar key={t.label} label={t.label} correct={t.correct} total={t.total} />)}
          </>
        )}

        <button
          onClick={() => setShowReview((v) => !v)}
          style={{ marginTop: 18, width: "100%", background: "#15233B", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
        >
          {showReview ? "Hide answer review" : `Review your answers${flagged.size ? ` (${flagged.size} flagged)` : ""}`}
        </button>
        {showReview && (
          <div style={{ marginTop: 16 }}>
            {session.map((qq, i) => {
              const yourAns = answers[i];
              const ok = yourAns === qq.correct_index;
              return (
                <div key={qq.id} style={{ borderTop: "1px solid #EAE4D7", padding: "14px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: ok ? "#2E7A57" : "#B2422A", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {i + 1}. {yourAns === undefined ? "Skipped" : ok ? "Correct" : "Incorrect"}
                    </span>
                    {flagged.has(i) && <span style={{ color: "#A9781F", fontSize: 13 }}>⚑ flagged</span>}
                  </div>
                  <p style={{ margin: "0 0 8px", fontSize: 15, lineHeight: 1.45 }}><TrapText text={qq.stem} enabled /></p>
                  {yourAns !== undefined && !ok && (
                    <p style={{ margin: "0 0 3px", fontSize: 13.5, color: "#B2422A" }}>Your answer: {LETTERS[yourAns]}. {qq.options[yourAns]}</p>
                  )}
                  <p style={{ margin: "0 0 8px", fontSize: 13.5, color: "#2E7A57" }}>Correct: {LETTERS[qq.correct_index]}. {qq.options[qq.correct_index]}</p>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "#33404F", background: "#FBF7EE", borderRadius: 8, padding: "10px 12px" }}>{qq.explanation}</p>
                </div>
              );
            })}
          </div>
        )}

        {mode === "diagnostic" && (
          <>
            <div style={{ marginTop: 24, padding: "18px 18px", borderRadius: 12, background: "#FBF7EE", border: "1px solid #E4DDCF" }}>
              <h3 style={{ fontSize: 16, margin: "0 0 8px" }}>Your study plan</h3>
              {(() => {
                const weak = [...areas].sort((a, b) => a.pct - b.pct).slice(0, 2);
                return (
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#33404F" }}>
                    {passed
                      ? "You're near the bar already. Tighten your weakest areas, then run full timed exams to build a cushion:"
                      : "Here's where to focus first — your two weakest areas carry a lot of exam weight:"}
                    <br />
                    {weak.map((w, i) => (
                      <span key={w.area} style={{ fontWeight: 600 }}>
                        {i > 0 ? " · " : ""}{w.area} ({w.pct}%)
                      </span>
                    ))}
                    . With the full bank you get spaced repetition, a weak-area Smart mix, and timed simulations to close these gaps.
                  </p>
                );
              })()}
            </div>
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <a href="/pricing" style={{ background: "#A9781F", color: "#fff", padding: "13px 24px", borderRadius: 10, fontWeight: 600, textDecoration: "none" }}>
                Unlock the full bank
              </a>
            </div>
            <LeadCapture source="diagnostic" />
          </>
        )}
        {persist && (
          <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/dashboard" style={{ background: "#A9781F", color: "#fff", padding: "12px 22px", borderRadius: 10, fontWeight: 600, textDecoration: "none" }}>
              Back to dashboard
            </a>
            <a href="/practice?review=1&length=20" style={{ padding: "12px 22px", borderRadius: 10, fontWeight: 600, textDecoration: "none", border: "1.5px solid #E4DDCF", color: "#15233B" }}>
              Review missed
            </a>
          </div>
        )}
      </Shell>
    );
  }

  const q = session[idx];
  const chosen = answers[idx];
  const isRevealed = (mode !== "exam") && revealed[idx];
  const isExam = mode === "exam";
  const canAdvance = isExam ? true : isRevealed; // exam lets you skip / come back
  const pctBar = Math.round(((idx + (canAdvance ? 1 : 0)) / session.length) * 100);
  const isFlagged = flagged.has(idx);

  return (
    <Shell>
      {remaining !== null && (
        <div
          style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 12, padding: "8px 12px", borderRadius: 9,
            background: remaining <= 60 ? "#F6E7E1" : "#F3F1EC",
            border: `1px solid ${remaining <= 60 ? "#B2422A" : "#E4DDCF"}`,
          }}
        >
          <span style={{ fontSize: 12, color: "#5A6478", textTransform: "uppercase", letterSpacing: 1 }}>Time left</span>
          <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 800, fontSize: 18, color: remaining <= 60 ? "#B2422A" : "#15233B" }}>
            {fmtTime(remaining)}
          </span>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: 13, color: "#5A6478" }}>
        <span>Question {idx + 1} of {session.length}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#A9781F", fontWeight: 700, textTransform: "uppercase", fontSize: 11 }}>{q.content_area}</span>
          {persist && (
            <button
              onClick={() => toggleBookmark(q.id)}
              title={bookmarked.has(q.id) ? "Remove bookmark" : "Bookmark to revisit"}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: 0, color: bookmarked.has(q.id) ? "#A9781F" : "#C9C0AE", lineHeight: 1 }}
            >
              {bookmarked.has(q.id) ? "★" : "☆"}
            </button>
          )}
          <button
            onClick={() => toggleFlag(idx)}
            title={isFlagged ? "Unflag" : "Flag for review"}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: 0, color: isFlagged ? "#A9781F" : "#C9C0AE", lineHeight: 1 }}
          >
            {isFlagged ? "⚑" : "⚐"}
          </button>
        </span>
      </div>
      <div style={{ height: 6, background: "#E9E3D6", borderRadius: 99, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ width: `${pctBar}%`, height: "100%", background: "#A9781F" }} />
      </div>

      <p style={{ fontSize: 18, lineHeight: 1.45, fontWeight: 500, marginBottom: isExam ? 18 : 8 }}>
        <TrapText text={q.stem} enabled={!isExam} />
      </p>
      {!isExam && hasTraps(q.stem) && (
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#A9781F" }}>
          ⚠ Highlighted words flip the question — read them carefully.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.options.map((opt, i) => {
          let bg = "#fff", border = "#E4DDCF";
          if (isRevealed) {
            if (i === q.correct_index) { bg = "#E7F1EB"; border = "#2E7A57"; }
            else if (i === chosen) { bg = "#F6E7E1"; border = "#B2422A"; }
          } else if ((mode === "exam" && chosen === i) || pendingChoice === i) { bg = "#F3F1EC"; border = "#15233B"; }
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

      {!isRevealed && askConfidence && pendingChoice !== null && (
        <div style={{ marginTop: 16, padding: "14px 16px", border: "1.5px solid #A9781F", borderRadius: 11, background: "#FBF7EE" }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#33404F", marginBottom: 10 }}>How sure are you?</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CONFIDENCE_OPTS.map((c) => (
              <button
                key={c.v}
                onClick={() => commit(pendingChoice, c.v)}
                style={{ flex: "1 1 90px", padding: "10px", borderRadius: 9, border: "1.5px solid #E4DDCF", background: "#fff", color: "#15233B", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isRevealed && (
        <div style={{ marginTop: 16, borderLeft: "3px solid #A9781F", background: "#FBF7EE", borderRadius: "0 10px 10px 0", padding: "14px 16px" }}>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "#A9781F", marginBottom: 6 }}>
            {chosen === q.correct_index ? "Correct" : `Answer: ${LETTERS[q.correct_index]}`}
            {confidences[idx] === 3 && chosen !== q.correct_index && (
              <span style={{ color: "#B2422A", marginLeft: 8 }}>· you were certain — worth a close look</span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "#33404F" }}>{q.explanation}</p>
          {q.distractor_explanations && chosen !== undefined && chosen !== q.correct_index && q.distractor_explanations[chosen] && (
            <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "#8A3A24" }}>
              <strong>Why {LETTERS[chosen]} is wrong:</strong> {q.distractor_explanations[chosen]}
            </p>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {isExam && idx > 0 && (
          <button
            onClick={prev}
            style={{
              flex: "0 0 auto", padding: "15px 20px", background: "#fff", color: "#15233B",
              border: "1.5px solid #E4DDCF", borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: "pointer",
            }}
          >
            ← Back
          </button>
        )}
        <button
          onClick={next}
          disabled={!canAdvance}
          style={{
            flex: 1, background: "#A9781F", color: "#fff",
            padding: "15px", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 16,
            cursor: canAdvance ? "pointer" : "not-allowed", opacity: canAdvance ? 1 : 0.45,
          }}
        >
          {idx === session.length - 1 ? "Finish & see results" : isExam && chosen === undefined ? "Skip" : "Next question"}
        </button>
      </div>

      {persist && <ReportButton key={q.id} questionId={q.id} />}
    </Shell>
  );
}

// Renders a stem with trap-signalling qualifier words highlighted.
function TrapText({ text, enabled }: { text: string; enabled: boolean }) {
  if (!enabled || !hasTraps(text)) return <>{text}</>;
  return (
    <>
      {splitTraps(text).map((s, i) =>
        s.trap ? (
          <mark key={i} style={{ background: "#FBE9C7", color: "#7A5A12", padding: "0 2px", borderRadius: 3, fontWeight: 700 }}>{s.text}</mark>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </>
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
