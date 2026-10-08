import { getTable, requireAdmin, saveMember, saveTable } from "@/lib/concierge";
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
      member.attendance = body.value as typeof member.attendance;
      member.attendanceReviewedAt = body.value === "unknown" ? "" : new Date().toISOString();
      await saveMember(table.id, member);
    } else if (body.action === "excuse-cancellation" && typeof body.applicationId === "string") {
      const member = table.members.find(candidate => candidate.applicationId === body.applicationId);
      if (!member?.cancellation) return Response.json({ error: "Cancellation not found." }, { status: 404 });
      const note = typeof body.note === "string" ? body.note.trim() : "";
      if (!note || note.length > 500) return Response.json({ error: "Add a brief reason for the correction (up to 500 characters)." }, { status: 400 });
      member.cancellation.excusedAt = new Date().toISOString(); member.cancellation.excuseNote = note;
      await saveMember(table.id, member);
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
