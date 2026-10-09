import type { MemberState, TableRecord } from "./concierge";
import { arrivalAction } from "./dinner-arrival";

export const ATTENDANCE_POLICY = "2026-10-05-v1";
export const LATE_CANCEL_LIMIT = 2;
export const CANCELLATION_DAYS = 90;
const DAY = 24 * 60 * 60 * 1000;
export const declineReasons = ["The time doesn’t work", "The cost doesn’t work", "Restaurant or food needs", "Table preferences", "Something urgent came up", "Other", "Prefer not to say"] as const;
export const cancellationPolicy = "Cancel at least 24 hours before the start if your plans change. Two unexcused late cancellations within 90 days lower your priority for future matches until fewer than two remain in that window. Declining before you accept doesn’t count. Emergencies and mistakes can be reviewed.";
export function eventEnd(table: { startsAt: string; endsAt?: string }) { return Date.parse(table.endsAt || "") || Date.parse(table.startsAt) + 3 * 60 * 60 * 1000; }
export function canCheckIn(table: { startsAt: string; endsAt?: string; status: string }, now = Date.now()) { return ["invited", "complete"].includes(table.status) && now >= Date.parse(table.startsAt) - 30 * 60 * 1000 && now <= eventEnd(table); }
export function isLateCancellation(startsAt: string, now = Date.now()) { return Number.isFinite(Date.parse(startsAt)) && Date.parse(startsAt) - now < DAY; }
export function cancellationConsequenceApplies(member: Pick<MemberState, "policyAcceptedAt">) { return !!member.policyAcceptedAt && Number.isFinite(Date.parse(member.policyAcceptedAt)); }
export function attendancePriority(applicationId: string, tables: TableRecord[], now = Date.now()) {
  const dates = tables.filter(table => table.status !== "cancelled").flatMap(table => {
    const member = table.members.find(member => member.applicationId === applicationId);
    const cancellation = member?.cancellation;
    if (!cancellation?.late || cancellation.penaltyApplicable === false || cancellation.policyVersion !== ATTENDANCE_POLICY || cancellation.excusedAt || member?.attendance === "attended") return [];
    const at = Date.parse(cancellation.at);
    return at > now - CANCELLATION_DAYS * DAY && at <= now ? [at] : [];
  }).sort((a, b) => a - b);
  return { lateCancellations: dates.length, deprioritized: dates.length >= LATE_CANCEL_LIMIT, priorityRestoresAt: dates.length >= LATE_CANCEL_LIMIT ? new Date(dates[dates.length - LATE_CANCEL_LIMIT] + CANCELLATION_DAYS * DAY).toISOString() : null };
}
export function attendanceAction(table: TableRecord, member: MemberState, body: Record<string, unknown>, now = Date.now()): MemberState {
  const next = structuredClone(member); const at = new Date(now).toISOString();
  if (body.action === "check-in") {
    if (member.attendance === "attended") return next;
    if (member.rsvp !== "yes" || !canCheckIn(table, now)) throw new Error("Check-in opens 30 minutes before your confirmed event and closes when it ends.");
    if (member.attendanceReviewedAt) throw new Error("The organizer has already reviewed attendance. Ask them to correct it if needed.");
    // Guest self-report is distinct from organizer-verified attendance.
    return arrivalAction(table, member, { value: "here" }, now);
  } else if (body.action === "review-cancellation") {
    if (!next.cancellation) throw new Error("There isn’t a cancellation to review.");
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (!note || note.length > 500) throw new Error("Briefly explain what needs reviewing (up to 500 characters). No sensitive details needed.");
    next.cancellation.review = { at, note };
  } else if (body.action === "rsvp" && body.value === "yes") {
    if (member.rsvp === "no" || member.cancellation || member.attendance === "cancelled" || member.seatReleasedAt) throw new Error("Please ask the organizer before rejoining; your place may have been offered to someone else.");
    if (member.rsvp === "yes") return next;
    if (table.status !== "invited" || Date.parse(table.startsAt) <= now || (table.responseDeadline && Date.parse(table.responseDeadline) <= now) || (table.cost === undefined && !table.costDetails?.trim()) || !table.venueAddress || !table.sponsorDisclosure) throw new Error("This invitation needs updated details or a new RSVP deadline. Please contact your host.");
    if (body.policyVersion !== ATTENDANCE_POLICY) throw new Error("Please read the current attendance policy before confirming.");
    next.rsvp = "yes"; next.policyAcceptedAt = at;
  } else if (body.action === "rsvp" && body.value === "no") {
    if (member.rsvp === "no") return next;
    if (member.attendance === "attended") throw new Error("You’re already checked in. Contact the organizer if this is a mistake.");
    if (now >= eventEnd(table)) throw new Error("This event has ended. Contact the organizer to correct attendance.");
    if (!declineReasons.includes(body.declineReason as typeof declineReasons[number])) throw new Error("Please choose a reason, or Prefer not to say.");
    const declineNote = typeof body.declineNote === "string" ? body.declineNote.trim() : "";
    if (declineNote.length > 500 || (body.declineReason === "Other" && !declineNote)) throw new Error("For Other, add a short reason (up to 500 characters). No private details needed.");
    next.decline = { reason: body.declineReason as string, note: body.declineReason === "Other" ? declineNote : "", recordedAt: at };
    if (member.rsvp === "yes") {
      const late = table.status !== "cancelled" && isLateCancellation(table.startsAt, now);
      const penaltyApplicable = cancellationConsequenceApplies(member);
      if (late && penaltyApplicable && body.confirmLateCancellation !== true) throw new Error("This is less than 24 hours before the start. Please confirm the late-cancellation notice.");
      next.cancellation = next.cancellation || { at, startsAt: table.startsAt, late, policyVersion: ATTENDANCE_POLICY, penaltyApplicable };
      next.attendance = "cancelled";
    }
    next.rsvp = "no";
  } else throw new Error("Unsupported attendance action.");
  if (next.rsvp !== member.rsvp) {
    next.rsvpUpdatedAt = at;
    next.rsvpHistory = [...(member.rsvpHistory || []), { at, from: member.rsvp, to: next.rsvp, actor: "guest", reason: next.decline?.reason }];
  }
  return next;
}
