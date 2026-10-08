import { findTableByToken } from "@/lib/concierge";
import { dinnerCalendarIcs, inviteTokenValid } from "@/lib/dinner-invitation";

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" };
  const { token } = await context.params;
  if (!inviteTokenValid(token)) return Response.json({ error: "Invitation unavailable." }, { status: 404, headers });
  try {
    const found = await findTableByToken(token);
    if (!found) return Response.json({ error: "Invitation unavailable." }, { status: 404, headers });
    if (found.table.status === "cancelled" || found.table.members[found.memberIndex].rsvp !== "yes") return Response.json({ error: "Accept the invitation before adding it to your calendar." }, { status: 409, headers });
    return new Response(dinnerCalendarIcs(found.table), { headers: { ...headers, "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="interaction-dinner.ics"' } });
  } catch { return Response.json({ error: "Unable to create calendar file. Contact your host." }, { status: 503, headers }); }
}
