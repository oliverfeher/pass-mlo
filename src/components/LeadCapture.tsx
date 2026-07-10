"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Captures an email lead (migration 0004). Storing only — actually emailing
// requires a mail provider wired to a server route (not included).
export default function LeadCapture({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return;
    setState("busy");
    const { error } = await createClient().from("leads").insert({ email, source });
    setState(error ? "error" : "done");
  }

  if (state === "done") {
    return (
      <p style={{ marginTop: 20, fontSize: 13.5, color: "#2E7A57", textAlign: "center" }}>
        ✓ Thanks — we&rsquo;ll send study tips your way.
      </p>
    );
  }

  return (
    <div style={{ marginTop: 20, textAlign: "center" }}>
      <p style={{ fontSize: 13.5, color: "#5A6478", margin: "0 0 8px" }}>Not ready to buy? Get free study tips by email.</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          style={{ padding: "10px 12px", borderRadius: 9, border: "1.5px solid #E4DDCF", fontSize: 14, minWidth: 200 }}
        />
        <button
          onClick={submit}
          disabled={state === "busy"}
          style={{ background: "#15233B", color: "#fff", border: "none", borderRadius: 9, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
        >
          {state === "busy" ? "…" : "Send tips"}
        </button>
      </div>
      {state === "error" && (
        <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#B2422A" }}>Couldn&rsquo;t save that — please try again.</p>
      )}
    </div>
  );
}
