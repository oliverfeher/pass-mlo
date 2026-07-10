import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasEntitlement } from "@/lib/entitlements";
import { fetchProgress, missedIds, currentStreak } from "@/lib/progress";
import { dueQuestionIds } from "@/lib/srs";
import { AREAS } from "@/lib/areas";
import { breakdown, TYPES, DIFFICULTIES } from "@/lib/qmeta";
import { dailyAccuracy, timePerQuestion } from "@/lib/trends";
import ProgressChart from "@/components/ProgressChart";
import { computeReadiness, bandColor, PASS_BAR } from "@/lib/readiness";
import { daysUntil, studyPace } from "@/lib/plan";
import CategoryPicker, { type AreaRow } from "@/components/CategoryPicker";
import ExamDateCard from "@/components/ExamDateCard";

const SHORT = Object.fromEntries(AREAS.map((a) => [a.key, a.short]));

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <Gate title="Log in to see your dashboard" cta="Log in" href="/login" />;
  if (!(await hasEntitlement()))
    return (
      <Gate
        title="Unlock the full question bank"
        body="Get lifetime access to the full bank, timed simulated exams, and your weak-area dashboard."
        cta="Unlock access"
        href="/pricing"
      />
    );

  const prog = await fetchProgress(supabase, user.id);
  const todayISO = new Date().toISOString().slice(0, 10);
  const streak = currentStreak(prog.answeredDates, todayISO);
  const missed = missedIds(prog.items).length;
  const dueCount = dueQuestionIds(prog.items, Date.now()).length;
  const readiness = computeReadiness(
    AREAS.map((a) => ({
      key: a.key,
      weight: a.weight,
      correct: prog.byArea[a.key]?.correct ?? 0,
      total: prog.byArea[a.key]?.total ?? 0,
    }))
  );
  const areasReady = readiness.areas.filter((a) => a.confident && a.estPct >= PASS_BAR).length;
  const typeCuts = breakdown(prog.items, TYPES, (it) => it.type);
  const diffCuts = breakdown(prog.items, DIFFICULTIES, (it) => it.difficulty);
  const series = dailyAccuracy(prog.items);
  const timeStats = timePerQuestion(prog.items);

  // Exam-date countdown + pace (exam date stored in user metadata).
  const TARGET_PER_AREA = 25;
  const examDate = ((user.user_metadata as Record<string, unknown> | null)?.exam_date as string) ?? null;
  const daysLeft = examDate ? daysUntil(examDate, todayISO) : null;
  const notReadyRemaining = readiness.areas
    .filter((a) => !(a.confident && a.estPct >= PASS_BAR))
    .reduce((s, a) => s + Math.max(0, TARGET_PER_AREA - a.total), 0);
  const pace = studyPace(daysLeft ?? 1, notReadyRemaining);

  const rows: AreaRow[] = AREAS.map((a) => {
    const s = prog.byArea[a.key];
    return {
      key: a.key,
      label: a.label,
      total: s?.total ?? 0,
      pct: s?.total ? Math.round((s.correct / s.total) * 100) : null,
    };
  });

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "32px 18px 64px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ fontSize: 26, margin: 0 }}>Your dashboard</h1>
        <Link href="/practice?mode=diagnostic" style={{ fontSize: 13, color: "#5A6478" }}>
          Practice history is saved automatically
        </Link>
      </div>

      {/* Readiness banner */}
      <section style={{ ...card, margin: "18px 0 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center", minWidth: 92 }}>
            <div style={{ fontSize: 46, fontWeight: 800, color: bandColor(readiness.band), letterSpacing: -1.5, lineHeight: 1 }}>
              {readiness.score}%
            </div>
            <div style={{ fontSize: 11, color: "#5A6478", textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>readiness</div>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 700, color: bandColor(readiness.band), marginBottom: 8, fontSize: 15.5 }}>{readiness.label}</div>
            <div style={{ fontSize: 12.5, color: "#5A6478", marginBottom: 5 }}>
              Confidence {Math.round(readiness.confidence * 100)}% · passing bar {PASS_BAR}%
            </div>
            <div style={{ height: 6, background: "#EAE4D7", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${Math.round(readiness.confidence * 100)}%`, height: "100%", background: "#15233B" }} />
            </div>
            {readiness.thinAreas.length > 0 && (
              <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#5A6478", lineHeight: 1.5 }}>
                Sharpen this estimate — practice more{" "}
                {readiness.thinAreas.map((a) => SHORT[a.key]).join(", ")}.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Exam countdown + pace */}
      <ExamDateCard
        examDate={examDate}
        daysLeft={daysLeft}
        dailyGoal={pace.dailyGoal}
        onTrack={pace.onTrack}
        todayISO={todayISO}
      />

      {/* Spaced review */}
      {dueCount > 0 ? (
        <Link
          href="/practice?srs=1&length=20"
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            textDecoration: "none", marginBottom: 12, padding: "16px 18px", borderRadius: 12,
            background: "#FBF7EE", border: "1.5px solid #A9781F",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: "#15233B", fontSize: 15 }}>
              🔁 {dueCount} question{dueCount === 1 ? "" : "s"} due for review
            </div>
            <div style={{ fontSize: 13, color: "#5A6478", marginTop: 2 }}>
              Spaced repetition — review them before they fade.
            </div>
          </div>
          <span style={{ color: "#A9781F", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>Start →</span>
        </Link>
      ) : prog.totalAnswered > 0 ? (
        <div style={{ marginBottom: 12, padding: "12px 18px", borderRadius: 12, background: "#EDE8DD", color: "#5A6478", fontSize: 13.5 }}>
          ✓ No reviews due right now — you&rsquo;re caught up.
        </div>
      ) : null}

      {/* Engagement */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, margin: "0 0 26px" }}>
        <Stat big={String(prog.totalAnswered)} label="questions answered" color="#15233B" />
        <Stat big={streak > 0 ? `${streak}🔥` : "0"} label="day streak" color="#15233B" />
        <Stat big={`${areasReady}/5`} label="areas at the bar" color={areasReady >= 5 ? "#2E7A57" : "#15233B"} />
      </div>

      {/* Focus / mix */}
      <section style={card}>
        <h2 style={h2}>Focus your practice</h2>
        <p style={{ margin: "0 0 16px", color: "#5A6478", fontSize: 14, lineHeight: 1.5 }}>
          Pick areas to drill, or let Smart mix target your weak spots.
        </p>
        <CategoryPicker areas={rows} />
      </section>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 16 }}>
        <ActionCard
          href="/practice?daily=1&length=10"
          title="Daily challenge"
          body="10 fresh questions today"
          accent="#A9781F"
        />
        <ActionCard
          href="/practice?review=1&length=20"
          title="Review missed"
          body={missed > 0 ? `${missed} question${missed === 1 ? "" : "s"} to re-drill` : "Nothing missed yet"}
          disabled={missed === 0}
          accent="#B2422A"
        />
        <ActionCard
          href="/practice?mode=exam&length=115&timed=1"
          title="Timed exam"
          body="115 questions · full simulation"
          accent="#15233B"
        />
      </div>

      {/* By type / difficulty — the scenario questions are where people fail */}
      {(typeCuts.length > 0 || diffCuts.length > 0) && (
        <section style={{ ...card, marginTop: 16 }}>
          <h2 style={h2}>How you do by question style</h2>
          <p style={{ margin: "0 0 16px", color: "#5A6478", fontSize: 14, lineHeight: 1.5 }}>
            Tap any bar to drill just those. Application scenarios are where most people lose points.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <CutGroup title="By type" cuts={typeCuts} param="type" />
            <CutGroup title="By difficulty" cuts={diffCuts} param="difficulty" />
          </div>
        </section>
      )}

      {/* Progress over time */}
      {series.length >= 2 && (
        <section style={{ ...card, marginTop: 16 }}>
          <h2 style={h2}>Your progress</h2>
          <p style={{ margin: "0 0 14px", color: "#5A6478", fontSize: 14 }}>Accuracy by day.</p>
          <ProgressChart series={series} />
          {timeStats && (
            <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#5A6478", textAlign: "center" }}>
              ~{timeStats.medianSec}s per question, typically <span style={{ color: "#98A0AE" }}>(approx, {timeStats.sampleSize} answers)</span>
            </p>
          )}
        </section>
      )}
    </main>
  );
}

function CutGroup({ title, cuts, param }: { title: string; cuts: { key: string; label: string; total: number; pct: number }[]; param: "type" | "difficulty" }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#98A0AE", marginBottom: 10 }}>{title}</div>
      {cuts.length === 0 ? (
        <p style={{ fontSize: 13, color: "#98A0AE" }}>No data yet.</p>
      ) : (
        cuts.map((c) => (
          <Link key={c.key} href={`/practice?${param}=${encodeURIComponent(c.key)}&length=15`} style={{ display: "block", textDecoration: "none", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 4 }}>
              <span style={{ color: "#15233B", fontWeight: 600 }}>{c.label}</span>
              <span style={{ color: "#5A6478" }}>{c.pct}% <span style={{ color: "#98A0AE" }}>· {c.total}</span></span>
            </div>
            <div style={{ height: 7, background: "#EAE4D7", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${c.pct}%`, height: "100%", background: c.pct >= PASS_BAR ? "#2E7A57" : c.pct >= 50 ? "#A9781F" : "#B2422A" }} />
            </div>
          </Link>
        ))
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff", border: "1px solid #E4DDCF", borderRadius: 14,
  padding: "22px 20px", boxShadow: "0 12px 30px -20px rgba(21,35,59,.3)",
};
const h2: React.CSSProperties = { fontSize: 18, margin: "0 0 4px" };

