import { get, list, put } from "@vercel/blob";
import type { PhotoConsent } from "./photo-consent";
import type { TermsAcceptance } from "./participation-terms";
import { dinnerIdValid, invitationExpired } from "./dinner-invitation";
import type { CommunityProfile, EventScope } from "./communities";

export type ApplicationRecord = CommunityProfile & {
  id: string;
  photoConsent?: PhotoConsent | null;
  termsAcceptance?: TermsAcceptance;
  fullName: string;
  email: string;
  baseArea: string;
  referralSource?: string | null;
  invitedBy?: string | null;
  willingToTravelToBerkeley?: boolean;
  pronouns?: string | null;
  activities: string[];
  budget: string;
  availability: string[];
  tableFormats: string[];
  interests: string[];
  submittedAt: string;
  birthMonth?: number; birthYear?: number; agreement?: boolean; ageConfirmed?: boolean;
  gender?: string | null; intent?: string; discipline?: string; maxSpend?: number;
  dietaryNeeds?: string[]; dietaryOther?: string; accessibilityNotes?: string;
  doNotRematchIds?: string[]; spontaneous?: boolean;
};

export type MemberState = {
  decline?: { reason: string; note: string; recordedAt: string };
  applicationId: string;
  token: string;
  expiresAt?: string;
  rsvp: "pending" | "yes" | "no";
  attendance: "unknown" | "attended" | "no-show" | "cancelled";
  feedback?: { meetAgain: boolean; note: string; submittedAt: string };
  checkedInAt?: string;
  policyAcceptedAt?: string;
  termsAcceptance?: TermsAcceptance;
  photoConsent?: PhotoConsent | null;
  attendanceReviewedAt?: string;
  cancellation?: { at: string; startsAt: string; late: boolean; policyVersion: string; review?: { at: string; note: string }; excusedAt?: string; excuseNote?: string };
};

export type TableRecord = {
  photoMode?: "photography" | "photo-free";
  id: string;
  dinnerId?: string;
  theme?: string;
  eventScope?: EventScope;
  community?: string;
  communityPilotAgreement?: { organization: "Mox"; confirmedBy: "organizer"; confirmedAt: string };
  hostReview?: { approvedAt: string; rationale: string; aiAssisted: boolean };
  status: "draft" | "invited" | "complete" | "cancelled";
  activity: string;
  venueName: string;
  venueArea: string;
  startsAt: string;
  createdAt: string;
  intent?: string; format?: string; cost?: number; costDetails?: string; hostName?: string;
  hosted?: boolean; sponsorDisclosure?: string; dressCode?: string; endsAt?: string;
  responseDeadline?: string; venueAddress?: string; venueNotes?: string;
  hostContactEmail?: string;
  members: MemberState[];
  circle?: { createdAt: string; nextMeetup?: string };
};

function assertStore() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("The private concierge inbox is not configured.");
}

export async function readJson<T>(pathname: string): Promise<T | null> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result?.stream) return null;
  return new Response(result.stream).json() as Promise<T>;
}

export async function writeRecord(pathname: string, value: unknown) {
  assertStore();
  await put(pathname, JSON.stringify(value), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json" });
}

export async function readPrefix<T>(prefix: string) {
  assertStore();
  const paths: string[] = []; let cursor: string | undefined;
  do { const result = await list({ prefix, limit: 250, cursor }); paths.push(...result.blobs.map(b => b.pathname)); cursor = result.hasMore ? result.cursor : undefined; } while (cursor);
  const records: (T | null)[] = [];
  for (let i = 0; i < paths.length; i += 20) records.push(...await Promise.all(paths.slice(i, i + 20).map(path => readJson<T>(path))));
  return records.filter((record) => record !== null) as T[];
}

export async function listApplications() {
  return (await readPrefix<ApplicationRecord>("applications/")).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function listTables() {
  const [tables, participation] = await Promise.all([readPrefix<TableRecord>("tables/"), readPrefix<ParticipationRecord>("participation/")]);
  return tables.map(table => mergeParticipation(table, participation)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
}

export async function getTable(id: string) {
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(id)) return null;
  const table = await readJson<TableRecord>(`tables/${id}.json`);
  return table ? mergeParticipation(table, await readPrefix<ParticipationRecord>(`participation/${id}/`)) : null;
}

type ParticipationRecord = { tableId: string; applicationId: string; state: Omit<MemberState, "token" | "applicationId"> };
function mergeParticipation(table: TableRecord, records: ParticipationRecord[]) {
  return { ...table, members: table.members.map(member => ({ ...member, ...records.find(record => record.tableId === table.id && record.applicationId === member.applicationId)?.state })) };
}
export async function saveMember(tableId: string, member: MemberState) {
  // Separate records keep one attendee from overwriting another attendee's update.
  const { rsvp, attendance, feedback, checkedInAt, policyAcceptedAt, attendanceReviewedAt, cancellation, termsAcceptance, photoConsent, decline } = member;
  await writeRecord(`participation/${tableId}/${member.applicationId}.json`, { tableId, applicationId: member.applicationId, state: { rsvp, attendance, feedback, checkedInAt, policyAcceptedAt, attendanceReviewedAt, cancellation, termsAcceptance, photoConsent, decline } } satisfies ParticipationRecord);
}

export async function saveTable(table: TableRecord) {
  await writeRecord(`tables/${table.id}.json`, table);
}

export async function reserveDinnerId(tableId: string) {
  assertStore();
  // Create-only reservations are the collision boundary, not a read/increment/write counter.
  // Failed table saves may leave gaps; an allocated number is never reused.
  for (let number = 1; number <= 100000; number++) {
    const dinnerId = `dinner-${String(number).padStart(2, "0")}`;
    const pathname = `dinner-ids/${dinnerId}.json`;
    if (await readJson(pathname)) continue;
    try {
      await put(pathname, JSON.stringify({ tableId }), { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json" });
      return dinnerId;
    } catch (error) {
      if (await readJson(pathname)) continue;
      throw error;
    }
  }
  throw new Error("Dinner number allocation is unavailable.");
}

export async function getDinnerInvitation(dinnerId: string, token: string) {
  if (!dinnerIdValid(dinnerId)) return null;
  const reservation = await readJson<{ tableId: string }>(`dinner-ids/${dinnerId}.json`);
  if (!reservation) return null;
  const table = await getTable(reservation.tableId);
  const member = table?.members.find(item => item.token === token && !invitationExpired(item));
  return table && table.dinnerId === dinnerId && member ? { table, member } : null;
}

export async function findTableByToken(token: string) {
  const tables = await listTables();
  for (const table of tables) {
    const memberIndex = table.members.findIndex((member) => member.token === token && !invitationExpired(member));
    if (memberIndex >= 0) return { table, memberIndex };
  }
  return null;
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

export function requireAdmin(request: Request) {
  const expected = process.env.INTERACTION_ADMIN_KEY;
  return Boolean(expected && request.headers.get("x-interaction-admin-key") === expected);
}
