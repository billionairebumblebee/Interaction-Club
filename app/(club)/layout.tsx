import type { ReactNode } from "react";
import { DynaPuff } from "next/font/google";
import { ClubNavigation, ClubFooter } from "../club-brand";
import "../invitation-home.css";
import "../party.css";
import "../foil-invitation.css";
import "../materials.css";
import "../club-pages.css";

const bubble = DynaPuff({ subsets: ["latin"], variable: "--font-bubble", display: "swap" });

export default function ClubLayout({ children }: { children: ReactNode }) {
  return <div className={`${bubble.variable} ic-home`}><a className="ic-skip" href="#club-content">Skip to content</a><ClubNavigation/><main id="club-content" className="ic-info-main">{children}</main><ClubFooter/></div>;
}
