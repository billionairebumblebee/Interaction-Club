import { findTableByToken, listTables, updateMember, type MemberState } from "@/lib/concierge";
import { attendanceAction, attendancePriority } from "@/lib/attendance";
import { queueSheetRecord } from "@/lib/sheets";

import { acceptInvitationAgreement, invitationAgreementComplete } from "@/lib/invitation-agreement";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const publicMember = (member: MemberState) => ({ rsvp: member.rsvp, attendance: member.attendance, feedback: member.feedback, checkedInAt: member.checkedInAt, cancellation: member.cancellation, termsAcceptance: member.termsAcceptance, photoConsent: member.photoConsent, decline: member.decline, policyAcceptedAt: member.policyAcceptedAt, seatReleasedAt: member.seatReleasedAt });
type Context = { params: Promise<{ token: string }> };
export async function GET(_: Request, context: Context) {
  try {
    const { token } = await context.params;
    const found = await findTableByToken(token);
    if (!found) return json({ error: "This invitation is no longer available." }, 404);
    const { table, memberIndex } = found;
    const member = table.members[memberIndex];
    return json({ table: { activity: table.activity, format: table.format, venueName: table.venueName, venueArea: table.venueArea, startsAt: table.startsAt, status: table.status, intent: table.intent, theme: table.theme, venueAddress: table.venueAddress, endsAt: table.endsAt, responseDeadline: table.responseDeadline, cost: table.cost, costDetails: table.costDetails, hosted: table.hosted, hostName: table.hostName, hostContactEmail: table.hostContactEmail, sponsorDisclosure: table.sponsorDisclosure, dressCode: table.dressCode, venueNotes: table.venueNotes, circle: table.circle }, member: publicMember(member), priority: attendancePriority(member.applicationId, await listTables()) });
  } catch { return json({ error: "Unable to load your invitation. Please try again." }, 503); }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { token } = await context.params;
    const found = await findTableByToken(token);
    if (!found) return json({ error: "This invitation is no longer available." }, 404);
    let body: Record<string, unknown>;
    try { const parsed = await request.json(); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(); body = parsed; }
    catch { return json({ error: "Please check your response." }, 400); }
    const { table, memberIndex } = found;
    const memberId = table.members[memberIndex].applicationId;
    let member: MemberState;
    try { member = await updateMember(table.id, memberId, (current, liveTable) => {
    let member = current;
    if (member.token !== token) throw new Error("This invitation is no longer available.");
    if (body.action === "rsvp" && body.value === "yes" && body.agreement === false) throw new Error("You must accept the terms for the dinner before selecting Yes.");
    if ((body.action === "rsvp" && body.value === "yes") || body.action === "check-in") {
      if (!invitationAgreementComplete(member)) {
        try {
          const renewed = acceptInvitationAgreement(body, new Date().toISOString());
          // Retain the exact prior version/timestamp when a guest explicitly renews.
          const history = [...(member.termsAcceptanceHistory || [])];
          if (member.termsAcceptance && !history.some(item => item.version === member.termsAcceptance?.version && item.acceptedAt === member.termsAcceptance?.acceptedAt)) history.push({ ...member.termsAcceptance });
          member = { ...member, ...renewed, termsAcceptanceHistory: history };
        }
        catch (error) { throw new Error(error instanceof Error ? error.message : "Please complete the agreements."); }
      }
    }
    if (body.action === "feedback" && typeof body.meetAgain === "boolean") member = { ...member, feedback: { meetAgain: body.meetAgain, note: typeof body.note === "string" ? body.note.trim().slice(0, 500) : "", submittedAt: new Date().toISOString() } };
    else {
      member = attendanceAction(liveTable, member, body);
    }
    return member;
    }); } catch (error) { return json({ error: error instanceof Error ? error.message : "Unable to update attendance." }, 400); }
    table.members[memberIndex] = member;
    try { await queueSheetRecord({ id: table.id, kind: "group", record: table }); } catch { /* Private record is durable; the group row can be backfilled. */ }
    const history = (await listTables()).filter(item => item.id !== table.id);
    return json({ ok: true, member: publicMember(member), priority: attendancePriority(member.applicationId, [...history, table]) });
  } catch { return json({ error: "We couldn’t confirm your update. Refresh to check its status before retrying." }, 503); }
}
