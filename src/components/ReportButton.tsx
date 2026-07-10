"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const REASONS: { key: string; label: string }[] = [
  { key: "wrong_answer", label: "Answer looks wrong" },
  { key: "typo", label: "Typo / formatting" },
  { key: "confusing", label: "Confusing wording" },
  { key: "outdated", label: "Out of date" },
  { key: "other", label: "Other" },
];

// Lets a user flag a problem with a question. Reports feed the SME answer-key
// review (see supabase/migrations/0002_question_reports.sql).
export default function ReportButton({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  async function submit() {
    if (!reason) return;
    setBusy(true);
    setError(false);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error: insErr } = user
      ? await supabase.from("question_reports").insert({
          user_id: user.id,
          question_id: questionId,
          reason,
          note: note.trim() || null,
        })
      : { error: new Error("not signed in") };
    setBusy(false);
    if (insErr) setError(true);
    else setDone(true);
  }

  if (done) {
    return (
      <p style={{ marginTop: 14, fontSize: 12.5, color: "#2E7A57", textAlign: "center" }}>
        ✓ Thanks — we&rsquo;ll review this question.
      </p>
    );
  }

  if (!open) {
    return (
      <div style={{ marginTop: 14, textAlign: "center" }}>
        <button
          onClick={() => setOpen(true)}
          style={{ background: "none", border: "none", color: "#98A0AE", fontSize: 12.5, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}
        >
          ⚑ Report a problem with this question
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14, padding: "14px 15px", border: "1px solid #E4DDCF", borderRadius: 11, background: "#FBFAF6" }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#33404F", marginBottom: 10 }}>What&rsquo;s wrong?</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
        {REASONS.map((r) => {
          const on = reason === r.key;
          return (
            <button
              key={r.key}
              onClick={() => setReason(r.key)}
              style={{
                padding: "6px 11px", borderRadius: 99, fontSize: 12.5, cursor: "pointer",
                border: `1.5px solid ${on ? "#A9781F" : "#E4DDCF"}`,
                background: on ? "#A9781F" : "#fff", color: on ? "#fff" : "#5A6478",
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add detail (optional)"
        rows={2}
        style={{ width: "100%", boxSizing: "border-box", padding: "9px 11px", border: "1.5px solid #E4DDCF", borderRadius: 9, fontSize: 13, fontFamily: "inherit", resize: "vertical" }}
      />
      {error && (
        <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#B2422A" }}>
          Couldn&rsquo;t send that report. Please try again.
        </p>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#98A0AE", fontSize: 13, cursor: "pointer" }}>
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!reason || busy}
          style={{
            background: "#A9781F", color: "#fff", border: "none", borderRadius: 9, padding: "8px 16px",
            fontWeight: 600, fontSize: 13, cursor: reason && !busy ? "pointer" : "not-allowed", opacity: reason ? 1 : 0.5,
          }}
        >
          {busy ? "Sending…" : "Submit report"}
        </button>
      </div>
    </div>
  );
}
