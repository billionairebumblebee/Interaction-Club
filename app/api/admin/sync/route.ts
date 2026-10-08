import { requireAdmin, listApplications, listTables } from "@/lib/concierge";
import { queueSheetRecord, retrySheetJobs } from "@/lib/sheets";
export async function POST(request: Request) {
  if (!requireAdmin(request)) return Response.json({ error: "Unauthorized." }, { status: 401 });
  if (!process.env.GOOGLE_SHEETS_WEBHOOK_URL || !process.env.GOOGLE_SHEETS_WEBHOOK_SECRET) return Response.json({ error: "Connect the private Google Sheet webhook and secret first." }, { status: 503 });
  try {
    const body = await request.json();
    if (body.backfill === true) {
      const [responses, groups] = await Promise.all([listApplications(), listTables()]);
      const records = [...responses.map(record => ({ id: record.id, kind: "response" as const, record })), ...groups.map(record => ({ id: record.id, kind: "group" as const, record }))];
      const offset = Number.isInteger(body.offset) && body.offset >= 0 ? body.offset : 0;
      const batch = records.slice(offset, offset + 20); let synced = 0;
      for (const job of batch) if (await queueSheetRecord(job)) synced++;
      return Response.json({ attempted: batch.length, queuedOrSynced: synced, nextOffset: offset + 20 < records.length ? offset + 20 : null });
    }
    return Response.json(await retrySheetJobs());
  } catch { return Response.json({ error: "Sheet sync could not complete. Saved applications remain in the private inbox." }, { status: 503 }); }
}
