import { getTable, readJson, requireAdmin, updateMember, updatePrivateRecord } from "@/lib/concierge";
import { getArrivalPlan, requireArrivalHost, type ArrivalPlan } from "@/lib/arrival-host";
import { arrivalEligible, ARRIVAL_POLL_MS, respondToArrivalHelp } from "@/lib/dinner-arrival";
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store", "Vary": "x-interaction-host-key, x-interaction-admin-key" } });
async function authorized(request: Request, id: string) {
  return requireAdmin(request) || await requireArrivalHost(request, id);
}
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("tableId") || "";
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(id)) return json({ error: "Invalid dinner." }, 400);
  try {
    if (!await authorized(request, id)) return json({ error: "Unauthorized." }, 401);
    const table = await getTable(id);
    if (!table || table.status !== "invited" || Date.now() > Date.parse(table.endsAt || table.startsAt) + 3 * 3600000) return json({ error: "No current dinner." }, 404);
    const guests = await Promise.all(table.members.filter(member => member.rsvp === "yes" && !member.cancellation && !member.seatReleasedAt && member.attendance !== "cancelled" && (!member.expiresAt || Date.parse(member.expiresAt) > Date.now())).map(async member => {
      const person = await readJson<{ fullName: string }>(`applications/${member.applicationId}.json`);
      return { id: member.applicationId, name: person?.fullName.split(/\s+/)[0] || "Guest", arrival: member.arrival, help: member.arrivalHelp, arrivalAvailable: arrivalEligible(table, member) };
    }));
    return json({ tableId: id, hostName: table.hostName, venueName: table.venueName, venueAddress: table.venueAddress, startsAt: table.startsAt, plan: await getArrivalPlan(table), guests, pollMs: ARRIVAL_POLL_MS, liveAlertsEnabled: false });
  } catch { return json({ error: "Unable to refresh arrivals." }, 503); }
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Use the Interaction Club host dashboard." }, 403);
  try {
    const body = await request.json();
    const id = typeof body.tableId === "string" ? body.tableId : "";
    if (!/^[a-zA-Z0-9-]{1,100}$/.test(id) || !await authorized(request, id)) return json({ error: "Unauthorized." }, 401);
    const table = await getTable(id);
    if (!table || table.status !== "invited" || Date.now() > Date.parse(table.endsAt || table.startsAt) + 3 * 3600000) return json({ error: "No current dinner." }, 404);
    if (body.action === "directions") {
      if (typeof body.landmark !== "string" || !body.landmark.trim() || body.landmark.length > 400) return json({ error: "Add a brief table landmark. No names, contacts or private guest details." }, 400);
      const plan = await updatePrivateRecord<ArrivalPlan>(`arrival-plans/${id}.json`, current => ({ hostName: table.hostName || current?.hostName || "Assigned host", landmark: body.landmark.trim(), updatedAt: new Date().toISOString() }));
      return json({ plan });
    }
    if (body.action !== "respond" || typeof body.applicationId !== "string") return json({ error: "Unsupported host action." }, 400);
    const member = await updateMember(id, body.applicationId, (current, liveTable) => respondToArrivalHelp(liveTable, current, body.requestId, body.response));
    return json({ help: member.arrivalHelp });
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Unable to save host response." }, 400); }
}
