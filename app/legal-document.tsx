import type { ReactNode } from "react";
import Link from "next/link";
import { DynaPuff } from "next/font/google";
import { CircleMark, ClubFooter, ClubNavigation } from "./club-brand";
import "./invitation-home.css";
import "./party.css";
import "./materials.css";
import "./club-pages.css";
import "./legal-document.css";

const bubble = DynaPuff({ subsets: ["latin"], variable: "--font-bubble", display: "swap" });
type Section = { title: string; body: ReactNode };

export default function LegalDocument({ title, label, date, intro, sections, current }: {
  title: string; label: string; date: string; intro?: string; sections: Section[]; current: string;
}) {
  return <div className={`${bubble.variable} ic-home ic-details-site`}>
    <a className="ic-skip" href="#details-content">Skip to content</a>
    <ClubNavigation />
    <main id="details-content" className="ic-details-main">
      <header className="ic-details-hero">
        <p className="ic-details-label">{label} <span>Updated {date}</span></p>
        <h1>{title}</h1>
        {intro && <p className="ic-details-intro">{intro}</p>}
        <div className="ic-details-stamp" aria-hidden="true"><CircleMark /><span>THE<br />DETAILS</span></div>
      </header>
      <div className="ic-details-layout">
        <aside className="ic-details-index">
          <p>A little guide</p>
          <nav aria-label="On this page">{sections.map((section, i) => <a key={section.title} href={`#detail-${i + 1}`}>{section.title}<span aria-hidden="true">↘</span></a>)}</nav>
          <nav className="ic-details-pages" aria-label="More details">{[{ href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy" }, { href: "/data", label: "Your data" }, { href: "/safety", label: "Safety" }].map(link => <Link key={link.href} href={link.href} aria-current={current === link.href ? "page" : undefined}>{link.label}</Link>)}</nav>
        </aside>
        <div className="ic-details-sections">{sections.map((section, i) => <section className="ic-details-card" id={`detail-${i + 1}`} key={section.title}>
          <span className="ic-details-number" aria-hidden="true">{i + 1}</span>
          <h2>{section.title}</h2><div className="ic-details-copy">{section.body}</div>
        </section>)}</div>
      </div>
      <Link className="ic-details-back" href="/">← Back to the good company</Link>
    </main>
    <ClubFooter />
  </div>;
}
