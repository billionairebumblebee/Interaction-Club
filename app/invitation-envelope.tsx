"use client";

import Link from "next/link";
import { CSSProperties, FormEvent, useEffect, useId, useRef, useState } from "react";
import { CircleMark } from "./club-brand";
import { MAIN_MOTTO } from "../lib/brand";
import "./invitation-letter.css";
import { MOX_PILOT_BOUNDARY } from "../lib/communities";

type Props = {
  name: string;
  onName: (name: string) => void;
  onJoin: () => void;
  onEngage: () => void;
  reserveSpace?: boolean;
  inviter?: { slug: string; name: string };
  communityPreview?: boolean;
};

export default function InvitationEnvelope({ name, onName, onJoin, onEngage, reserveSpace = false, inviter, communityPreview = false }: Props) {
  const [stage, setStage] = useState<"address" | "seal" | "letter">("address");
  const heading = useRef<HTMLHeadingElement>(null);
  const seal = useRef<HTMLButtonElement>(null);
  const nameId = useId();
  const joinHref = inviter ? `/join?from=${encodeURIComponent(inviter.slug)}` : "/join";
  useEffect(() => {
    if (stage === "letter") heading.current?.focus({ preventScroll: true });
    if (stage === "seal") seal.current?.focus({ preventScroll: true });
  }, [stage]);

  function turnOver(event: FormEvent) {
    event.preventDefault();
    onName(name.trim().replace(/\s+/g, " ").slice(0, 80));
    onEngage();
    setStage("seal");
  }

  const letter = <div className={`ic-letter-slot ${stage !== "letter" ? "is-hidden" : ""}`} aria-hidden={stage !== "letter"} inert={stage !== "letter"}><div className="ic-open-letter" key={stage === "letter" ? "opened" : "reserved"}>
    {stage === "letter" && <div className="ic-confetti ic-big-confetti" aria-hidden="true">{Array.from({ length: 84 }, (_, i) => <i key={i} style={{ "--i": i, "--x": `${(i * 37) % 101}%`, "--drift": `${((i * 43) % 181) - 90}px`, "--delay": `${(i % 14) * .065}s`, "--duration": `${2.1 + (i % 5) * .16}s`, "--spin": `${i % 2 ? 610 : -530}deg` } as CSSProperties}/>)}</div>}
    <div className="ic-letter-top"><span>{communityPreview ? "INTERACTION CLUB × MOX" : "INTERACTION CLUB"}</span>{communityPreview ? <div className="ic-letter-cobrand" aria-label="Concept preview: Mox × Interaction Club"><img src="/mox-logo.svg" alt="Mox" width={100} height={40}/><span aria-hidden="true">×</span><CircleMark/></div> : <CircleMark/>}</div>
    {communityPreview && <p className="ic-letter-small ic-concept-label">Proposed pilot · concept preview</p>}
    <p className="ic-handwriting">Dear {name || "you"},</p>
    <p className="ic-letter-small">{communityPreview ? "Hello, Mox community! 💌 Vivian here 🐻" : "Oh good, you found your invitation."}</p>
    <h2 ref={heading} tabIndex={-1}>You’re<br/><em>invited.</em></h2>
    {communityPreview ? <><p>You’re invited to Interaction Club—a little more serendipity, a little less small talk.</p><p>Meet curious people over a small-group dinner. Share what you’re building or what you’re into, and hopefully find people you’d love to see again.</p><p>We’re exploring a possible Mox-only dinner; nothing is scheduled or confirmed yet. Tell us your interests, availability, and where you’d be happy to meet.</p><p>You can also opt into the wider club for future invitations, including dinners with Builders from SF and Berkeley when location and preferences line up.</p></> : <p>{inviter ? `${inviter.name} invited you to join Interaction Club. Tell us what works for you—we’ll look for your kind of company.` : "You’re invited to join Interaction Club. Tell us what works for you—we’ll look for your kind of company."}</p>}
    <dl className="ic-letter-details"><div><dt>Where</dt><dd>Shared in your dinner invitation</dd></div><div><dt>When</dt><dd>When you’re free</dd></div><div><dt>The plan</dt><dd>Dinner with a new circle</dd></div><div><dt>The cost</dt><dd>Free to join. Food within your budget.</dd></div></dl>
    <p className="ic-letter-small">{communityPreview ? "Your next invitation will include the date, time, venue, theme and expected cost before you decide. This is a proposed pilot, not a confirmed Mox partnership or event." : "Joining doesn’t guarantee a dinner. If we have a spot that fits, you’ll get the time, place, and cost before you accept."}</p>
    {communityPreview && <div className="ic-pilot-boundary"><p>Free to join as an individual. Organizational delivery is a separate paid service to be agreed with Mox. No Mox-specific dinner is scheduled or guaranteed.</p><p>{MOX_PILOT_BOUNDARY}</p></div>}
    <Link href={communityPreview ? `${joinHref}&path=quick` : joinHref} className="ic-cta" data-sound="happy" onClick={onJoin}>{communityPreview ? "join the interaction club!" : "Say hello"} <span>↗</span></Link>
    <p className="ic-letter-signoff">{MAIN_MOTTO} {communityPreview ? <span className="ic-letter-coordinators">— Vivian <span className="ic-signoff-brand" role="img" aria-label="Interaction Club"><CircleMark/></span></span> : <span>— {inviter?.name || "Interaction"}</span>}</p>
  </div></div>;

  const envelope = <div className={`ic-envelope-scene ${stage === "letter" ? "is-hidden" : ""}`} aria-hidden={stage === "letter"} inert={stage === "letter"}>
    <div className={`ic-envelope ${stage === "seal" ? "is-flipped" : ""}`}>
      <form className="ic-envelope-face ic-envelope-address" aria-label="Address your invitation" aria-hidden={stage !== "address"} inert={stage !== "address"} onSubmit={turnOver}>
        <span className="ic-postage" aria-hidden="true"><CircleMark/><span>HUMAN MAIL</span></span>
        {inviter && <span className="ic-envelope-sender">From {inviter.name}</span>}
        <div className="ic-addressee ic-name-on-envelope">
          <label htmlFor={nameId}>Your name here</label>
          <input id={nameId} autoComplete="name" enterKeyHint="go" maxLength={80} value={name} onChange={event => onName(event.target.value)} placeholder="Type your name" style={{ "--guest-size": name.length > 24 ? "6cqw" : name.length > 12 ? "8cqw" : "11cqw" } as CSSProperties}/>
        </div>
        <button type="submit" className="ic-envelope-instruction" data-sound="flip">Turn me over <span aria-hidden="true">↻</span></button>
        <span className="ic-airmail" aria-hidden="true"/>
      </form>
      <button ref={seal} type="button" className="ic-envelope-face ic-envelope-back" aria-hidden={stage !== "seal"} inert={stage !== "seal"} aria-label="Open the letter" data-sound="confetti" onClick={() => { onEngage(); setStage("letter"); }}>
        <span className="ic-flap"/><span className="ic-fold-left"/><span className="ic-fold-right"/><span className="ic-wax-seal"><CircleMark/></span><span className="ic-open-letter-label">Open the letter</span>
      </button>
    </div>
  </div>;
  return reserveSpace ? <div className="ic-envelope-reserved">{envelope}{letter}</div> : stage === "letter" ? letter : envelope;
}
