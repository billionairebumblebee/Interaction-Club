import type { Metadata } from "next";
import { DynaPuff } from "next/font/google";
import InvitationHome from "../invitation-home";
import "../personal-invitation.css";

const bubble = DynaPuff({ subsets: ["latin"], variable: "--font-bubble", display: "swap" });
export const metadata: Metadata = {
  title: "A little more serendipity — Mox concept invitation | Interaction Club",
  description: "A proposed small-group dinner for the Mox community. Nothing is scheduled or confirmed yet.",
  robots: { index: false, follow: false },
};
export default function Mox() {
  return <div className={bubble.variable}><InvitationHome inviter={{ slug: "mox", name: "Vivian" }} communityPreview/></div>;
}
