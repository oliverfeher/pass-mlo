import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "MLO Prep — Pass the SAFE MLO Exam",
  description:
    "Focused, mobile-first prep for the SAFE MLO National Test with Uniform State Content. Scenario questions, timed simulations, and a weak-area diagnostic.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <SiteNav />
          <div style={{ flex: 1 }}>{children}</div>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
