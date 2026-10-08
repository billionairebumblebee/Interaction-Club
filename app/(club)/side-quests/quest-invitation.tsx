"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CircleMark } from "../../club-brand";

const ideas = [
  { title: "The cheap little side quest.", price: "Public transit + good company", detail: "A local adventure or a theme-park group deal. Theme-park example: roughly $35–55 for admission + travel; active BayPass holders may pay no extra transit fare." },
  { title: "The big bus adventure.", price: "Roughly $90–110 · theme-park example", detail: "A charter bus, a park day, and a whole group leaving together. Admission + return transport, if enough people are down." },
];

export default function QuestInvitation() {
  const [opened, setOpened] = useState(false);
  const [name, setName] = useState("");
  const letter = useRef<HTMLHeadingElement>(null);
  return <section className="ic-quest-drop" id="next-quest" aria-labelledby="quest-title">
    <div className="ic-quest-drop-intro"><p className="ic-eyebrow">PICK YOUR KIND OF ADVENTURE.</p><h2 id="quest-title">Little quest.<br/><em>Big day out.</em></h2><p>A cheap adventure on public transit? A theme-park day with a whole bus of new friends? Tell us which one you’d join.</p><Link className="ic-cta" href="/join?side-quests=1">Tell us you’re interested ↗</Link><p className="ic-quest-small">Your interests, availability, and budget shape the next drop.</p></div>
    <div className="ic-quest-envelope">
      {!opened ? <form onSubmit={event => { event.preventDefault(); setOpened(true); requestAnimationFrame(() => letter.current?.focus({ preventScroll: true })); }}>
        <span className="ic-quest-postage"><CircleMark/>HUMAN MAIL</span>
        <label htmlFor="quest-name">Your name on the invitation</label><input id="quest-name" autoComplete="given-name" placeholder="Your name (optional)" maxLength={80} value={name} onChange={event => setName(event.target.value)}/>
        <h3>We want you<br/>along for the ride.</h3>
        <button className="ic-quest-open" type="submit"><span className="ic-quest-seal"><CircleMark/></span><span>Open your invitation ↗</span></button>
      </form> : <article className="ic-quest-letter">
        <p className="ic-quest-salutation">Dear {name.trim() || "you"},</p><h3 ref={letter} tabIndex={-1}>We want you<br/>along for the ride.</h3><p>Two ways to get out and meet your next good company.</p>
        <div className="ic-quest-missions">{ideas.map(idea => <article key={idea.title}><h4>{idea.title}</h4><span>{idea.price}</span><p>{idea.detail}</p></article>)}</div>
        <Link className="ic-cta" href="/join?side-quests=1">Tell us you’re interested ↗</Link>
        <p className="ic-quest-small">Tell us what you like, when you’re free, and your budget. Prices are estimates; food extra. The actual plan comes in a separate invitation before you commit.</p>
        <button className="ic-quest-text-action" type="button" onClick={() => setOpened(false)}>Fold it back up</button>
      </article>}
    </div>
  </section>;
}
