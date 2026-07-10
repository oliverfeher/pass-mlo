import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasEntitlement } from "@/lib/entitlements";

// Server component — renders on the server for SEO. This is the marketing
// surface that should rank organically and feed the free diagnostic funnel.
export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Paying users don't need the pitch — send them straight to their dashboard.
  if (user && (await hasEntitlement())) redirect("/dashboard");

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
