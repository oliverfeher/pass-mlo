import Link from "next/link";

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ borderTop: "1px solid #E4DDCF", marginTop: 40, background: "#EDE8DD" }}>
      <div
        style={{
          maxWidth: 960, margin: "0 auto", padding: "28px 18px 34px",
          display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 20,
        }}
      >
        <div style={{ maxWidth: 340 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#15233B" }}>MLO Prep</div>
          <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55, color: "#5A6478" }}>
            Focused prep for the SAFE MLO National Test with Uniform State Content.
          </p>
        </div>

        <nav style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
          <FooterCol title="Product">
            <FooterLink href="/practice?mode=diagnostic">Free diagnostic</FooterLink>
            <FooterLink href="/pricing">Pricing</FooterLink>
            <FooterLink href="/dashboard">Dashboard</FooterLink>
          </FooterCol>
          <FooterCol title="Account">
            <FooterLink href="/login">Log in</FooterLink>
            <FooterLink href="/signup">Sign up</FooterLink>
          </FooterCol>
        </nav>
      </div>

      <div style={{ borderTop: "1px solid #E4DDCF" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "14px 18px", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#98A0AE" }}>© {year} MLO Prep</span>
          <span style={{ fontSize: 12, color: "#98A0AE", maxWidth: 520 }}>
            Study aid. Not affiliated with or endorsed by NMLS. Not legal advice.
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#98A0AE" }}>{title}</div>
      {children}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ fontSize: 13.5, color: "#5A6478", textDecoration: "none" }}>
      {children}
    </Link>
  );
}
