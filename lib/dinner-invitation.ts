export const DINNER_TIMEZONE = "America/Los_Angeles";
export const dinnerIdValid = (value: string) => /^dinner-\d{2,8}$/.test(value);
export const inviteTokenValid = (value: string) => /^[a-zA-Z0-9_-]{20,150}$/.test(value);
export function dinnerInvitationPath(dinnerId: string | undefined, token: string) {
  return dinnerId ? `/invitation/${dinnerId}?token=${encodeURIComponent(token)}` : `/table/${encodeURIComponent(token)}`;
}
export function invitationExpired(member: { expiresAt?: string }, now = Date.now()) {
  return !!member.expiresAt && (!Number.isFinite(Date.parse(member.expiresAt)) || Date.parse(member.expiresAt) <= now);
}
export function scheduledTimesValid(start: string, end: string) {
  const offset = /(?:Z|[+-]\d{2}:\d{2})$/;
  return offset.test(start) && offset.test(end) && Number.isFinite(Date.parse(start)) && Date.parse(end) > Date.parse(start);
}

type CalendarPlan = { id?: string; dinnerId?: string; activity: string; intent?: string; startsAt: string; endsAt?: string; venueName: string; venueAddress?: string; venueArea: string };
const utc = (date: string) => new Date(date).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
export function calendarDetails(plan: CalendarPlan) {
  if (!plan.endsAt || !scheduledTimesValid(plan.startsAt, plan.endsAt)) throw new Error("The host needs to confirm the event times.");
  // Do not copy free-text host notes, contacts, private tokens or member lists into calendars.
  const title = "Interaction Club dinner";
  const location = [plan.venueName, plan.venueAddress || plan.venueArea].filter(Boolean).join(", ");
  return { title, location, start: utc(plan.startsAt), end: utc(plan.endsAt), description: "Your Interaction Club dinner. Refer to your private invitation for cost, theme and arrival details." };
}
export function googleCalendarLink(plan: CalendarPlan) {
  const event = calendarDetails(plan);
  return "https://calendar.google.com/calendar/render?" + new URLSearchParams({ action: "TEMPLATE", text: event.title, dates: `${event.start}/${event.end}`, ctz: DINNER_TIMEZONE, location: event.location, details: event.description });
}
const escapeIcs = (value: string) => value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
const foldIcs = (value: string) => {
  const lines: string[] = []; let line = "";
  for (const character of value) { if (new TextEncoder().encode(line + character).length > 73) { lines.push(line); line = " "; } line += character; }
  return [...lines, line].join("\r\n");
};
export function dinnerCalendarIcs(plan: CalendarPlan, now = new Date()) {
  const event = calendarDetails(plan);
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Interaction Club//Dinner//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:${escapeIcs(plan.id || plan.dinnerId || "dinner")}@interaction.club`, `DTSTAMP:${utc(now.toISOString())}`, `DTSTART:${event.start}`, `DTEND:${event.end}`, `SUMMARY:${escapeIcs(event.title)}`, `LOCATION:${escapeIcs(event.location)}`, `DESCRIPTION:${escapeIcs(event.description)}`, "END:VEVENT", "END:VCALENDAR", ""].map(foldIcs).join("\r\n");
}
