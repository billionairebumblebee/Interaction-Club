import { DynaPuff } from "next/font/google";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata("/join", "Personality Quiz | Interaction Club", "Let us get to know you. Share your availability, budget, and interests to join the matching pool for small-group plans. Free to join, for adults 18+.");
import "../invitation-home.css";
import "../party.css";
import "../foil-invitation.css";
import "../materials.css";
import "../club-pages.css";
import "./survey-party.css";

const bubble = DynaPuff({ subsets: ["latin"], variable: "--font-bubble", display: "swap" });

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <div className={bubble.variable}>{children}</div>;
}
