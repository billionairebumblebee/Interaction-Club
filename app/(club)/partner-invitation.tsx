"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CircleMark } from "../club-brand";
import { useInteractionExperience } from "../interaction-experience";

export default function PartnerInvitation({ kind }: { kind: "sponsor" | "invest" }) {
  const [stage, setStage] = useState<"front" | "back" | "letter">("front");
  const [name, setName] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const { play } = useInteractionExperience();
  const sponsor = kind === "sponsor";
  const role = sponsor ? "Sponsor" : "Investor";
  const guest = name.trim();
  const contact = "mailto:vivian_yang@berkeley.edu?subject=" + encodeURIComponent(sponsor ? "Sponsoring an Interaction Club experience" : "Investing in Interaction Club");
  useEffect(() => { if (stage === "letter") heading.current?.focus({ preventScroll: true }); }, [stage]);
  const flip = () => { setStage("back"); play("flip"); };

  return <div className="ic-partner-envelope-wrap" data-stage={stage}>
    {stage === "front" && <form className="ic-partner-envelope ic-partner-envelope-front" onSubmit={event => { event.preventDefault(); flip(); }}>
      <span className="ic-postage" aria-hidden="true"><CircleMark/><span>HUMAN MAIL</span></span>
      <label className="ic-partner-addressee" htmlFor={kind + "-name"}>
        <span>{role}</span>
        <input id={kind + "-name"} name="name" autoComplete="name" maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Your name here" aria-describedby={kind + "-name-note"}/>
        <small id={kind + "-name-note"}>Optional. This invitation is yours either way.</small>
      </label>
      <button type="submit" className="ic-partner-envelope-hint" data-sound="none">Turn it over ↗</button>
    </form>}
    {stage === "back" && <div className="ic-partner-envelope ic-partner-envelope-back">
      <span className="ic-partner-flap" aria-hidden="true"/>
      <p className="ic-partner-back-line">You’re invited<br/>to {kind}.</p>
      <button type="button" className="ic-partner-open" data-sound="none" onClick={() => { setStage("letter"); play("confetti"); }}>
        <span className="ic-partner-envelope-seal"><CircleMark/></span>
        <span>Open the letter</span>
      </button>
      <button type="button" className="ic-partner-edit-name" onClick={() => setStage("front")}>Back to the front</button>
    </div>}
    {stage === "letter" && <div className="ic-partner-letter">
      <div className="ic-confetti" aria-hidden="true">{Array.from({ length: 45 }, (_, i) => <i key={i} style={{ "--i": i, "--x": `${i * 37 % 101}%`, "--drift": `${i * 43 % 181 - 90}px`, "--delay": `${i % 10 * .04}s`, "--duration": `${2 + i % 5 * .2}s`, "--spin": `${i % 2 ? 610 : -530}deg` } as CSSProperties}/>)}</div>
      <CircleMark/><p className="ic-partner-salutation">Dear {guest || (sponsor ? "future partner" : "future backer")},</p>
      <h2 ref={heading} tabIndex={-1}>You’re invited to {kind}.</h2>
      <p>{sponsor ? "Give your brand a social life. Help bring interested people together for a gathering they actually want to attend." : "Back a social product built around showing up—not scrolling. We turn interests and availability into personal invitations and real-world experiences."}</p>
      <p>{sponsor ? "We curate the group, shape the experience, host, and follow through. Let's choose an audience, a purpose, and a budget that work for your team." : "Free friend matching is the starting point. Optional paid adventures and recurring business-funded experiences are the planned revenue paths, delivered by a growing network of paid hosts."}</p>
      <p>Let’s make a plan,<br/><b>Vivian</b></p>
      <div className="ic-partner-actions"><a className="ic-cta" href={contact}>Email Vivian ↗</a><a className="ic-cta" href="https://calendly.com/vivian_yang-berkeley/30min" target="_blank" rel="noopener noreferrer">Book a call ↗</a></div>
      <button type="button" className="ic-partner-link" onClick={() => setStage("front")}>Fold it back up</button>
    </div>}
  </div>;
}
