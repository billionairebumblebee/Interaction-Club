import type { MemberState, TableRecord } from "./concierge";

export const ARRIVAL_POLL_MS = 20000;
export const arrivalStatuses = ["on-my-way", "here", "running-late"] as const;
export function arrivalEligible(table: TableRecord, member: MemberState, now = Date.now()) {
  const start = Date.parse(table.startsAt);
  const end = table.endsAt ? Date.parse(table.endsAt) : start + 3 * 3600000;
  return table.status === "invited" && Number.isFinite(start) && Number.isFinite(end)
    && now >= start - 2 * 3600000 && now <= end && member.rsvp === "yes"
    && !member.cancellation && member.attendance !== "cancelled" && !member.seatReleasedAt
    && (!member.expiresAt || Date.parse(member.expiresAt) > now);
}
export function arrivalAction(table: TableRecord, member: MemberState, body: Record<string, unknown>, now = Date.now()): MemberState {
  if (!arrivalEligible(table, member, now)) throw new Error("Arrival updates open two hours before your confirmed dinner and close when it ends. Cancelled or expired invitations cannot check in.");
  const at = new Date(now).toISOString();
  if (body.value === "help") {
    if (member.arrivalHelp && !member.arrivalHelp.acknowledgedAt) return member;
    return { ...member, arrivalHelp: { id: crypto.randomUUID(), requestedAt: at } };
  }
  if (!arrivalStatuses.includes(body.value as typeof arrivalStatuses[number])) throw new Error("Choose an arrival update.");
  if (body.value === "here" && now < Date.parse(table.startsAt) - 30 * 60000) throw new Error("I’m here opens 30 minutes before dinner.");
  const eta = body.etaMinutes;
  if (eta !== undefined && (typeof eta !== "number" || !Number.isInteger(eta) || eta < 0 || eta > 180)) throw new Error("ETA must be a whole number from 0 to 180 minutes.");
  const arrival: NonNullable<MemberState["arrival"]> = { status: body.value as typeof arrivalStatuses[number], at, ...(body.value === "running-late" && eta !== undefined ? { etaMinutes: eta as number } : {}) };
  return { ...member, arrival, arrivalHistory: [...(member.arrivalHistory || []), arrival].slice(-20), ...(body.value === "here" ? { checkedInAt: at } : {}) };
}
export function respondToArrivalHelp(table: TableRecord, member: MemberState, requestId: unknown, response: unknown, now = Date.now()) {
  if (!arrivalEligible(table, member, now)) throw new Error("This guest no longer has an active arrival window.");
  if (!member.arrivalHelp || member.arrivalHelp.id !== requestId) throw new Error("Refresh: the help request changed.");
  if (typeof response !== "string" || !response.trim() || response.trim().length > 400) throw new Error("Add table directions, up to 400 characters. No guest names or contact details.");
  return { ...member, arrivalHelp: { ...member.arrivalHelp, acknowledgedAt: new Date(now).toISOString(), response: response.trim() } };
}
