import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hasEntitlement } from "@/lib/entitlements";
import LogoutButton from "./LogoutButton";

// Server component: auth/entitlement-aware top bar. Rendered once in the root
// layout, so it appears on every page.
export default async function SiteNav() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const entitled = user ? await hasEntitlement() : false;

  return (
    <header
      style={{
        borderBottom: "1px solid #E4DDCF",
        background: "rgba(241,237,228,0.85)",
        backdropFilter: "saturate(140%) blur(6px)",
        position: "sticky", top: 0, zIndex: 20,
      }}
    >
      <nav
        style={{
          maxWidth: 960, margin: "0 auto", padding: "12px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}
      >
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#15233B", letterSpacing: -0.4 }}>MLO Prep</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#A9781F" }}>
            SAFE
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          {entitled ? (
            <>
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/practice">Practice</NavLink>
              <LogoutButton />
            </>
          ) : user ? (
            <>
              <NavLink href="/practice?mode=diagnostic">Diagnostic</NavLink>
              <NavLink href="/pricing">Pricing</NavLink>
              <LogoutButton />
            </>
          ) : (
            <>
              <NavLink href="/practice?mode=diagnostic">Diagnostic</NavLink>
              <NavLink href="/pricing">Pricing</NavLink>
              <Link
                href="/login"
                style={{
                  background: "#A9781F", color: "#fff", padding: "8px 16px",
                  borderRadius: 9, fontWeight: 600, fontSize: 14, textDecoration: "none",
                }}
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ color: "#5A6478", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
      {children}
    </Link>
  );
}
