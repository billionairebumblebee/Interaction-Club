import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CircleMark } from "../../club-brand";
import { publishedMemories } from "@/lib/memories";
import "./memories.css";

export const metadata: Metadata = { title: "Memories | Interaction Club", description: "A scrapbook of the dinners and little adventures we’ve actually shared." };
export default function Memories() {
  const memories = publishedMemories();
  return <div className="ic-memories"><header className="ic-info-heading"><p className="ic-eyebrow">THE CLUB SCRAPBOOK</p><h1>Remember<br/><em>when?</em></h1><p>Good company. Little moments. Stories worth keeping.</p></header>{memories.length ? <section className="ic-memory-grid" aria-label="Completed club events">{memories.map(memory => <article className="ic-memory-card" key={memory.id}>{memory.photos.map(photo => <Image key={photo.src} src={photo.src} alt={photo.alt} width={1000} height={750} sizes="(max-width: 700px) 90vw, 45vw"/>)}<time dateTime={memory.date}>{new Date(`${memory.date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time><h2>{memory.title}</h2><p>{memory.blurb}</p></article>)}</section> : <section className="ic-memory-empty"><div className="ic-memory-stamp"><CircleMark/></div><span className="ic-memory-tape" aria-hidden="true"/><h2>Our first page<br/>is still waiting.</h2><p>Our scrapbook starts after the first get-together. We’ll share real moments, with permission from everyone pictured.</p><Link className="ic-cta" href="/join">Be part of what’s next ↗</Link></section>}<p className="ic-memory-privacy">Your memories are yours, too. Want a photo removed? <a href="mailto:the@interaction.club">Email the@interaction.club</a>.</p></div>;
}
