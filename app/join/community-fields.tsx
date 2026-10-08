"use client";
import { communityOptions } from "@/lib/communities";

export default function CommunityFields({ affiliations, other, crossCommunityOptIn, onAffiliations, onOther, onCrossCommunity, open = false }: {
  affiliations: string[]; other: string; crossCommunityOptIn: boolean;
  onAffiliations: (value: string[]) => void; onOther: (value: string) => void; onCrossCommunity: (value: boolean) => void;
  open?: boolean;
}) {
  function toggle(value: string) {
    if (affiliations.includes(value)) return onAffiliations(affiliations.filter(item => item !== value));
    onAffiliations(value === "None / Prefer not to say" ? [value] : [...affiliations.filter(item => item !== "None / Prefer not to say"), value]);
  }
  return <section className="step-content"><details className="ic-optional-details" open={open || undefined}><summary>Your communities (optional)</summary><fieldset><legend>Are you part of a particular community or organization?</legend><p className="helper">Select any that fit. This is private, self-reported context—not verified membership.</p>{communityOptions.map(value => <label className="check" key={value}><input type="checkbox" checked={affiliations.includes(value)} onChange={() => toggle(value)}/><span>{value}</span></label>)}{affiliations.includes("Other") && <label className="compact">Your community or organization<input maxLength={120} value={other} onChange={event => onOther(event.target.value)} placeholder="Tell us its name"/></label>}</fieldset></details><label className="check"><input type="checkbox" checked={crossCommunityOptIn} onChange={event => onCrossCommunity(event.target.checked)}/><span><b>Yes! Invite me to Interaction Club dinners and side quests beyond my community, too.</b><small>We’ll match around your interests, availability, location and table preferences.</small></span></label><p className="helper">Optional. Leaving this unchecked means we’ll ask before inviting you beyond your community.</p></section>;
}
