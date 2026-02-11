import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — COTERI",
  description: "Sign in with your email to access your membership.",
};

export default function SignInLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
