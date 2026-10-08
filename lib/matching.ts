import type { ApplicationRecord, TableRecord } from "./concierge";
import { attendancePriority } from "./attendance";
import { cleanAvailability, normalizeAvailabilitySlot, pilotAvailabilitySlots } from "./availability";
import { pilotWeekProblem, hasDatedDinnerSelection } from "./pilot-week";
import { tagKey } from "./interest-tags";
import { hackathonAffinity } from "./hackathon";
import { belongsToCommunity, communityScopeProblem, moxPilotActivationProblem, type EventScope } from "./communities";
import { baseAreas } from "./locations";
import { photoGroupingPreference } from "./photo-consent";

export const eveningIntents = ["Builder / founder", "Chill / social", "Open to either"] as const;
export const ageBands = ["18–22", "23–29", "30–39", "40–54", "55+"] as const;
export type MatchPlan = { activity: string; intent: string; format: string; slot: string; ageBand: string; cost: number; size: number; startsAt: string; eventScope?: EventScope; community?: string; venueArea?: string; organizationFilter?: string; moxPilotAgreementConfirmed?: boolean; photoMode?: "photography" | "photo-free" };
const formats = ["Inclusive / everyone", "50/50 men + women", "Women only", "Men only"];
export function ageBandFor(month: number, year: number, now = new Date()) {
  const age = now.getUTCFullYear() - year - (now.getUTCMonth() + 1 < month ? 1 : 0);
  return age < 18 ? "Under 18" : age <= 22 ? ageBands[0] : age <= 29 ? ageBands[1] : age <= 39 ? ageBands[2] : age <= 54 ? ageBands[3] : ageBands[4];
}
export function budgetCap(person: ApplicationRecord) {
  if (typeof person.maxSpend === "number" && Number.isFinite(person.maxSpend) && person.maxSpend >= 0) return person.maxSpend;
  return ({ "Free plans only": 0, "Under $15": 14.99, "$15–30": 30, "$30–50": 50 } as Record<string, number>)[person.budget] ?? null;
}
export function planProblem(plan: MatchPlan, now = new Date()) {
  if (plan.photoMode !== undefined && !["photography", "photo-free"].includes(plan.photoMode)) return "Choose a valid dinner photo format.";
  const activationProblem = moxPilotActivationProblem(plan); if (activationProblem) return activationProblem;
  if (plan.eventScope && !["community-only", "cross-community"].includes(plan.eventScope)) return "Choose a valid event scope.";
  if (plan.eventScope === "community-only" && (typeof plan.community !== "string" || !plan.community.trim() || ["Other", "None / Prefer not to say"].includes(plan.community))) return "Choose a named community for this closed event.";
  if (plan.organizationFilter !== undefined && typeof plan.organizationFilter !== "string") return "Choose a valid organization filter.";
  if (plan.venueArea && !(baseAreas as readonly string[]).includes(plan.venueArea)) return "Choose a supported meeting area.";
  if (!Number.isInteger(plan.size) || plan.size < 2 || plan.size > 10 || plan.size % 2) return "Choose an even group size from 2 to 10, counting every participant including a host who joins the group.";
  if (!formats.includes(plan.format) || !ageBands.includes(plan.ageBand as typeof ageBands[number])) return "Choose a table format and age group.";
  if (!["Builder / founder", "Chill / social"].includes(plan.intent)) return "Choose a specific evening intent. Flexible guests may opt into either.";
  if (!["Dinner", "Quick connect", "Build together", "Do something"].includes(plan.activity)) return "Choose an activity.";
  if (!Number.isFinite(plan.cost) || plan.cost < 0) return "Enter the full per-person cost, including tax, tip, and required purchases.";
  const start = new Date(plan.startsAt);
  if (!plan.startsAt || !Number.isFinite(start.getTime()) || start <= now) return "Choose a future date and time.";
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(start);
  const day = parts.find(p => p.type === "weekday")?.value;
  const hour = Number(parts.find(p => p.type === "hour")?.value);
  const slot = normalizeAvailabilitySlot(plan.slot);
  if (!slot || !pilotAvailabilitySlots.includes(slot)) return "The first pilots are dinner plans. Breakfast and lunch availability is saved for later.";
  if (`${day} dinner` !== slot || hour < 18 || hour >= 20) return "Choose a start time in the selected dinner window: 6–8 PM Pacific.";
  return "";
}
export function eligible(person: ApplicationRecord, plan: MatchPlan, tables: TableRecord[], now = new Date()) {
  if (plan.photoMode === "photography" && photoGroupingPreference(person.photoConsent) !== "photography") return "Needs a photo-free dinner or explicit current photography and promotional-use consent";
  const activationProblem = moxPilotActivationProblem(plan); if (activationProblem) return activationProblem;
  if (person.email.toLowerCase().endsWith(".invalid")) return "Synthetic test record; do not match";
  const scopeProblem = communityScopeProblem(person, plan.eventScope, plan.community);
  if (scopeProblem) return scopeProblem;
  if (plan.organizationFilter && !belongsToCommunity(person, plan.organizationFilter)) return "Outside the selected organization filter";
  const weekProblem = pilotWeekProblem(person, plan.startsAt);
  if (weekProblem) return weekProblem;
  if (!person.birthMonth || !person.birthYear || !person.agreement || ageBandFor(person.birthMonth, person.birthYear, now) === "Under 18") return "Adult eligibility needs confirmation";
  if (ageBandFor(person.birthMonth, person.birthYear, now) !== plan.ageBand) return "Different age group";
  const venueArea = plan.venueArea || "Berkeley";
  if (person.baseArea !== venueArea && !(venueArea === "Berkeley" && person.willingToTravelToBerkeley === true)) return "Different base area; travel willingness not confirmed";
  if (!person.intent) return "Ask for evening intent";
  if (person.intent !== plan.intent && person.intent !== "Open to either") return "Different evening intent";
  const slot = normalizeAvailabilitySlot(plan.slot);
  if (!slot || (!hasDatedDinnerSelection(person, plan.startsAt) && !cleanAvailability(person.availability).includes(slot))) return "Unavailable at this time";
  if (!person.activities.includes(plan.activity)) return "Different activity preference";
  if (!person.tableFormats.includes(plan.format)) return "Did not opt into this table format";
  if (plan.format === "Women only" && person.gender !== "Woman") return "Not eligible for selected format";
  if (plan.format === "Men only" && person.gender !== "Man") return "Not eligible for selected format";
  if (plan.format === "50/50 men + women" && !["Woman", "Man"].includes(person.gender || "")) return "Gender self-identification needed for this format";
  const cap = budgetCap(person);
  if (cap === null) return "Ask for an exact spending limit";
  if (cap < plan.cost) return "Above spending limit";
  if (tables.some(t => t.status !== "cancelled" && t.status !== "complete" && new Date(t.startsAt) > now && t.members.some(m => m.applicationId === person.id && m.rsvp !== "no"))) return "Already has an upcoming invitation or plan";
  return "";
}
export function groupProblem(people: ApplicationRecord[], plan: MatchPlan) {
  if (plan.photoMode !== "photo-free" && people.some(person => photoGroupingPreference(person.photoConsent) === "photo-free")) return "Choose a photo-free dinner for guests who declined photos.";
  if (people.length !== plan.size) return "The selected group does not match the chosen size.";
  if (new Set(people.map(p => p.email.trim().toLowerCase())).size !== people.length) return "Duplicate person/email in this group.";
  if (plan.format === "50/50 men + women" && people.filter(p => p.gender === "Woman").length !== plan.size / 2) return "This group does not have the requested 50/50 composition.";
  if (people.some(p => people.some(other => p.doNotRematchIds?.includes(other.id)))) return "A private do-not-rematch constraint prevents this combination.";
  return "";
}
function score(people: ApplicationRecord[]) {
  // Shared interests create conversation anchors; distinct optional disciplines add variety.
  const interests = people.flatMap(p => p.interests.map(tagKey));
  const shared = interests.length - new Set(interests).size;
  const diversity = new Set(people.map(p => p.discipline?.trim().toLowerCase()).filter(Boolean)).size;
  const communityAffinity = people.reduce((sum, person, i) => sum + people.slice(i + 1).filter(other => (person.affiliations || []).some(community => belongsToCommunity(other, community === "Other" ? `Other: ${person.communityOther || ""}` : community))).length, 0);
  return shared * 2 + diversity + communityAffinity + hackathonAffinity(people);
}
export function suggestGroups(applications: ApplicationRecord[], tables: TableRecord[], plan: MatchPlan, now = new Date()) {
  const problem = planProblem(plan, now); if (problem) throw new Error(problem);
  const excluded: { id: string; reason: string }[] = [];
  const priority = new Map(applications.map(person => [person.id, attendancePriority(person.id, tables, now.getTime())]));
  const lower = (person: ApplicationRecord) => Number(priority.get(person.id)?.deprioritized || false);
  const pool = applications.filter(p => { const reason = eligible(p, plan, tables, now); if (reason) excluded.push({ id: p.id, reason }); return !reason; }).sort((a,b) => lower(a) - lower(b) || a.submittedAt.localeCompare(b.submittedAt) || a.id.localeCompare(b.id));
  const groups: { memberIds: string[]; score: number; venueNotes: string[] }[] = [];
  let remaining = [...pool], searchLimited = false;
  while (remaining.length >= plan.size) {
    let best: ApplicationRecord[] = [], bestScore = -1, bestLower = Infinity, examined = 0;
    function search(chosen: ApplicationRecord[], index: number) {
      if (++examined > 40000) { searchLimited = true; return; }
      if (chosen.length === plan.size) { const lowerCount = chosen.reduce((sum, person) => sum + lower(person), 0); const fit = score(chosen); if (!groupProblem(chosen, plan) && (lowerCount < bestLower || (lowerCount === bestLower && fit > bestScore))) { best = [...chosen]; bestScore = fit; bestLower = lowerCount; } return; }
      for (let i = index; i <= remaining.length - (plan.size - chosen.length); i++) {
        const candidate = remaining[i];
        if (chosen.some(p => p.email.toLowerCase() === candidate.email.toLowerCase() || p.doNotRematchIds?.includes(candidate.id) || candidate.doNotRematchIds?.includes(p.id))) continue;
        search([...chosen, candidate], i + 1);
        if (examined > 40000) break;
      }
    }
    search([], 0); if (!best.length) break;
    groups.push({ memberIds: best.map(p => p.id), score: bestScore, venueNotes: best.flatMap(p => [...(p.dietaryNeeds || []), p.dietaryOther, p.accessibilityNotes].filter((v): v is string => Boolean(v)).map(v => `${p.fullName}: ${v}`)) });
    const usedEmails = new Set(best.map(p => p.email.toLowerCase()));
    remaining = remaining.filter(p => !usedEmails.has(p.email.toLowerCase()));
  }
  return { groups, unmatchedIds: remaining.map(p => p.id), excluded, searchLimited, explanation: "Private draft suggestions. Availability, activity, intent, age group, budget, table opt-in, existing plans and do-not-rematch rules are hard constraints. Among compatible combinations, fewer people with two unexcused late cancellations in 90 days take priority, then shared interests, optional disciplines and mutual hackathon opt-in. Hackathon opt-in is a preference, not a separate queue or eligibility rule. Lower priority is not exclusion. Venue needs never change group ranking." };
}
