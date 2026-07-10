"use client";
import { useState } from "react";

export default function PricingCard() {
  const [loading, setLoading] = useState(false);

  async function buy() {
    setLoading(true);
    const res = await fetch("/api/checkout", { method: "POST" });
    const { url, error } = await res.json();
    if (url) window.location.href = url;
    else {
      setLoading(false);
      alert(error ?? "Something went wrong. Please log in and try again.");
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "64px 20px", textAlign: "center" }}>
      <p style={{ color: "#A9781F", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontSize: 12 }}>
        Lifetime access
      </p>
      <h1 style={{ fontSize: 30, margin: "8px 0 6px" }}>Everything you need to pass</h1>
      <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1, margin: "10px 0" }}>$79</div>
      <p style={{ color: "#5A6478", fontSize: 14 }}>One time. No subscription.</p>

      <ul style={{ textAlign: "left", listStyle: "none", padding: 0, margin: "26px 0", lineHeight: 2, color: "#33404F" }}>
        <li>✓ Full original question bank</li>
        <li>✓ Timed, full-length simulated exams</li>
        <li>✓ Weak-area diagnostic &amp; readiness signal</li>
        <li>✓ Detailed explanations on every question</li>
        <li>✓ Progress synced across your devices</li>
      </ul>

      <button
        onClick={buy}
        disabled={loading}
        style={{ background: "#A9781F", color: "#fff", padding: "15px 28px", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 16, cursor: "pointer", width: "100%" }}
      >
        {loading ? "Redirecting…" : "Get lifetime access"}
      </button>
    </main>
  );
}
