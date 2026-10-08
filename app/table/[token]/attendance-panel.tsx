"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DynaPuff } from "next/font/google";
import { ATTENDANCE_POLICY, attendanceAction, attendancePriority, cancellationPolicy, canCheckIn, declineReasons, eventEnd, isLateCancellation } from "@/lib/attendance";
import type { TableRecord } from "@/lib/concierge";
import type { MemberState } from "@/lib/concierge";
import "./attendance.css";
import CalendarLinks from "./calendar-links";
import InvitationTermsChoice from "../../invitation-terms-choice";
import { useInteractionExperience } from "../../interaction-experience";
import PhotoPermissions from "../../join/photo-permissions";
import { PHOTO_CONSENT_VERSION, photoAnswersComplete, type PhotoAnswers } from "@/lib/photo-consent";
import { PARTICIPATION_TERMS_VERSION } from "@/lib/participation-terms";
import { acceptInvitationAgreement, invitationAgreementComplete } from "@/lib/invitation-agreement";
const bubble = DynaPuff({ subsets: ["latin"], variable: "--attendance-bubble", weight: ["500", "600"] });

export type GuestAttendance = Pick<MemberState, "rsvp" | "attendance" | "checkedInAt" | "cancellation" | "termsAcceptance" | "photoConsent" | "decline">;
type Plan = { status: string; startsAt: string; endsAt?: string; responseDeadline?: string; cost?: number; costDetails?: string; venueAddress?: string; venueName?: string; venueArea?: string; activity?: string; sponsorDisclosure?: string };
function subscribeDemo(callback: () => void) { window.addEventListener("storage", callback); return () => window.removeEventListener("storage", callback); }
function readDemo() { try { return localStorage.getItem("interaction.synthetic-dinner-rsvp"); } catch { return null; } }
function demoMember(value: string | null, fallback: GuestAttendance): GuestAttendance { try { const saved = value ? JSON.parse(value) : null; return saved && ["pending", "yes", "no"].includes(saved.rsvp) ? saved : fallback; } catch { return fallback; } }
export default function AttendancePanel({ token, endpoint = `/api/table/${token}`, table, initialMember, initialPriority, demo = false }: { token: string; endpoint?: string; table: Plan; initialMember: GuestAttendance; initialPriority?: ReturnType<typeof attendancePriority>; demo?: boolean }) {
  const [currentMember, setMember] = useState(initialMember), [priority, setPriority] = useState(initialPriority);
  const savedDemo = useSyncExternalStore(subscribeDemo, readDemo, () => null);
  const member = demo ? demoMember(savedDemo, currentMember) : currentMember;
  const [agreement, setAgreement] = useState<boolean | null>(null);
  const [photoAnswers, setPhotoAnswers] = useState<PhotoAnswers>({ capture: null, hackathon: null, publicPosting: null });
  const accepted = invitationAgreementComplete(member);
  const ready = agreement !== false && (accepted || (agreement === true && photoAnswersComplete(photoAnswers)));
  const agreementPayload = { agreement: agreement ?? accepted, termsVersion: PARTICIPATION_TERMS_VERSION, photoConsent: { ...photoAnswers, version: PHOTO_CONSENT_VERSION } };
  const [now, setNow] = useState(() => Date.now()), [busy, setBusy] = useState(false), [error, setError] = useState(""), [confirm, setConfirm] = useState(false), [note, setNote] = useState("");
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(timer); }, []);
  const { play } = useInteractionExperience();
  const requestInFlight = useRef(false);
  const [rsvpChoice, setRsvpChoice] = useState<"yes" | "no" | null>(null);
  const [declining, setDeclining] = useState(false), [declineReason, setDeclineReason] = useState(""), [declineNote, setDeclineNote] = useState("");
  const declineReady = !!declineReason && (declineReason !== "Other" || !!declineNote.trim());
  const declineFields = <fieldset className="decline-reasons" disabled={busy}><legend>What didn’t work for you?</legend><p>This helps us plan better invitations. No private details needed.</p>{declineReasons.map(reason => <label key={reason}><input type="radio" name={`decline-reason-${token || endpoint}`} value={reason} checked={declineReason === reason} onChange={() => setDeclineReason(reason)}/><span>{reason}</span></label>)}{declineReason === "Other" && <label className="decline-note">Tell us a little more<textarea required maxLength={500} rows={3} value={declineNote} onChange={event => setDeclineNote(event.target.value)} placeholder="Restaurant, budget, or anything else…"/></label>}</fieldset>;
  async function update(body: Record<string, unknown>) {
    if (requestInFlight.current) return;
    if (body.action === "rsvp" && body.value === "yes") {
      if (!ready) { setError("Accept the participation terms and choose Yes or No for the photo release first."); return; }
      body = { ...body, ...agreementPayload };
      if (!accepted) acceptInvitationAgreement(body, new Date().toISOString());
    }
    requestInFlight.current = true;
    if (body.action === "rsvp" && (body.value === "yes" || body.value === "no")) setRsvpChoice(body.value);
    setBusy(true); setError("");
    try {
      if (demo) {
        const next = attendanceAction(table as TableRecord, { applicationId: "synthetic-demo", token: "synthetic-demo", ...member, ...(!accepted && body.action === "rsvp" && body.value === "yes" ? acceptInvitationAgreement(body, new Date().toISOString()) : {}) }, body);
        localStorage.setItem("interaction.synthetic-dinner-rsvp", JSON.stringify(next)); setMember(next); setConfirm(false); setDeclining(false); return;
      }
      const response = await fetch(endpoint, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Please try again.");
      setMember(result.member); setPriority(result.priority); setConfirm(false); setDeclining(false);
      if (body.action === "rsvp") play(result.member.rsvp === "yes" ? "celebrate" : "aw");
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); }
    finally { requestInFlight.current = false; setRsvpChoice(null); setBusy(false); }
  }
  const actionable = table.status === "invited" && Date.parse(table.startsAt) > now && (!table.responseDeadline || Date.parse(table.responseDeadline) > now) && (table.cost !== undefined || !!table.costDetails?.trim()) && !!table.venueAddress && !!table.sponsorDisclosure;
  const late = table.status !== "cancelled" && isLateCancellation(table.startsAt, now);
  return <section className={`attendance-panel ${bubble.variable}`} aria-label="Your RSVP and attendance">
    <h2>{member.attendance === "attended" ? "You’re checked in." : member.rsvp === "yes" && !accepted ? "Finish confirming your place." : member.rsvp === "yes" ? "Yay! We’ll see you at our table! 💝" : member.rsvp === "no" ? member.cancellation ? "Your RSVP is cancelled." : "Aw, we’ll miss you! 💌" : "Can you make it?"}</h2>
    {member.rsvp === "no" && <p role="status">Join us for dinner next time. There’ll be more invitations! 💕</p>}
    {demo && <p><b>Synthetic demo:</b> responses stay in this browser. No real guest, booking or message. <button className="exp-text-button" onClick={() => { localStorage.removeItem("interaction.synthetic-dinner-rsvp"); setMember(initialMember); }}>Reset demo</button></p>}
    {member.rsvp === "yes" && table.status !== "cancelled" && <CalendarLinks token={token} table={table} demo={demo}/>}
    <p>{cancellationPolicy}</p>
    {(member.rsvp === "pending" && actionable || member.rsvp === "yes" && !accepted) && !declining && <div className="invitation-agreements">
      <h3>One quick thing before you confirm 💌</h3>
      <p>Please accept the participation terms and show-up agreement, and choose Yes or No for the photo release. No photos is completely okay. Without the agreements, we can’t confirm your place.</p>
      {!accepted && <><InvitationTermsChoice value={agreement} onChange={setAgreement} disabled={busy}/><PhotoPermissions value={photoAnswers} onChange={setPhotoAnswers} disabled={busy}/></>}
      {member.rsvp === "yes" && !accepted && <button className="exp-button dark" disabled={busy || !ready} onClick={() => update({ action: "rsvp", value: "yes", policyVersion: ATTENDANCE_POLICY })}>Accept and confirm my place ↗</button>}
    </div>}
    {member.rsvp === "pending" && actionable && !declining && <><p>Confirm your seat below.</p><div className="letter-actions"><button type="button" className="invitation-choice-button" aria-pressed={rsvpChoice === "yes"} disabled={busy || !ready} onClick={() => update({ action: "rsvp", value: "yes", policyVersion: ATTENDANCE_POLICY })}>{rsvpChoice === "yes" ? "Saving Yes…" : "Yes!"}</button><button type="button" className="invitation-choice-button" disabled={busy} onClick={() => { setDeclining(true); setError(""); }}>No :(</button></div></>}
    {declining && member.rsvp === "pending" && <div className="attendance-warning"><h3>Not this time? 💌</h3>{declineFields}<div className="letter-actions"><button type="button" className="invitation-choice-button" disabled={busy || !declineReady} onClick={() => update({action:"rsvp",value:"no",declineReason,declineNote})}>{busy ? "Saving…" : "Decline invitation"}</button><button type="button" className="exp-text-button" disabled={busy} onClick={() => setDeclining(false)}>Go back</button></div></div>}
    {member.rsvp === "pending" && !actionable && <p>This invitation isn’t accepting RSVPs right now.</p>}
    {member.rsvp === "yes" && member.attendance !== "attended" && <>
      <p>Please check in here when you arrive. No location tracking.</p>
      {canCheckIn(table, now) ? <button className="exp-button dark" disabled={busy || !accepted} onClick={() => update({ action: "check-in" })}>I’m here — check me in</button> : <p>{now > eventEnd(table) ? "Missed check-in? Ask the organizer to confirm you attended. Missing a tap is not an automatic no-show." : "Check-in opens 30 minutes before the start and stays open until the event ends."}</p>}
      {now < eventEnd(table) && <p><button className="exp-text-button" disabled={busy} onClick={() => setConfirm(true)}>Plans changed? Cancel my RSVP</button></p>}
    </>}
    {member.attendance === "attended" && <p role="status">{member.checkedInAt ? "Your arrival is recorded. Enjoy your time together." : "Your organizer recorded your attendance."}</p>}
    {confirm && <div className="attendance-warning"><h3>Cancel this RSVP?</h3><p>{late ? "This is less than 24 hours before the start, or the event has already started. This will count as a late cancellation unless the organizer excuses it. Two within 90 days lower your future matching priority." : "This won’t count as a late cancellation."}</p><p>Need to leave a plan for safety or an emergency? Cancel now; you can ask for a review afterward.</p>{declineFields}<div className="letter-actions"><button className="exp-button dark" disabled={busy || !declineReady} onClick={() => update({ action: "rsvp", value: "no", confirmLateCancellation: late, declineReason, declineNote })}>Confirm cancellation</button><button className="exp-text-button" disabled={busy} onClick={() => setConfirm(false)}>Keep my RSVP</button></div></div>}
    {priority && <p>Your unexcused late cancellations in the last 90 days: <b>{priority.lateCancellations}</b>. {priority.deprioritized ? `Your matching priority is currently lower. With no further late cancellations, it returns to normal on ${new Date(priority.priorityRestoresAt!).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" })}.` : "Your matching priority is normal."}</p>}
    {member.cancellation && <>
      <p>{member.cancellation.excusedAt ? "Your cancellation has been excused and does not lower your priority." : member.cancellation.late ? "This cancellation was recorded as late." : "You cancelled with at least 24 hours’ notice, or the event was cancelled."}</p>
      {!member.cancellation.excusedAt && <details><summary>Emergency or mistake? Ask for a review.</summary><form className="exp-form" onSubmit={event => { event.preventDefault(); void update({ action: "review-cancellation", note }); }}><label>What should the organizer review? No sensitive details needed.<textarea maxLength={500} required value={note} onChange={event => setNote(event.target.value)}/></label><button className="exp-button dark" disabled={busy}>Request review</button></form>{member.cancellation.review && <p role="status">Your review request is saved for the organizer. It hasn’t been excused yet.</p>}</details>}
    </>}
    {error && <p className="exp-error" role="alert">{error}</p>}
  </section>;
}
