import InvitationHome from "./invitation-home";
import { DynaPuff } from "next/font/google";
import { pageMetadata, SITE_DESCRIPTION } from "../lib/seo";

export const metadata = pageMetadata("/", "Interaction Club — Meet new people over dinner", SITE_DESCRIPTION);

const bubble = DynaPuff({ subsets: ["latin"], variable: "--font-bubble", display: "swap" });

export default function Home() {
  return <div className={bubble.variable}><InvitationHome /></div>;
}
