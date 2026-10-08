"use client";
import { useState } from "react";
import type { MemberState, TableRecord } from "@/lib/concierge";
import { attendancePriority } from "@/lib/attendance";

export default function AttendanceControls({ adminKey, tableId, member, tables, onUpdate }: { adminKey: string; tableId: string; member: MemberState; tables: TableRecord[]; onUpdate: (table: TableRecord) => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [note, setNote] = useState("");
  const priority = attendancePriority(member.applicationId, tables);
  async function update(body: Record<string, unknown>) {
    setBusy(true); setError("");
    try { const response = await fetch("/api/admin/table", { method: "PATCH", headers: { "content-type": "application/json", "x-interaction-admin-key": adminKey }, body: JSON.stringify({ ...body, tableId, applicationId: member.applicationId }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); onUpdate(result.table); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to update."); }
    finally { setBusy(false); }
  }
  return <div style={{ marginBottom: 22, padding: 14, border: "1px dashed #909bd0", borderRadius: 16 }}>
    <p>Attendance: <b>{member.attendance}</b>{member.checkedInAt ? ` · self check-in ${new Date(member.checkedInAt).toLocaleString()}` : ""}{member.attendanceReviewedAt ? " · organizer reviewed" : ""}</p>
    <label>Organizer correction <select aria-label={`Attendance for ${member.applicationId}`} disabled={busy} value={member.attendance} onChange={event => update({ action: "attendance", value: event.target.value })}><option value="unknown">Unconfirmed (not a no-show)</option><option value="attended">Attended</option><option value="no-show">Confirmed no-show</option><option value="cancelled">Cancelled</option></select></label>
    <p>{priority.lateCancellations} unexcused late cancellations in 90 days · {priority.deprioritized ? "Lower matching priority" : "Normal matching priority"}. No-show marks are not part of this late-cancellation rule.</p>
    {member.cancellation?.review && <p style={{ whiteSpace: "pre-wrap" }}><b>Review requested:</b> {member.cancellation.review.note}</p>}
    {member.cancellation?.late && !member.cancellation.excusedAt && <form onSubmit={event => { event.preventDefault(); void update({ action: "excuse-cancellation", note }); }}><label>Reason to excuse / correct <input required maxLength={500} value={note} onChange={event => setNote(event.target.value)}/></label><button className="exp-button dark" disabled={busy}>Excuse late cancellation</button></form>}
    {member.cancellation?.excusedAt && <p>Excused: {member.cancellation.excuseNote}</p>}
    {error && <p className="exp-error" role="alert">{error}</p>}
  </div>;
}
