import { listApplications, listTables, readPrefix, requireAdmin } from "@/lib/concierge";
import { approveReminder, getReminder, queueReminder, releaseUnconfirmedSeat, reminderDraft, reminderEligible, type ReminderJob, type ReminderKind } from "@/lib/dinner-reminders";
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
export async function GET(request: Request) {
  if (!requireAdmin(request)) return json({ error: "Unauthorized." }, 401);
  try { return json({ jobs: await readPrefix<ReminderJob>("reminder-outbox/"), sendingEnabled: false }); }
  catch { return json({ error: "Unable to load reminder drafts." }, 503); }
}
export async function POST(request: Request) {
  if (!requireAdmin(request)) return json({ error: "Unauthorized." }, 401);
  try {
    const body = await request.json();
    const [tables, applications] = await Promise.all([listTables(), listApplications()]);
    const table = tables.find(item => item.id === body.tableId);
    const member = table?.members.find(item => item.applicationId === body.applicationId);
    const application = applications.find(item => item.id === body.applicationId);
    if (!table || !member || !application) return json({ error: "Invitation not found." }, 404);
    if (body.action === "release") return json({ member: await releaseUnconfirmedSeat(table.id, member.applicationId) });
    if (body.action === "approve") {
      const job = await getReminder(body.id);
      if (!job || job.tableId !== table.id || job.applicationId !== member.applicationId) return json({ error: "Reminder not found." }, 404);
      const draft = reminderDraft(table, member, application, job.kind);
      if (draft.digest !== body.digest || !reminderEligible(table, member, job.kind)) return json({ error: "Review the current recipient, message and RSVP status before approving." }, 409);
      return json({ job: await approveReminder(job.id, draft.digest, application), sendingEnabled: false });
    }
    const kind = body.kind as ReminderKind;
    if (body.action !== "queue" || !["invitation", "unanswered-48h", "confirmed-24h", "arrival-1h", "rsvp-expiring-3h"].includes(kind)) return json({ error: "Unsupported reminder action." }, 400);
    const job = await queueReminder(table, member, kind);
    return json({ job, draft: reminderDraft(table, member, application, kind), eligibleNow: reminderEligible(table, member, kind), sendingEnabled: false });
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Unable to prepare reminders." }, 400); }
}
