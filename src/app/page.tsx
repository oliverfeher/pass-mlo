import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasEntitlement } from "@/lib/entitlements";

const LETTERS = ["A", "B", "C", "D"];

// Server component — renders on the server for SEO. This is the marketing
// surface that should rank organically and feed the free diagnostic funnel.
export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Paying users don't need the pitch — send them straight to their dashboard.
  if (user && (await hasEntitlement())) redirect("/dashboard");

  // A real free question to show off explanation quality (SEO content, too).
  const { data: sampleRows } = await supabase
    .from("questions")
    .select("stem,options,correct_index,explanation")
    .eq("is_free", true)
    .limit(1);
  const sample = sampleRows?.[0] as
    | { stem: string; options: string[]; correct_index: number; explanation: string }
    | undefined;

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px" }}>
      <p style={{ color: "#A9781F", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontSize: 12 }}>
        SAFE MLO · National Test with Uniform State Content
      </p>
      <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: "8px 0 12px", letterSpacing: -1 }}>
        Pass the MLO exam the first time.
      </h1>
      <p style={{ fontSize: 18, color: "#3a4658", lineHeight: 1.5, maxWidth: 560 }}>
        Only about half of first-time candidates pass. The difference isn&rsquo;t the material — it&rsquo;s
        the trap-worded questions. We train you on those, and show you exactly where you&rsquo;re still weak.
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
        <Link
          href="/practice?mode=diagnostic"
          style={{ background: "#A9781F", color: "#fff", padding: "14px 22px", borderRadius: 10, fontWeight: 600, textDecoration: "none" }}
        >
          Take the free diagnostic
        </Link>
        {user ? (
          <Link href="/practice" style={{ padding: "14px 22px", borderRadius: 10, fontWeight: 600, textDecoration: "none", border: "1.5px solid #E4DDCF", color: "#15233B" }}>
            Go to practice
          </Link>
        ) : (
          <Link href="/login" style={{ padding: "14px 22px", borderRadius: 10, fontWeight: 600, textDecoration: "none", border: "1.5px solid #E4DDCF", color: "#15233B" }}>
            Log in
          </Link>
        )}
      </div>

      {sample && (
        <div style={{ marginTop: 48, borderTop: "1px solid #E4DDCF", paddingTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>See how we explain</h2>
          <p style={{ color: "#5A6478", fontSize: 14, margin: "0 0 16px" }}>
            A real question from the free diagnostic — with the kind of explanation that teaches the trap.
          </p>
          <div style={{ background: "#fff", border: "1px solid #E4DDCF", borderRadius: 14, padding: "20px 20px" }}>
            <p style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.45, margin: "0 0 14px" }}>{sample.stem}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sample.options.map((opt, i) => {
                const correct = i === sample.correct_index;
                return (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 9, fontSize: 14.5, border: `1.5px solid ${correct ? "#2E7A57" : "#E4DDCF"}`, background: correct ? "#E7F1EB" : "#fff" }}>
                    <span style={{ fontWeight: 700, color: "#5A6478" }}>{LETTERS[i]}</span>
                    <span>{opt}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14, borderLeft: "3px solid #A9781F", background: "#FBF7EE", borderRadius: "0 10px 10px 0", padding: "12px 15px" }}>
              <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#A9781F", marginBottom: 5 }}>
                Why {LETTERS[sample.correct_index]} is right
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#33404F" }}>{sample.explanation}</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 48, borderTop: "1px solid #E4DDCF", paddingTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>Weighted like the real exam</h2>
        <ul style={{ color: "#3a4658", lineHeight: 1.9, fontSize: 15, listStyle: "none", padding: 0 }}>
          <li>Origination Activities — 27%</li>
          <li>Federal Laws — 24%</li>
          <li>General Mortgage Knowledge — 20%</li>
          <li>Ethics — 18%</li>
          <li>Uniform State Content — 11%</li>
        </ul>
      </div>
    </main>
  );
}
