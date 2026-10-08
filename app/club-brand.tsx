"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ExperienceControls } from "./interaction-experience";
import { MAIN_MOTTO } from "../lib/brand";

export function CircleMark({ className = "" }: { className?: string }) {
  return <svg className={`ic-flower ${className}`} viewBox="0 0 120 120" fill="none" aria-hidden="true"><circle cx="60" cy="24" r="22" fill="var(--mark-a, #f23d91)"/><circle cx="91" cy="42" r="22" fill="var(--mark-b, #405bec)"/><circle cx="91" cy="78" r="22" fill="var(--mark-c, #c8d0e0)"/><circle cx="60" cy="96" r="22" fill="var(--mark-a, #f23d91)"/><circle cx="29" cy="78" r="22" fill="var(--mark-c, #c8d0e0)"/><circle cx="29" cy="42" r="22" fill="var(--mark-b, #405bec)"/></svg>;
}

export const clubLinks = [
  { href: "/about", label: "About" },
  { href: "/philosophy", label: "Philosophy" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/investors", label: "Investors" },
  { href: "/share", label: "Invite a friend" },
  { href: "/side-quests", label: "Side quests" },
  { href: "/memories", label: "Memories" },
];

const navigationLinks = clubLinks.filter(link => !["/philosophy", "/sponsors", "/investors", "/memories"].includes(link.href));

export function BalloonWordmark() {
  return <Link href="/#top" scroll className="ic-wordmark ic-balloon-wordmark" aria-label="Interaction home" onClick={() => { if (window.location.pathname === "/") window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }}><Image src="/balloon-wordmark-lowercase.png" width={2172} height={724} alt="interaction" sizes="(max-width: 700px) 150px, 220px" priority/><CircleMark/></Link>;
}

export function ClubNavigation({ controls, onJoin, joinHref = "/join" }: { controls?: ReactNode; onJoin?: () => void; joinHref?: string }) {
  return <nav className="ic-nav ic-expanded-nav" aria-label="Main navigation"><BalloonWordmark/><div className="ic-page-links">{navigationLinks.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</div><div className="ic-nav-actions"><ExperienceControls/>{controls}<Link href={joinHref} className="ic-nav-join" data-sound="happy" onClick={onJoin}>Join the club ↗</Link></div></nav>;
}

export function ClubFooter({ children, joinHref = "/join" }: { children?: ReactNode; joinHref?: string }) {
  return <footer className="ic-footer ic-expanded-footer"><div className="ic-footer-intro"><BalloonWordmark/><p>{MAIN_MOTTO}</p></div><nav aria-label="Explore Interaction"><p>THE CLUB</p>{clubLinks.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}<Link href={joinHref}>Your invitation ↗</Link></nav><nav aria-label="Legal"><p>THE DETAILS</p><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/data">Your data</Link><Link href="/safety">Safety</Link></nav><div className="ic-footer-bottom"><span>Interaction Club · 18+</span><Link href={joinHref}>Join us ↗</Link></div>{children}</footer>;
}
