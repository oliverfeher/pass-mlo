import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasEntitlement } from "@/lib/entitlements";
import { fetchProgress, missedIds } from "@/lib/progress";
import { dueQuestionIds } from "@/lib/srs";
import { AREA_KEYS } from "@/lib/areas";
import { TYPE_KEYS, DIFFICULTY_KEYS } from "@/lib/qmeta";
import { sample, buildSmartMix } from "@/lib/selection";
import PracticeRunner, { type Question } from "@/components/PracticeRunner";

const COLS = "id,content_area,subtopic,stem,options,correct_index,explanation,type,difficulty";

// Server component: decides what the user is allowed to see, then hands a
// question set to the client runner. RLS is the real gate; this mirrors it in UI.
export default async function PracticePage({
  searchParams,
}: {
  searchParams: { mode?: string; area?: string; areas?: string; length?: string; mix?: string; review?: string; srs?: string; timed?: string; type?: string; difficulty?: string };
}) {
  const mode = (searchParams.mode as "practice" | "exam" | "diagnostic") ?? "practice";
  const area = searchParams.area;
  // `areas` (comma-separated) is the multi-select form; `area` kept for back-compat.
  const areas = (searchParams.areas ?? area ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => AREA_KEYS.includes(s));
  const mix = searchParams.mix;       // "weak" = Smart mix
  const review = searchParams.review === "1";
  const srs = searchParams.srs === "1"; // spaced-repetition "due today"
  const timed = searchParams.timed === "1";
  const type = TYPE_KEYS.includes(searchParams.type ?? "") ? searchParams.type! : null;
  const difficulty = DIFFICULTY_KEYS.includes(searchParams.difficulty ?? "") ? searchParams.difficulty! : null;
  const defaultLen = mode === "diagnostic" ? 10 : mode === "exam" ? 115 : 15;
  const length = Math.min(Number(searchParams.length) || defaultLen, 120);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Diagnostic is public (free questions only, no account needed).
  if (mode === "diagnostic") {
    const { data } = await supabase
      .from("questions")
      .select(COLS)
      .eq("is_free", true)
      .limit(length);
    return <PracticeRunner mode="diagnostic" initialQuestions={(data ?? []) as Question[]} persist={false} />;
  }

  // Everything else requires an account.
  if (!user) {
    return (
      <Gate
        title="Log in to practice"
        body="Create a free account to save your progress across devices."
        cta="Log in"
        href="/login"
      />
    );
  }

  // And an entitlement (purchase) to reach the full bank.
  const entitled = await hasEntitlement();
  if (!entitled) {
    return (
      <Gate
        title="Unlock the full question bank"
        body="You have an account. Get lifetime access to the full bank, timed simulated exams, and your weak-area diagnostic."
        cta="Unlock access"
        href="/pricing"
      />
    );
  }

  const runnerMode = mode === "exam" ? "exam" : "practice";
  let selected: Question[] = [];

  if (srs) {
    // Spaced repetition: questions whose review interval has elapsed, most
    // overdue first (order preserved, not sampled).
    const prog = await fetchProgress(supabase, user.id);
    const ids = dueQuestionIds(prog.items, Date.now());
    if (ids.length) {
      const { data } = await supabase.from("questions").select(COLS).in("id", ids);
      const order = new Map(ids.map((id, i) => [id, i]));
      selected = ((data ?? []) as Question[])
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
        .slice(0, length);
    }
  } else if (review) {
    // Re-drill questions whose most recent attempt was wrong.
    const prog = await fetchProgress(supabase, user.id);
    const ids = missedIds(prog.items);
    if (ids.length) {
      const { data } = await supabase.from("questions").select(COLS).in("id", ids);
      selected = sample((data ?? []) as Question[], length);
    }
  } else if (mix === "weak") {
    // Smart mix: weight toward weak areas + exam weighting.
    const prog = await fetchProgress(supabase, user.id);
    const accuracy: Record<string, number | null> = {};
    for (const key of AREA_KEYS) {
      const s = prog.byArea[key];
      accuracy[key] = s?.total ? s.correct / s.total : null;
    }
    const { data } = await supabase.from("questions").select(COLS);
    selected = buildSmartMix((data ?? []) as Question[], accuracy, length);
  } else {
    // Area(s) / type / difficulty filters, or all. Sample so sessions vary.
    let query = supabase.from("questions").select(COLS);
    if (areas.length) query = query.in("content_area", areas);
    if (type) query = query.eq("type", type);
    if (difficulty) query = query.eq("difficulty", difficulty);
    const { data } = await query;
    selected = sample((data ?? []) as Question[], length);
  }

  const timedSeconds = timed && runnerMode === "exam" ? selected.length * 90 : undefined;

  return (
    <PracticeRunner
      mode={runnerMode}
      initialQuestions={selected}
      persist
      timedSeconds={timedSeconds}
    />
  );
}

function Gate({ title, body, cta, href }: { title: string; body: string; cta: string; href: string }) {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "72px 20px", textAlign: "center" }}>
      <h1 style={{ fontSize: 26, marginBottom: 10 }}>{title}</h1>
      <p style={{ color: "#3a4658", lineHeight: 1.5, marginBottom: 22 }}>{body}</p>
      <Link href={href} style={{ background: "#A9781F", color: "#fff", padding: "13px 24px", borderRadius: 10, fontWeight: 600, textDecoration: "none" }}>
        {cta}
      </Link>
    </main>
  );
}
