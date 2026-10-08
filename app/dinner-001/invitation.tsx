"use client";

import { CSSProperties, ComponentProps, useEffect, useRef, useState } from "react";
import { CircleMark, ClubNavigation, ClubFooter } from "../club-brand";
import EventReminders from "../event-reminders";
import { useInteractionExperience } from "../interaction-experience";
import AttendancePanel from "../table/[token]/attendance-panel";
import "../invitation-home.css";
import "../party.css";
import "../foil-invitation.css";
import "../materials.css";
import "../club-pages.css";
import "../personal-invitation.css";
import "./invitation.css";

type Invitation = { guestName: string; table: ComponentProps<typeof AttendancePanel>["table"] & { venueName: string; hostName?: string; endsAt?: string; costDetails?: string; format?: string }; member: ComponentProps<typeof AttendancePanel>["initialMember"]; priority: ComponentProps<typeof AttendancePanel>["initialPriority"] };
export default function DinnerInvitation({ dinnerId = "dinner-001" }: { dinnerId?: string }) {
  const [stage, setStage] = useState<"front" | "seal" | "letter">("front");
  const [name, setName] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const { play } = useInteractionExperience();
  const endpoint = `/api/dinner/${dinnerId}/session`;
  const label = dinnerId.replace("dinner-", "Dinner ");
  async function openLetter() {
    setBusy(true); setError("");
    try {
      const login = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({name}), credentials: "same-origin" });
      const result = await login.json();
      if (!login.ok) throw new Error(result.error || "Please try again.");
      const response = await fetch(endpoint, { cache: "no-store", credentials: "same-origin" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please try again.");
      setInvitation(data); setStage("letter"); play("confetti");
    } catch (error) { setError(error instanceof Error ? error.message : "We couldn’t open your letter. Please try again."); }
    finally { setBusy(false); }
  }
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (stage === "letter") heading.current?.focus({ preventScroll: true }); }, [stage]);
  return <main className="ic-home dinner-one">
    <ClubNavigation/>
    <section className="dinner-one-stage" aria-label={`Your ${label} invitation`}>
      <p className="ic-eyebrow">A LITTLE HUMAN INTERACTION</p>
      <h1>We want you<br/>at our table.</h1>
      {stage !== "letter" ? <div className="ic-envelope-scene">
        <div className={`ic-envelope ${stage === "seal" ? "is-flipped" : ""}`}>
          <button type="button" className="ic-envelope-face ic-envelope-address dinner-one-front" aria-hidden={stage !== "front"} inert={stage !== "front"} onClick={() => setStage("seal")} data-sound="flip" aria-label="Turn over your invitation">
            <span className="ic-postage" aria-hidden="true"><CircleMark/><span>HUMAN MAIL</span></span>
            <span className="dinner-one-number">{label}</span>
            <span className="dinner-one-turn">Turn me over ↻</span>
            <span className="ic-airmail" aria-hidden="true"/>
          </button>
          <div className="ic-envelope-face ic-envelope-back dinner-name-back" aria-hidden={stage !== "seal"} inert={stage !== "seal"}>
            <span className="ic-flap"/><span className="ic-fold-left"/><span className="ic-fold-right"/><span className="ic-wax-seal"><CircleMark/></span>
            <form className="dinner-name-form" onSubmit={event => {event.preventDefault(); void openLetter();}}>
              <label htmlFor="dinner-name">Password (your name)</label>
              <input id="dinner-name" name="firstName" autoComplete="given-name" placeholder="Your first name" required maxLength={80} value={name} onChange={event => setName(event.target.value)} disabled={busy}/>
              <button type="submit" disabled={busy}>{busy ? "Opening…" : "Open the letter"}</button>
            </form>
          </div>
        </div>
        {error && <p className="dinner-name-error" role="alert">{error}</p>}
      </div> : invitation && <article className="ic-open-letter dinner-one-letter">
        <div className="ic-confetti ic-big-confetti" aria-hidden="true">{Array.from({length: 64}, (_, i) => <i key={i} style={{"--i": i, "--x": `${(i * 37) % 100}%`, "--drift": `${(i * 43) % 181 - 90}px`, "--delay": `${(i % 8) * .06}s`, "--duration": "2.4s", "--spin": `${i % 2 ? 610 : -530}deg`} as CSSProperties}/>)}</div>
        <div className="ic-letter-top"><span>{label.toUpperCase()}</span><CircleMark/></div>
        <p className="ic-handwriting dinner-one-greeting">Dear {invitation.guestName},</p>
        <h2 ref={heading} tabIndex={-1}>You’re<br/><em>invited.</em></h2>
        <p>Thank you for joining Interaction Club! 💌</p>
        <p>I’d love to have you there! A new circle, and an evening to get to know each other. 💝</p>
        <dl className="dinner-one-details">
          <div><dt>WHEN</dt><dd>{new Date(invitation.table.startsAt).toLocaleDateString("en-US", {weekday:"long",month:"long",day:"numeric",year:"numeric",timeZone:"America/Los_Angeles"})}<br/>{new Date(invitation.table.startsAt).toLocaleTimeString("en-US", {hour:"numeric",minute:"2-digit",timeZone:"America/Los_Angeles"})}{invitation.table.endsAt && `–${new Date(invitation.table.endsAt).toLocaleTimeString("en-US", {hour:"numeric",minute:"2-digit",timeZone:"America/Los_Angeles"})}`} · Pacific</dd></div>
          <div><dt>WHERE</dt><dd>{invitation.table.venueName}<br/>{invitation.table.venueAddress}</dd></div>
          <div><dt>YOUR FOOD</dt><dd>{dinnerId === "dinner-001" ? "Everyone orders and pays for their own meal. Budget-friendly options are available at this restaurant. Please check current menu prices before confirming your RSVP and again before ordering; tax and any tip are extra." : invitation.table.costDetails}</dd></div>
          <div><dt>YOUR HOST</dt><dd>{invitation.table.hostName || "Your host"} 💕</dd></div>
          <div><dt>THE TABLE</dt><dd>{invitation.table.format}{invitation.table.format === "Inclusive / everyone" && <><br/>All genders welcome. No fixed 50/50 split.</>}</dd></div>
        </dl>
        <EventReminders/>
        <AttendancePanel token="" endpoint={endpoint} table={invitation.table} initialMember={invitation.member} initialPriority={invitation.priority}/>
        <p className="ic-letter-small">Accept the agreements and RSVP here to confirm your seat. Opening the envelope alone doesn’t reserve your seat.</p>
        <a className="dinner-one-contact" href={`mailto:the@interaction.club?subject=${encodeURIComponent(label)}`} style={{overflowWrap:"anywhere"}}>Questions? Email us ↗ the@interaction.club</a>
        <p className="ic-letter-signoff">It’ll be better with you! 😊<span>— Vivian 💕</span></p>
      </article>}
    </section>
    <ClubFooter/>
  </main>;
}
