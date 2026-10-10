import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { readJson, writeRecord } from "@/lib/concierge";
import { meetingTokenHash, validateMeeting } from "@/lib/personal-meeting";

export const runtime = "nodejs";
type Meeting = ReturnType<typeof validateMeeting> & { id: string; status: "pending" | "withdrawn"; createdAt: string; tokenHash: string; withdrawnAt?: string };
const headers = { "Cache-Control": "private, no-store" };
function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Open this form on Interaction Club." }, { status: 403, headers });
  if (Number(request.headers.get("content-length")) > 16000) return Response.json({ error: "Request too large." }, { status: 413, headers });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ error: "Meeting requests aren’t connected here yet. Nothing has been booked or saved." }, { status: 503, headers });
  let data;
  try {
    const raw = await request.text();
    if (raw.length > 16000) throw new Error("Request too large.");
    const body = JSON.parse(raw);
    if (body.website) throw new Error("Unable to send this request.");
    data = validateMeeting(body);
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Check your answers." }, { status: 400, headers }); }
  const id = randomUUID(), token = randomBytes(32).toString("hex");
  try {
    await writeRecord(`personal-meetings/${id}.json`, { ...data, id, status: "pending", createdAt: new Date().toISOString(), tokenHash: meetingTokenHash(token) } satisfies Meeting);
    return Response.json({ id, token, status: "pending" }, { status: 201, headers });
  } catch { return Response.json({ error: "We couldn’t save your request. Please try again. Nothing is booked." }, { status: 503, headers }); }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Open your private request link." }, { status: 403, headers });
  try {
    const { id, token } = await request.json();
    if (!/^[a-f0-9-]{36}$/.test(id) || !/^[a-f0-9]{64}$/.test(token)) throw new Error();
    const path = `personal-meetings/${id}.json`, record = await readJson<Meeting>(path);
    if (!record || !timingSafeEqual(Buffer.from(record.tokenHash, "hex"), Buffer.from(meetingTokenHash(token), "hex"))) throw new Error();
    await writeRecord(path, { ...record, status: "withdrawn", withdrawnAt: new Date().toISOString() });
    return Response.json({ status: "withdrawn" }, { headers });
  } catch { return Response.json({ error: "Couldn’t withdraw this request. Check the private link and try again." }, { status: 400, headers }); }
}
