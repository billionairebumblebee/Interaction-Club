import { createHash, randomBytes } from "node:crypto";
import { getTable, requireAdmin, updatePrivateRecord } from "@/lib/concierge";
export async function POST(request: Request) {
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
  if (!requireAdmin(request)) return json({ error: "Unauthorized." }, 401);
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Use the organizer dashboard." }, 403);
  try {
    const body = await request.json();
    const table = await getTable(typeof body.tableId === "string" ? body.tableId : "");
    if (!table || table.status !== "invited") return json({ error: "Current dinner not found." }, 404);
    if (body.action === "revoke") {
      await updatePrivateRecord(`arrival-host-access/${table.id}.json`, () => ({ keyHash: "", revokedAt: new Date().toISOString() }));
      return json({ revoked: true });
    }
    if (body.action !== "provision" || body.confirmAssignedHost !== true || !table.hostName) return json({ error: "Review and confirm the assigned host before provisioning arrival-only access." }, 400);
    const key = randomBytes(32).toString("hex");
    await updatePrivateRecord(`arrival-host-access/${table.id}.json`, () => ({ keyHash: createHash("sha256").update(key).digest("hex"), createdAt: new Date().toISOString(), hostName: table.hostName }));
    return json({ hostKey: key, hostPage: "/host/arrivals", tableId: table.id, scope: "This dinner’s arrivals and table directions only. No profiles, emails, RSVP changes or verified attendance access." });
  } catch { return json({ error: "Unable to provision host access." }, 503); }
}
