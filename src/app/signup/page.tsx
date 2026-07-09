"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setLoading(true);
    setError(null);
    setMsg(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // If email confirmation is on, there's no session yet.
    if (data.session) router.push("/practice");
    else setMsg("Check your email to confirm your account, then log in.");
  }

  return (
    <main style={{ maxWidth: 400, margin: "0 auto", padding: "64px 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Create your account</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input style={inputStyle} type="password" placeholder="Password (8+ chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p style={{ color: "#B2422A", fontSize: 14 }}>{error}</p>}
        {msg && <p style={{ color: "#2E7A57", fontSize: 14 }}>{msg}</p>}
        <button onClick={signUp} disabled={loading} style={btnStyle}>
          {loading ? "…" : "Sign up"}
        </button>
      </div>
      <p style={{ marginTop: 18, fontSize: 14, color: "#5A6478" }}>
        Already have an account? <Link href="/login" style={{ color: "#A9781F" }}>Log in</Link>
      </p>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "12px 14px", border: "1.5px solid #E4DDCF", borderRadius: 10, fontSize: 15,
};
const btnStyle: React.CSSProperties = {
  background: "#A9781F", color: "#fff", padding: "13px", border: "none",
  borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: "pointer",
};
