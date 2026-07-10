"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push("/dashboard");
  }

  return (
    <main style={{ maxWidth: 400, margin: "0 auto", padding: "64px 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>Log in</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p style={{ color: "#B2422A", fontSize: 14 }}>{error}</p>}
        <button onClick={signIn} disabled={loading} style={btnStyle}>
          {loading ? "…" : "Log in"}
        </button>
      </div>
      <p style={{ marginTop: 18, fontSize: 14, color: "#5A6478" }}>
        No account? <Link href="/signup" style={{ color: "#A9781F" }}>Sign up</Link>
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
