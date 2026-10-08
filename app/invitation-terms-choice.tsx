"use client";
import Link from "next/link";
import { participationTermsSections } from "./terms/terms-content";
import { PARTICIPATION_TERMS_VERSION } from "@/lib/participation-terms";

export default function InvitationTermsChoice({ value, onChange, disabled = false }: { value: boolean | null; onChange: (value: boolean | null) => void; disabled?: boolean }) {
  return <div className="invitation-terms-choice">
    <h4>Your dinner agreement</h4>
    <ul className="invitation-terms-summary">
      <li>Show up—or cancel as early as you can. Repeated cancellations under 24 hours can lower future matching priority.</li>
      <li>Pay for your own order, tax and tip; arrange bill splitting with your table.</li>
      <li>Respect other guests. We don’t screen or guarantee anyone’s behavior.</li>
      <li>Tell the restaurant and your host/table about allergies before eating or sharing food. Safe accommodation isn’t guaranteed.</li>
    </ul>
    <details className="invitation-inline-terms"><summary>Read the full participation terms</summary><div className="invitation-terms-scroll" tabIndex={0} aria-label="Full participation terms"><p>Version {PARTICIPATION_TERMS_VERSION}. Interaction Club is operated by Vivian Yang. These terms apply to club participation; activity-specific conditions are shared before you accept a particular outing.</p>{participationTermsSections.map(section => <section key={section.title}><h4>{section.title}</h4>{section.body}</section>)}</div></details>
    <p>Accept the <Link href="/terms" target="_blank" rel="noreferrer">participation terms</Link> and show-up agreement to attend.</p>
    <div className="letter-actions" role="group" aria-label="Accept the dinner terms">
      <button type="button" className="invitation-choice-button" aria-pressed={value === true} disabled={disabled || value !== null} onClick={() => onChange(true)}>{value === true ? "Accepted ✓" : "Accept the terms"}</button>
      <button type="button" className="invitation-choice-button" aria-pressed={value === false} disabled={disabled || value !== null} onClick={() => onChange(false)}>{value === false ? "Not accepted ✓" : "No, I don’t accept"}</button>
    </div>
    {value === true && <p role="status">Terms selected ✓ Confirm your RSVP below to save your acceptance.</p>}
    {value === false && <p className="invitation-terms-notice" role="status">You must accept the terms for the dinner. “Yes!” is unavailable, but you can still decline the invitation.</p>}
    {value !== null && <button type="button" className="invitation-change-choice" disabled={disabled} onClick={() => onChange(null)}>Change my answer</button>}
  </div>;
}