function Stat({ big, label, color }: { big: string; label: string; color: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E4DDCF", borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: -0.5 }}>{big}</div>
      <div style={{ fontSize: 11.5, color: "#5A6478", marginTop: 2, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function ActionCard({ href, title, body, accent, disabled }: { href: string; title: string; body: string; accent: string; disabled?: boolean }) {
  const inner = (
    <>
      <div style={{ fontSize: 15, fontWeight: 700, color: disabled ? "#98A0AE" : "#15233B" }}>{title}</div>
      <div style={{ fontSize: 13, color: "#5A6478", marginTop: 3 }}>{body}</div>
    </>
  );
  const style: React.CSSProperties = {
    display: "block", padding: "16px 16px", borderRadius: 12, textDecoration: "none",
    border: "1px solid #E4DDCF", borderLeft: `4px solid ${disabled ? "#D9D2C4" : accent}`,
    background: "#fff", opacity: disabled ? 0.6 : 1,
  };
  return disabled ? <div style={style}>{inner}</div> : <Link href={href} style={style}>{inner}</Link>;
}

function Gate({ title, body, cta, href }: { title: string; body?: string; cta: string; href: string }) {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "72px 20px", textAlign: "center" }}>
      <h1 style={{ fontSize: 26, marginBottom: 10 }}>{title}</h1>
      {body && <p style={{ color: "#3a4658", lineHeight: 1.5, marginBottom: 22 }}>{body}</p>}
      <Link href={href} style={{ background: "#A9781F", color: "#fff", padding: "13px 24px", borderRadius: 10, fontWeight: 600, textDecoration: "none" }}>
        {cta}
      </Link>
    </main>
  );
}
