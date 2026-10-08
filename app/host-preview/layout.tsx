import type { Metadata } from "next";

export const metadata: Metadata = { title: "Host Preview | Interaction Club", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
