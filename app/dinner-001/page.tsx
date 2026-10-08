import type { Metadata } from "next";
import { DynaPuff } from "next/font/google";
import { SHARE_IMAGE } from "@/lib/seo";
import DinnerInvitation from "./invitation";

const bubble = DynaPuff({ subsets: ["latin"], variable: "--font-bubble", display: "swap" });
export const metadata: Metadata = {
  title: "💌 You’re invited to Dinner 001 · Interaction Club",
  description: "Your personal invitation is inside. Enter your invited first name to open the letter.",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
  openGraph: { title: "💌 You’re invited to Dinner 001", description: "A little dinner. A new circle. Open your invitation.", images: [SHARE_IMAGE] },
  twitter: { card: "summary_large_image", title: "💌 You’re invited to Dinner 001", images: [SHARE_IMAGE.url] },
};

export default function DinnerOne() {
  return <div className={bubble.variable}><DinnerInvitation dinnerId="dinner-001"/></div>;
}
