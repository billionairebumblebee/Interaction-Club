"use client";

import type { PhotoAnswers } from "@/lib/photo-consent";
import "./photo-permissions.css";

export default function PhotoPermissions({ value, onChange, disabled = false }: { value: PhotoAnswers; onChange: (value: PhotoAnswers) => void; disabled?: boolean }) {
  const choice = typeof value.capture === "boolean" && value.capture === value.hackathon && value.capture === value.publicPosting ? value.capture : null;
  const select = (answer: boolean | null) => onChange({capture:answer,hackathon:answer,publicPosting:answer});
  return <fieldset className="agreement photo-permissions">
    <legend>Photos & videos 📸</legend>
    <p>Most dinners will include photography for Interaction Club’s social media and marketing. Prefer no photos? We’ll match you into a photo-free dinner, but availability is limited, so your invitation may take longer.</p>
    <p>May we take photos/videos of you at dinners and side quests, and use them in presentations, Interaction Club’s website, and Vivian’s or the club’s social posts?</p>
    <div className="photo-answer-options" role="group" aria-label="Photo and video release">
      <button type="button" className="photo-release-button" aria-pressed={choice === true} disabled={disabled || choice !== null} onClick={() => select(true)}>{choice === true ? "Yes, photos are okay ✓" : "Yes, photos are okay!"}</button>
      <button type="button" className="photo-release-button" aria-pressed={choice === false} disabled={disabled || choice !== null} onClick={() => select(false)}>{choice === false ? "No photos ✓" : "No photos, please"}</button>
    </div>
    {choice !== null && <button type="button" className="photo-release-change" disabled={disabled} onClick={() => select(null)}>Change my answer</button>}
    <p className="helper">No is completely okay—you can still attend. Your choice covers future club events until you change it. No paid ads, sponsor reuse or AI training.</p>
    {choice === false && <p className="helper">(Please remind the host or photographer that you don’t want photos. Hosts must also respect your saved choice.)</p>}
    <p className="helper">Change or withdraw permission: <a href="mailto:join@interaction.club?subject=Change%20my%20photo%20permissions">join@interaction.club</a>.</p>
    <details className="ic-form-details"><summary>Read the photo &amp; video permission terms</summary>
      <p><b>Version October 7, 2026 · v3 · ongoing club photo/video release.</b> By choosing Yes above and submitting my choice, I authorize Vivian Yang, operating Interaction Club, and hosts acting on her behalf to capture and use my identifiable image, likeness, and voice for all the club uses listed below. Choosing No grants none of these permissions. Answering is required; permission is not. My choice applies to future dinners and side quests until I change or withdraw it; it does not authorize recording me outside club events.</p>
      <p><b>Included uses.</b> Yes permits taking photos and short videos for private organizer review and selection, inclusion in Vivian’s club/hackathon presentations and submissions viewed by judges and audiences, and sharing and promoting Interaction Club on its website and Vivian’s or Interaction Club’s social accounts. Public material can be copied or reshared by others. No permission includes paid advertising, sponsor or third-party marketing, facial recognition, AI training, digital replicas, or sale of my image. Those uses require a separate agreement.</p>
      <p><b>Editing and payment.</b> I permit ordinary cropping, resizing, captions, and color or sound adjustments for my selected uses, but not misleading edits or fabricated endorsements. I receive no payment for these permitted uses. This does not authorize publication of my profile, contact details, or other private quiz answers.</p>
      <p><b>My choices remain mine.</b> I may decline a particular photo or notify my host of an event-specific change. I can request a change, withdrawal, or removal at join@interaction.club. After receiving a withdrawal, Interaction Club will stop new uses and remove affected material from channels it controls where requested; it cannot guarantee deletion of copies already made by other people or third-party platforms. Hosts must check current preferences, not assume attendance is consent.</p>
      <p><b>No participation waiver.</b> These permissions are independent of the show-up agreement and do not waive claims about injury, negligence, harassment, or activity risks. No selection means no permission. This section does not authorize other attendees to take or publish photos of me.</p>
    </details>
  </fieldset>;
}
