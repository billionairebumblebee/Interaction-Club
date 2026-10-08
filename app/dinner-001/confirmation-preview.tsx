"use client";
import { useState } from "react";
import InvitationTermsChoice from "../invitation-terms-choice";
import PhotoPermissions from "../join/photo-permissions";
import type { PhotoAnswers } from "@/lib/photo-consent";
import "../table/[token]/attendance.css";

export default function ConfirmationPreview() {
  const [agreement, setAgreement] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<PhotoAnswers>({ capture: null, hackathon: null, publicPosting: null });
  return <section className="attendance-panel" aria-label="Dinner RSVP preview">
    <h2>Can you make it?</h2>
    <p>This is the public invitation preview. Use your personal invitation link to save an RSVP; ask Vivian for yours if you need it.</p>
    <div className="invitation-agreements"><InvitationTermsChoice value={agreement} onChange={setAgreement}/><PhotoPermissions value={photos} onChange={setPhotos}/></div>
    <div className="letter-actions"><button className="exp-button dark" disabled>Yes!</button><button className="exp-text-button" disabled>No :(</button></div>
    <p>Your personal link enables these RSVP buttons. No response or agreement is saved from this preview.</p>
  </section>;
}
