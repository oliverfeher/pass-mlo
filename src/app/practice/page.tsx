import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasEntitlement } from "@/lib/entitlements";
import PracticeRunner, { type Question } from "@/components/PracticeRunner";

// Server component: decides what the user is allowed to see, then hands a
// question set to the client runner. RLS is the real gate; this mirrors it in UI.
export default async function PracticePage({
  searchParams,
}: {
  searchParams: { mode?: string; area?: string; length?: string };
}) {
  const mode = (searchParams.mode as "practice" | "exam" | "diagnostic") ?? "practice";
  const area = searchParams.area;
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
      .select("id,content_area,subtopic,stem,options,correct_index,explanation")
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

  let query = supabase
    .from("questions")
    .select("id,content_area,subtopic,stem,options,correct_index,explanation");
  if (area) query = query.eq("content_area", area);
  const { data } = await query.limit(length);

  return (
    <PracticeRunner
      mode={mode === "exam" ? "exam" : "practice"}
      initialQuestions={(data ?? []) as Question[]}
      persist
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
