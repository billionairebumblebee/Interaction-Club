"use client";
import { dinnerCalendarIcs, googleCalendarLink } from "@/lib/dinner-invitation";

export default function CalendarLinks({ token, table, demo = false }: { token: string; table: { activity?: string; startsAt: string; endsAt?: string; venueName?: string; venueAddress?: string; venueArea?: string }; demo?: boolean }) {
  if (!table.endsAt || !table.venueName) return null;
  let href: string;
  try { href = googleCalendarLink({ ...table, activity: table.activity || "Dinner", venueName: table.venueName, venueArea: table.venueArea || "" }); } catch { return null; }
  const download = demo ? "data:text/calendar;charset=utf-8," + encodeURIComponent(dinnerCalendarIcs({ ...table, id: "synthetic-demo", activity: "Dinner", venueName: table.venueName, venueArea: table.venueArea || "" })) : `/api/table/${encodeURIComponent(token)}/calendar`;
  return <div className="letter-actions" aria-label="Add your dinner to your calendar"><a className="exp-button" href={href} target="_blank" rel="noreferrer">Add to Google Calendar ↗</a><a className="exp-text-button" href={download} download="interaction-dinner.ics">Add to another calendar (.ics)</a></div>;
}
