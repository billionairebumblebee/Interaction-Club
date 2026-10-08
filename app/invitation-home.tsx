"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import "./invitation-home.css";
import "./party.css";
import "./foil-invitation.css";
import "./materials.css";
import "./club-pages.css";
import "./personal-invitation.css";
import { CircleMark as Flower, ClubNavigation, ClubFooter } from "./club-brand";
import Envelope from "./invitation-envelope";
import SideQuestArt from "./side-quest-art";
import { MAIN_MOTTO } from "../lib/brand";

const NAME_KEY = "interaction.invitation.name";
const ENGAGED_KEY = "interaction.invitation.engaged";
function remember(key: string, value: string) { try { sessionStorage.setItem(key, value); } catch { /* Storage is optional. */ } }

export default function InvitationHome({ inviter, communityPreview = false }: { inviter?: { slug: string; name: string }; communityPreview?: boolean }) {
  const [name, setName] = useState("");
  const [panel, setPanel] = useState(false);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const engaged = useRef(false);
  const prompted = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const joinHref = inviter ? `/join?from=${encodeURIComponent(inviter.slug)}` : "/join";

  useEffect(() => { if (inviter?.slug) remember("interaction.invitedBy", inviter.slug); }, [inviter?.slug]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        setName(sessionStorage.getItem(NAME_KEY) || "");
        engaged.current = sessionStorage.getItem(ENGAGED_KEY) === "1" || sessionStorage.getItem("interaction.joined") === "1";
      } catch { /* Browsing and signup remain available. */ }
      setReady(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    const element = dialog.current;
    if (!element || !panel) return;
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = previous; returnFocus.current?.focus({ preventScroll: true }); };
  }, [panel]);
  useEffect(() => {
    if (!ready || panel || !bottom.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && window.scrollY > 200 && !engaged.current && !prompted.current) {
        prompted.current = true;
        engaged.current = true;
        remember(ENGAGED_KEY, "1");
        setPanel(true);
      }
    }, { threshold: 0.5 });
    observer.observe(bottom.current);
    return () => observer.disconnect();
  }, [ready, panel]);
  function markEngaged() { engaged.current = true; remember(ENGAGED_KEY, "1"); }
  function openInvite() { markEngaged(); setPanel(true); }
  function updateName(value: string) { setName(value); remember(NAME_KEY, value); if (value.trim()) markEngaged(); }
  function startJoining() { markEngaged(); remember(NAME_KEY, name.trim().replace(/\s+/g, " ")); }

  return <main className={`ic-home ${inviter ? "ic-personal-invitation" : ""}`} data-theme="ink-silver" data-motion={paused ? "paused" : "playing"}>
    <a className="ic-skip" href="#your-invitation">Skip to your invitation</a>
    <ClubNavigation onJoin={startJoining} joinHref={joinHref} controls={<button className="ic-motion" onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? "Play motion" : "Pause motion"}</button>}/>
    <header className="ic-hero">
      <div className="ic-hero-copy">
        {communityPreview && <p className="ic-small-print">Concept preview • proposed Mox community pilot</p>}
        {inviter ? <><h1 className="ic-invited-balloon"><span>You’re</span><span>invited<span className="ic-invited-period">.</span></span></h1><p className="ic-personal-from">From {inviter.name}, with good company.</p></> : <><h1 className="ic-foil-heading"><span className="ic-visually-hidden">{MAIN_MOTTO}</span><Image src="/illustrated-balloon-headline.png" alt="" aria-hidden="true" width={1774} height={887} priority sizes="(max-width: 700px) 92vw, (max-width: 1600px) 48vw, 720px" /></h1><p className="ic-hero-description">Meet new people over dinner.</p></>}
        {!inviter && <><p className="ic-small-print">Good conversation. A few new faces. Just come as you are.</p><p className="ic-small-print">Free to join · Small groups · 18+</p><Link href="/side-quests" className="ic-text-link">Want a little adventure instead? Side quests ↗</Link></>}
      </div>
      <div className="ic-hero-object" id="your-invitation">
        <div className="ic-orbit" aria-hidden="true"/><Flower className="ic-floating-flower"/>
        <Envelope name={name} onName={updateName} onJoin={startJoining} onEngage={markEngaged} inviter={inviter} communityPreview={communityPreview} reserveSpace/>
      </div>
      {inviter && <p className="ic-personal-details">Small dinners. New people. Good company.<br/><span>Free to join · Your meal, your budget · 18+</span></p>}
    </header>
    <div className="ic-marquee" aria-label={`${MAIN_MOTTO} Human interaction, on purpose.`}><div aria-hidden="true">{[0,1,2,3].map(i=><span key={i}>{MAIN_MOTTO.toUpperCase()} <i><Flower/></i> HUMAN INTERACTION, ON PURPOSE. <i><Flower/></i> </span>)}</div></div>
    <section className="ic-dinner-scene" aria-labelledby="ic-scene-title"><div className="ic-scene-copy"><p className="ic-eyebrow">PULL UP IF I PULL UP.</p><h2 id="ic-scene-title">Good company.<br/><span>Room for you.</span></h2><p>A small group. A shared table.<br/>A reason to get together.</p><Link href={joinHref} className="ic-cta" onClick={startJoining}>Find my people <span>↗</span></Link></div><Image src="/interaction-table-six-chairs.png" alt="A circular cream dinner table with exactly six blue balloon chairs, six place settings, and pink-sealed invitations." width={1295} height={1215} sizes="(max-width: 700px) 95vw, 60vw"/></section>
    <section className="ic-how" id="how-it-works"><div className="ic-section-top"><h2>Here’s the deal<span>↴</span></h2></div><div className="ic-ticket-grid">
      <article className="ic-ticket"><span className="ic-ticket-number">1 / ABOUT YOU</span><div className="ic-ticket-drawing ic-drawing-you" aria-hidden="true"><span>YOU</span><Flower/></div><h3>About<br/>you.</h3><p>Your interests, availability, and budget.</p></article>
      <article className="ic-ticket"><span className="ic-ticket-number">2 / YOUR INVITATION</span><div className="ic-ticket-drawing ic-drawing-table" aria-hidden="true"><Flower/><span>hello!</span></div><h3>Your<br/>invitation.</h3><p>If a spot fits, we’ll send the time, place, and cost. You decide. Joining doesn’t guarantee a dinner.</p></article>
      <article className="ic-ticket"><span className="ic-ticket-number">3 / SHOW UP</span><div className="ic-ticket-drawing ic-drawing-chat" aria-hidden="true"><span>you too?!</span><span>wait, same.</span></div><h3>Pull up.<br/>Find out.</h3><p>Meet over dinner. See who you click with.</p></article>
    </div><Link href={joinHref} className="ic-cta ic-lime-cta" onClick={startJoining}>Okay, introduce me <span>↗</span></Link></section>
    <section className="ic-table-section"><div><p className="ic-eyebrow">STARTING WITH DINNER. OPEN TO MORE.</p><h2>There’s a<br/><em>place for you.</em></h2><p>Small groups. A reason to get together.</p><button className="ic-text-link" onClick={openInvite}>Open your invitation ↗</button></div><div className="ic-place-setting" aria-hidden="true"><Image className="ic-balloon-cutlery" src="/balloon-cutlery.png" alt="" width={1024} height={1024} sizes="(max-width: 700px) 90vw, 490px"/><div className="ic-plate"><div><span className="ic-handwriting">Good company for</span><strong>{name || "you"}</strong><Flower/></div></div><span className="ic-napkin">GOOD<br/>COMPANY<br/>ONLY.<Flower/></span></div></section>
    <section className="ic-how" aria-labelledby="ic-side-quests-title"><div className="ic-section-top"><h2 id="ic-side-quests-title">If you’re down,<br/>we’re down.</h2></div><p>Ever wanted a big friend group for a random adventure?</p><p>Amusement parks. Day trips. Bowling for no reason.<br/>Tell us what sounds fun and when you’re free. We’ll make plans from there.</p><SideQuestArt/><p className="ic-small-print">Ideas, not booked trips. Your actual invitation comes later.</p><Link href="/side-quests" className="ic-cta">Show me the side quests ↗</Link></section>
    <section className="ic-last ic-place-card-section" aria-labelledby="ic-place-card-heading"><h2 id="ic-place-card-heading">It’ll be better<br/><span>with you.</span></h2><div className="ic-guest-place-card"><div className="ic-place-card-front"><Flower/><p className={`ic-place-card-name ${name.trim().length > 20 ? "is-long" : ""}`}>{name.trim() || "You"}</p><span className="ic-place-card-signature">interaction club</span></div></div><Link href={joinHref} className="ic-cta" onClick={startJoining}>I’m in <span>↗</span></Link><p>Free to join. Your meal, your budget.</p></section>
    <ClubFooter joinHref={joinHref}><div ref={bottom} className="ic-bottom-sentinel"/></ClubFooter>
    <dialog ref={dialog} className="ic-dialog ic-invite-dialog" aria-labelledby="ic-invite-title" onCancel={e => { e.preventDefault(); setPanel(false); }} onClick={e => { if (e.target === e.currentTarget) setPanel(false); }}>
      {panel && <div className="ic-dialog-inner"><button className="ic-close" onClick={() => setPanel(false)} aria-label="Close invitation">×</button><p id="ic-invite-title" className="ic-invite-title ic-visually-hidden">{name ? `${name}, you’re invited.` : "You’re invited."}</p><Envelope name={name} onName={updateName} onJoin={startJoining} onEngage={markEngaged} inviter={inviter} communityPreview={communityPreview}/></div>}
    </dialog>
  </main>;
}
