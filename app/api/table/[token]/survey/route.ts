import { findTableByToken, readJson, writeRecord } from "@/lib/concierge";
import { surveyWindow, validateSurvey, type SurveyKind, type SurveyRecord } from "@/lib/event-surveys";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
type Context = { params: Promise<{ token: string }> };

export async function GET(_: Request, context: Context) {
  try {
    const { token } = await context.params;
    const found = await findTableByToken(token);
    if (!found) return json({ error: "This invitation is no longer available." }, 404);
    const { table, memberIndex } = found;
    const member = table.members[memberIndex];
    const prefix = `surveys/${table.id}/${member.applicationId}`;
    const [before, after] = await Promise.all([readJson<SurveyRecord>(`${prefix}/before.json`), readJson<SurveyRecord>(`${prefix}/after.json`)]);
    // Only this attendee's answers leave this endpoint. Never expose other guests or concern reports.
    const ownAnswers = (record: SurveyRecord | null) => record ? { questionAnswers: record.questionAnswers, hopes: record.hopes, experience: record.experience, meetAgain: record.meetAgain, connection: record.connection, note: record.note, followUp: record.followUp, submittedAt: record.submittedAt } : null;
    return json({ table: { activity: table.activity, venueName: table.venueName, startsAt: table.startsAt }, available: surveyWindow(table), before: ownAnswers(before), after: ownAnswers(after) });
  } catch { return json({ error: "We couldn’t load your check-in. Please try again." }, 503); }
}

export async function POST(request: Request, context: Context) {
  try {
    const { token } = await context.params;
    const found = await findTableByToken(token);
    if (!found) return json({ error: "This invitation is no longer available." }, 404);
    const raw = await request.text();
    if (raw.length > 12000) return json({ error: "That response is too long." }, 413);
    let body: Record<string, unknown>;
    try { const parsed = JSON.parse(raw); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(); body = parsed; }
    catch { return json({ error: "Please check your response and try again." }, 400); }
    if (!["before", "after", "concern"].includes(body.kind as string)) return json({ error: "Choose a check-in type." }, 400);
    const kind = body.kind as SurveyKind;
    const { table, memberIndex } = found;
    const available = surveyWindow(table);
    if (kind !== "concern" && !available[kind]) return json({ error: kind === "after" ? "The after-event survey opens when the event ends. You can share a concern at any time." : "This before-event check-in has closed." }, 409);
    let answers;
    try { answers = validateSurvey(kind, body); }
    catch (error) { return json({ error: error instanceof Error ? error.message : "Check your answers." }, 400); }
    const applicationId = table.members[memberIndex].applicationId;
    const id = kind === "concern" ? crypto.randomUUID() : `${table.id}-${applicationId}-${kind}`;
    const record: SurveyRecord = { ...answers, id, tableId: table.id, applicationId, kind, submittedAt: new Date().toISOString() };
    // Per-attendee, per-survey records avoid one guest overwriting another guest's answers or RSVP.
    // Concerns are append-only and stay in the private organizer inbox, not the shared response Sheet.
    await writeRecord(`surveys/${table.id}/${applicationId}/${kind === "concern" ? `concern-${id}` : kind}.json`, record);
    return json({ ok: true, submittedAt: record.submittedAt });
  } catch { return json({ error: "Your response wasn’t saved. Please try again." }, 503); }
}
