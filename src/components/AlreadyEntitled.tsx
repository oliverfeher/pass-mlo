"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Shown when an already-entitled user lands on /pricing: confirm access, then
// send them to their dashboard.
export default function AlreadyEntitled() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/dashboard"), 1400);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main style={{ maxWidth: 440, margin: "0 auto", padding: "96px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 44, marginBottom: 10 }}>✓</div>
      <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>You already have full access</h1>
      <p style={{ color: "#5A6478", lineHeight: 1.5, marginBottom: 20 }}>
        Your lifetime access is active — no need to buy again. Taking you to your dashboard…
      </p>
      <Link
        href="/dashboard"
        style={{ background: "#A9781F", color: "#fff", padding: "12px 24px", borderRadius: 10, fontWeight: 600, textDecoration: "none" }}
      >
        Go to dashboard
      </Link>
    </main>
  );
}
