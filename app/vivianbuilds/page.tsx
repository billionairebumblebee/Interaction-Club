import type { Metadata } from "next";
import PersonalInvitation from "./personal-invitation";
export const metadata: Metadata = { title: "Let’s keep talking 💌 — Vivian", robots: { index: false, follow: false } };
export default function Page() { return <PersonalInvitation/>; }
