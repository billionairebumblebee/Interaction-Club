import { CircleMark } from "./club-brand";

export default function SideQuestBadge() {
  return <aside className="ic-quest-explainer" aria-label="Returning Side Quester badge preview" data-badge-status="unearned">
    <p className="ic-eyebrow">A LITTLE SOMETHING FOR CHAPTER TWO</p>
    <div style={{ display: "inline-flex", alignItems: "center", gap: 16, border: "3px dashed currentColor", borderRadius: 48, padding: "16px 24px", flexWrap: "wrap" }}><CircleMark/><strong>Returning Side Quester</strong><small>Preview · not earned</small></div>
    <p>The milestone: attend two distinct side quests, with attendance verified by a host. Signing up or RSVPing doesn’t count.</p>
    <p className="ic-quest-small">Badge tracking isn’t active yet. When it is, your badge will be private to your own view by default—not a public list of where you’ve been.</p>
  </aside>;
}
