import { getTable, requireAdmin, updateMember, saveTable } from "@/lib/concierge";
import { eventEnd } from "@/lib/attendance";
import { queueSheetRecord } from "@/lib/sheets";

export async function PATCH(request: Request) {
  if (!requireAdmin(request)) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const tableId = typeof body.tableId === "string" ? body.tableId : "";
    const table = await getTable(tableId);
    if (!table) return Response.json({ error: "Table not found." }, { status: 404 });
    if (body.action === "attendance" && typeof body.applicationId === "string" && ["unknown", "attended", "no-show", "cancelled"].includes(String(body.value))) {
      const member = table.members.find((candidate) => candidate.applicationId === body.applicationId);
      if (!member) return Response.json({ error: "Member not found." }, { status: 404 });
      if (body.value === "no-show" && Date.now() < eventEnd(table)) return Response.json({ error: "Wait until the event ends before recording a no-show." }, { status: 409 });
      const next = await updateMember(table.id, member.applicationId, current => ({ ...current, attendance: body.value as typeof member.attendance, attendanceReviewedAt: body.value === "unknown" ? "" : new Date().toISOString() }));
      Object.assign(member, next);
    } else if (body.action === "excuse-cancellation" && typeof body.applicationId === "string") {
      const member = table.members.find(candidate => candidate.applicationId === body.applicationId);
      if (!member?.cancellation) return Response.json({ error: "Cancellation not found." }, { status: 404 });
      const note = typeof body.note === "string" ? body.note.trim() : "";
      if (!note || note.length > 500) return Response.json({ error: "Add a brief reason for the correction (up to 500 characters)." }, { status: 400 });
      const next = await updateMember(table.id, member.applicationId, current => {
        if (!current.cancellation) throw new Error("Cancellation not found.");
        return { ...current, cancellation: { ...current.cancellation, excusedAt: new Date().toISOString(), excuseNote: note } };
      });
      Object.assign(member, next);
    } else if (body.action === "reinstate" && typeof body.applicationId === "string") {
      const note = typeof body.note === "string" ? body.note.trim() : "";
      if (body.seatReviewed !== true || !note || note.length > 500) return Response.json({ error: "Explicitly review seat availability and record the reason before reinstatement." }, { status: 400 });
      const next = await updateMember(table.id, body.applicationId, (current, liveTable) => {
        if (liveTable.status !== "invited" || Date.parse(liveTable.startsAt) <= Date.now() || !liveTable.responseDeadline || Date.parse(liveTable.responseDeadline) <= Date.now()) throw new Error("Review the event and RSVP deadline first.");
        if (current.rsvp !== "no" && !current.seatReleasedAt) throw new Error("This guest does not need reinstatement.");
        const at = new Date().toISOString();
        return { ...current, rsvp: "pending", attendance: "unknown", cancellation: undefined, seatReleasedAt: undefined, rsvpUpdatedAt: at, cancellationHistory: [...(current.cancellationHistory || []), ...(current.cancellation ? [current.cancellation] : [])], rsvpHistory: [...(current.rsvpHistory || []), { at, from: current.rsvp, to: "pending", actor: "organizer", reason: note }] };
      });
      const index = table.members.findIndex(member => member.applicationId === body.applicationId);
      table.members[index] = next;
    } else if (body.action === "circle") {
      table.circle = { createdAt: new Date().toISOString(), nextMeetup: typeof body.nextMeetup === "string" ? body.nextMeetup.slice(0, 240) : undefined };
      table.status = "complete";
      await saveTable(table);
    } else return Response.json({ error: "Unsupported concierge action." }, { status: 400 });
    try { await queueSheetRecord({id:table.id,kind:"group",record:table}); } catch { /* Saved changes remain available for backfill. */ }
    return Response.json({ table });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update the Table." }, { status: 503 });
  }
}
