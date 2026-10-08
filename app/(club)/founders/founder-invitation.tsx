"use client";

import { useEffect, useRef, useState } from "react";
import { CircleMark } from "../../club-brand";
import { useInteractionExperience } from "../../interaction-experience";

export default function FounderInvitation() {
  const [stage, setStage] = useState<"front" | "back" | "letter">("front");
  const [name, setName] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const { play } = useInteractionExperience();
  useEffect(() => { if (stage === "letter") heading.current?.focus({ preventScroll: true }); }, [stage]);

  return <div className="ic-partner-envelope-wrap" data-stage={stage}>
    {stage === "front" && <form className="ic-partner-envelope ic-partner-envelope-front" onSubmit={event => { event.preventDefault(); setStage("back"); play("flip"); }}>
      <span className="ic-postage" aria-hidden="true"><CircleMark/><span>HUMAN MAIL</span></span>
      <label className="ic-partner-addressee" htmlFor="founder-invitation-name"><span>Founder</span><input id="founder-invitation-name" autoComplete="off" maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Your name here" aria-describedby="founder-name-note"/><small id="founder-name-note">Optional. Your name only personalizes this letter.</small></label>
      <button type="submit" className="ic-partner-envelope-hint" data-sound="none">Turn it over ↗</button>
    </form>}
    {stage === "back" && <div className="ic-partner-envelope ic-partner-envelope-back"><span className="ic-partner-flap" aria-hidden="true"/><p className="ic-partner-back-line">A seat for<br/>your next chapter.</p><button type="button" className="ic-partner-open" data-sound="none" onClick={() => { setStage("letter"); play("confetti"); }}><span className="ic-partner-envelope-seal"><CircleMark/></span><span>Open the letter</span></button><button type="button" className="ic-partner-edit-name" onClick={() => setStage("front")}>Back to the front</button></div>}
    {stage === "letter" && <div className="ic-partner-letter"><CircleMark/><p className="ic-partner-salutation">Dear {name.trim() || "founder"},</p><h2 ref={heading} tabIndex={-1}>We want to know what you’re building.</h2><p>I’m exploring a Founder Book: a short introduction to your company, reviewed by you before it reaches anyone else.</p><p>And because good introductions deserve more than an inbox, I’d love to bring interested founders together around a table with an experienced investor or operator.</p><p>This is the next chapter we’re exploring—not a booked dinner or a promise of funding. Want to help shape it?</p><p>Let’s make a plan,<br/><b>Vivian</b></p><div className="ic-partner-actions"><a className="ic-cta" href="mailto:vivian_yang@berkeley.edu?subject=Interaction%20Club%20Founder%20Book%20interest">Email Vivian ↗</a></div><button className="ic-partner-link" type="button" onClick={() => setStage("front")}>Fold it back up</button></div>}
  </div>;
}
