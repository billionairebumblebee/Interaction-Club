"use client";
import { useEffect, useState, type ComponentProps } from "react";
import AttendancePanel from "../table/[token]/attendance-panel";
import ConfirmationPreview from "./confirmation-preview";
type AttendanceProps = ComponentProps<typeof AttendancePanel>;
type Invite = { table: AttendanceProps["table"]; member: AttendanceProps["initialMember"]; priority?: AttendanceProps["initialPriority"] };

export default function DinnerConfirmation({ token }: { token: string }) {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch(`/api/table/${encodeURIComponent(token)}`).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We couldn’t open your confirmation.");
      if (Date.parse(data.table?.startsAt) !== Date.parse("2026-10-08T18:00:00-07:00")) throw new Error("This link belongs to a different plan. Please open your original private invitation.");
      if (active) setInvite(data);
    }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [token]);
  if (!token) return <ConfirmationPreview/>;
  if (!invite) return <p role="status">{error || "Opening your private confirmation…"}</p>;
  return <AttendancePanel token={token} table={invite.table} initialMember={invite.member} initialPriority={invite.priority}/>;
}
