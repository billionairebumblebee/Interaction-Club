import Link from "next/link";
import type { ReactNode } from "react";
import "./club-editorial.css";

export function ClubEssay({ children }: { children: ReactNode }) {
  return <article className="ic-editorial">{children}</article>;
}

export function ClubChapter({ title, number, children }: { title: string; number?: number; children: ReactNode }) {
  return <section className="ic-editorial-chapter">{number !== undefined && <span className="ic-editorial-step" aria-hidden="true">{number}</span>}<div><h2>{title}</h2>{children}</div></section>;
}

export function ClubEditorialInvitation({ children }: { children: ReactNode }) {
  return <aside className="ic-info-cta ic-editorial-cta"><p>{children}</p><Link className="ic-cta" href="/join">Join Interaction Club <span aria-hidden="true">↗</span></Link></aside>;
}
