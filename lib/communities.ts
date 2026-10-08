export const communityOptions = ["Innovation Intelligence Hackathon", "Mox", "Other", "None / Prefer not to say"] as const;
export type EventScope = "community-only" | "cross-community";
export const MOX_PILOT_BOUNDARY = "Member registration does not activate a Mox pilot. Scheduling begins after Mox and Interaction Club agree on the pilot.";
export function moxPilotActivationProblem(plan: { eventScope?: EventScope; community?: string; moxPilotAgreementConfirmed?: boolean }) {
  return plan.eventScope === "community-only" && plan.community?.trim().toLowerCase() === "mox" && plan.moxPilotAgreementConfirmed !== true
    ? MOX_PILOT_BOUNDARY : "";
}
export type CommunityProfile = {
  affiliations?: string[];
  communityOther?: string;
  crossCommunityOptIn?: boolean | null;
};

// Self-reported context, never evidence of verified membership or partnership.
export function cleanCommunityProfile(input: Record<string, unknown>): CommunityProfile {
  const choices = Array.isArray(input.affiliations)
    ? [...new Set(input.affiliations.filter((v): v is string => typeof v === "string" && (communityOptions as readonly string[]).includes(v)))] : [];
  const affiliations = choices.includes("None / Prefer not to say") ? ["None / Prefer not to say"] : choices;
  return {
    affiliations,
    communityOther: affiliations.includes("Other") && typeof input.communityOther === "string" ? input.communityOther.trim().slice(0, 120) : "",
    crossCommunityOptIn: typeof input.crossCommunityOptIn === "boolean" ? input.crossCommunityOptIn : null,
  };
}

export function belongsToCommunity(person: CommunityProfile, community: string) {
  if (community.startsWith("Other: ")) return person.affiliations?.includes("Other") === true && person.communityOther?.trim().toLowerCase() === community.slice(7).trim().toLowerCase();
  return community !== "Other" && community !== "None / Prefer not to say" && person.affiliations?.includes(community) === true;
}

export function communityScopeProblem(person: CommunityProfile, scope?: EventScope, community?: string) {
  if (scope === "cross-community" && person.crossCommunityOptIn !== true) return "Wider-community invitations not opted into; ask before matching";
  if (scope === "community-only" && !belongsToCommunity(person, community || "")) return "Not a self-reported member of this event’s community";
  return "";
}
