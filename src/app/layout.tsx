import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MLO Prep — Pass the SAFE MLO Exam",
  description:
    "Focused, mobile-first prep for the SAFE MLO National Test with Uniform State Content. Scenario questions, timed simulations, and a weak-area diagnostic.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
