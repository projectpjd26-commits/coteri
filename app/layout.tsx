import type { Metadata } from "next";
import { DemoModeWrapper } from "@/components/demo/DemoModeWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "COTERI — Membership that drives repeat traffic",
  description: "COTERI helps venues turn one-time visitors into regulars. One pass, one place to verify.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <DemoModeWrapper>{children}</DemoModeWrapper>
      </body>
    </html>
  );
}
