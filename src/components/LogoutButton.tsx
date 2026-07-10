"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await createClient().auth.signOut();
    router.push("/");
    router.refresh(); // re-render server components (nav) with the cleared session
  }

  return (
    <button
      onClick={logout}
      disabled={busy}
      style={{
        background: "none", border: "none", padding: 0, cursor: busy ? "wait" : "pointer",
        color: "#5A6478", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
      }}
    >
      {busy ? "…" : "Log out"}
    </button>
  );
}
