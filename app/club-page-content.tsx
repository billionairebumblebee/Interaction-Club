import Link from "next/link";
import type { ReactNode } from "react";
import { CircleMark } from "./club-brand";

export function ClubPageHeading({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return <header className="ic-info-heading"><CircleMark/><p className="ic-eyebrow">{label}</p><h1>{title}</h1><p className="ic-info-lede">{children}</p></header>;
}

export function ClubCards({ items }: { items: { title: string; body: string }[] }) {
  return <div className="ic-info-grid">{items.map((item, index) => <section className="ic-info-card" key={item.title}><span className="ic-info-number">{String(index + 1).padStart(2, "0")} / INTERACTION</span><h2>{item.title}</h2><p>{item.body}</p></section>)}</div>;
}

export function ClubPageInvitation() {
  return <aside className="ic-info-cta"><p>Your invitation’s waiting.</p><Link className="ic-cta" href="/join">Join the club <span>↗</span></Link></aside>;
}
