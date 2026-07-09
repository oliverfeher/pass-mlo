import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasEntitlement } from "@/lib/entitlements";
import { fetchProgress, missedIds, currentStreak } from "@/lib/progress";
import { AREAS } from "@/lib/areas";
import { PASS_BAR, READY_BAR } from "@/lib/scoring";
import CategoryPicker, { type AreaRow } from "@/components/CategoryPicker";

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
  const overall = prog.totalAnswered ? Math.round((prog.totalCorrect / prog.totalAnswered) * 100) : null;

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

      {/* Readiness + engagement */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, margin: "18px 0 26px" }}>
        <Stat
          big={overall === null ? "—" : `${overall}%`}
          label={overall === null ? "no answers yet" : overall >= READY_BAR ? "ready — above the bar" : overall >= PASS_BAR ? "at the bar" : `below ${PASS_BAR}% bar`}
          color={overall === null ? "#5A6478" : overall >= PASS_BAR ? "#2E7A57" : "#B2422A"}
        />
        <Stat big={String(prog.totalAnswered)} label="questions answered" color="#15233B" />
        <Stat big={streak > 0 ? `${streak}🔥` : "0"} label={streak === 1 ? "day streak" : "day streak"} color="#15233B" />
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
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

      <p style={{ marginTop: 28, fontSize: 12, color: "#98A0AE", textAlign: "center" }}>
        Study aid. Not affiliated with or endorsed by NMLS.
      </p>
    </main>
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
