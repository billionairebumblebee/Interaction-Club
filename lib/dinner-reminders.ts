import { createHash } from "node:crypto";
import { cancellationConsequenceApplies, cancellationPolicy } from "./attendance";
import { getTable, readJson, updateMember, updatePrivateRecord, type ApplicationRecord, type MemberState, type TableRecord } from "./concierge";

export type ReminderKind = "invitation" | "unanswered-48h" | "confirmed-24h";
export type ReminderJob = {
  id: string; tableId: string; applicationId: string; kind: ReminderKind; channel: "email";
  dueAt: string; createdAt: string; status: "queued" | "dispatching" | "sent" | "suppressed" | "delivery-unknown";
  approvedDigest?: string; approvedAt?: string; attemptId?: string; attemptedAt?: string; sentAt?: string; suppressedReason?: string;
};
const HOUR = 3600000;
const kinds: ReminderKind[] = ["invitation", "unanswered-48h", "confirmed-24h"];
export function reminderId(tableId: string, applicationId: string, kind: ReminderKind) {
  if (!kinds.includes(kind)) throw new Error("Unsupported reminder type.");
  return createHash("sha256").update(JSON.stringify([tableId, applicationId, kind])).digest("hex");
}
export function reminderDueAt(table: TableRecord, kind: ReminderKind) {
  return new Date(Date.parse(table.startsAt) - (kind === "invitation" ? 7 * 24 : kind === "unanswered-48h" ? 48 : 24) * HOUR).toISOString();
}
export function reminderEligible(table: TableRecord, member: MemberState, kind: ReminderKind, now = Date.now()) {
  if (!Number.isFinite(Date.parse(table.startsAt)) || !Number.isFinite(Date.parse(table.responseDeadline || ""))) return false;
  if (table.status !== "invited" || Date.parse(table.startsAt) <= now || member.rsvp === "no" || member.cancellation || member.attendance === "cancelled" || member.seatReleasedAt || (member.expiresAt && Date.parse(member.expiresAt) <= now)) return false;
  if (!table.responseDeadline || Date.parse(table.responseDeadline) >= Date.parse(table.startsAt)) return false;
  if (now < Date.parse(reminderDueAt(table, kind))) return false;
  if (kind === "confirmed-24h") return member.rsvp === "yes";
  if (member.rsvp !== "pending" || Date.parse(table.responseDeadline) <= now) return false;
  if (kind === "invitation") return !member.invitationSentAt;
  return !!member.invitationSentAt && now < Date.parse(table.startsAt) - 24 * HOUR;
}
export function reminderDraft(table: TableRecord, member: MemberState, application: ApplicationRecord, kind: ReminderKind) {
  const url = `https://interaction.club/table/${encodeURIComponent(member.token)}`;
  const when = new Date(table.startsAt).toLocaleString("en-US", { timeZone: "America/Los_Angeles", weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  const deadline = new Date(table.responseDeadline!).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  const confirmed = kind === "confirmed-24h";
  const subject = confirmed ? "Dinner tomorrow! 💌" : kind === "invitation" ? "You’re invited! 💌" : "Can you make dinner? 💌";
  const text = confirmed
    ? `Hi ${application.fullName.split(/\s+/)[0]}! 💕 Your Interaction Club dinner is ${when}. We’ll see you there!\n\nNeed to cancel? ${url}`
    : `Hi ${application.fullName.split(/\s+/)[0]}! 💌 You’re invited to an Interaction Club dinner on ${when}. Please respond by ${deadline}.\n\nOpen your invitation and RSVP: ${url}`;
  const policy = confirmed && cancellationConsequenceApplies(member) ? `\n\n${cancellationPolicy}` : "";
  const release = !confirmed && table.deadlineRelease ? `\n\n${table.deadlineRelease.text}` : "";
  const draft = { from: "vivian_yang@berkeley.edu", to: "vivian_yang@berkeley.edu", bcc: application.email, cc: "vivian@interaction.club", subject, text: text + policy + release + "\n\nQuestions? Email the@interaction.club", button: { label: confirmed ? "Need to cancel?" : "RSVP on Interaction Club", href: url } };
  return { ...draft, digest: createHash("sha256").update(JSON.stringify(draft)).digest("hex") };
}
export async function queueReminder(table: TableRecord, member: MemberState, kind: ReminderKind) {
  const id = reminderId(table.id, member.applicationId, kind);
  return updatePrivateRecord<ReminderJob>(`reminder-outbox/${id}.json`, current => current || { id, tableId: table.id, applicationId: member.applicationId, kind, channel: "email", dueAt: reminderDueAt(table, kind), createdAt: new Date().toISOString(), status: "queued" });
}
export async function approveReminder(id: string, digest: string, application: ApplicationRecord) {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error("Invalid reminder.");
  return updatePrivateRecord<ReminderJob>(`reminder-outbox/${id}.json`, current => {
    if (!current || current.status !== "queued" || current.applicationId !== application.id) throw new Error("Reminder is not awaiting approval.");
    return { ...current, approvedDigest: digest, approvedAt: new Date().toISOString() };
  });
}
// No provider, cron or automatic send is installed. A future approved worker must
// call this with the exact-message approval digest and an idempotent email adapter.
export async function dispatchReminder(id: string, application: ApplicationRecord, send: (draft: ReturnType<typeof reminderDraft>, idempotencyKey: string) => Promise<void>) {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error("Invalid reminder.");
  const path = `reminder-outbox/${id}.json`, attemptId = crypto.randomUUID();
  const claimed = await updatePrivateRecord<ReminderJob>(path, current => {
    if (!current || current.status !== "queued" || !current.approvedDigest || current.applicationId !== application.id) throw new Error("Reminder is not approved or has already been attempted.");
    return { ...current, status: "dispatching", attemptId, attemptedAt: new Date().toISOString() };
  });
  const liveApplication = await readJson<ApplicationRecord>(`applications/${claimed.applicationId}.json`);
  const table = await getTable(claimed.tableId);
  const member = table?.members.find(item => item.applicationId === claimed.applicationId);
  const draft = table && member && liveApplication ? reminderDraft(table, member, liveApplication, claimed.kind) : null;
  if (!table || !member || !draft || !reminderEligible(table, member, claimed.kind) || draft.digest !== claimed.approvedDigest) {
    return updatePrivateRecord<ReminderJob>(path, current => ({ ...current!, status: "suppressed", suppressedReason: "Live status or approved message changed." }));
  }
  // Last live read is immediately before handing off to the email provider.
  try { await send(draft, claimed.id); }
  catch {
    // Delivery may have happened: never automatically retry or switch channels.
    return updatePrivateRecord<ReminderJob>(path, current => ({ ...current!, status: "delivery-unknown" }));
  }
  const sentAt = new Date().toISOString();
  const sent = await updatePrivateRecord<ReminderJob>(path, current => ({ ...current!, status: "sent", sentAt }));
  if (claimed.kind === "invitation") await updateMember(table.id, member.applicationId, current => ({ ...current, invitationSentAt: current.invitationSentAt || sentAt }));
  return sent;
}
export async function releaseUnconfirmedSeat(tableId: string, applicationId: string, now = Date.now()) {
  return updateMember(tableId, applicationId, (member, table) => {
    if (!table.deadlineRelease?.text.trim() || !Number.isFinite(Date.parse(table.deadlineRelease.approvedAt)) || !Number.isFinite(Date.parse(table.deadlineRelease.disclosedAt)) || !member.invitationSentAt || Date.parse(table.deadlineRelease.disclosedAt) > Date.parse(member.invitationSentAt) || !Number.isFinite(Date.parse(table.responseDeadline || "")) || Date.parse(table.responseDeadline!) > now || table.status !== "invited") throw new Error("Seat release requires the disclosed deadline and approved release rule.");
    if (member.rsvp !== "pending" || member.seatReleasedAt) return member;
    return { ...member, seatReleasedAt: new Date(now).toISOString() };
  });
}
export async function getReminder(id: string) {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error("Invalid reminder.");
  return readJson<ReminderJob>(`reminder-outbox/${id}.json`);
}
