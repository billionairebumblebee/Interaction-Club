import { listApplications, listTables, requireAdmin, reserveDinnerId, saveTable, type TableRecord } from "@/lib/concierge";
import { scheduledTimesValid } from "@/lib/dinner-invitation";
import { eligible, groupProblem, planProblem, type MatchPlan } from "@/lib/matching";
import { queueSheetRecord } from "@/lib/sheets";
import { cleanHostContactEmail } from "@/lib/host-contact";

export async function GET(request: Request) {
  if (!requireAdmin(request)) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try { const [applications, tables] = await Promise.all([listApplications(), listTables()]); return Response.json({ applications, tables, sheetsConfigured: Boolean(process.env.GOOGLE_SHEETS_WEBHOOK_URL && process.env.GOOGLE_SHEETS_WEBHOOK_SECRET) }); }
  catch { return Response.json({ error: "Unable to load the private inbox." }, { status: 503 }); }
}
export async function POST(request: Request) {
  if (!requireAdmin(request)) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const body = await request.json();
    const plan = body as MatchPlan;
    if (!["photography", "photo-free"].includes(plan.photoMode || "")) return Response.json({ error: "Choose photography or a photo-free dinner before inviting guests." }, { status: 400 });
    if (!["community-only", "cross-community"].includes(plan.eventScope || "")) return Response.json({ error: "Choose an explicit event scope before creating a new dinner." }, { status: 400 });
    const hostContactEmail = cleanHostContactEmail(body.hostContactEmail);
    if (!hostContactEmail) return Response.json({ error: "Add a monitored host email so guests can reach you from their invitation." }, { status: 400 });
    const problem = planProblem(plan); if (problem) return Response.json({ error: problem }, { status: 400 });
    const text = (key: string, max = 300) => typeof body[key] === "string" ? body[key].trim().slice(0,max) : "";
    const venueName = text("venueName"), venueAddress = text("venueAddress"), hostName = text("hostName",80);
    const costDetails = text("costDetails"), sponsorDisclosure = text("sponsorDisclosure"), venueNotes = text("venueNotes",600), dressCode = text("dressCode",120);
    const endsAt = text("endsAt",40), responseDeadline = text("responseDeadline",40);
    const rationale = text("matchingRationale",1000), theme = text("theme",120);
    if (body.hostApproved !== true || !rationale) return Response.json({ error: "Review the proposed group and record your matching rationale before creating invitations." }, { status: 400 });
    if (!scheduledTimesValid(plan.startsAt, endsAt)) return Response.json({ error: "Confirm start and end times with an explicit timezone." }, { status: 400 });
    if (!venueName || !venueAddress || !costDetails || !sponsorDisclosure || !venueNotes || typeof body.hosted !== "boolean" || (body.hosted && !hostName) || !(new Date(endsAt) > new Date(plan.startsAt)) || !(new Date(responseDeadline) > new Date() && new Date(responseDeadline) < new Date(plan.startsAt)) || body.venueReviewed !== true) return Response.json({ error: "Finish the invitation details and confirm the venue, dietary/accessibility review, full cost, and response deadline." }, { status: 400 });
    const ids: string[] = Array.isArray(body.memberIds) ? [...new Set<string>(body.memberIds.filter((id: unknown): id is string => typeof id === "string"))] : [];
    const [applications,tables] = await Promise.all([listApplications(), listTables()]);
    const people = ids.map(id=>applications.find(p=>p.id===id));
    if (people.some(p=>!p)) return Response.json({error:"A selected response no longer exists."},{status:400});
    const selected = people.filter(p=>p!==undefined);
    for (const person of selected) { const reason = eligible(person,plan,tables); if (reason) return Response.json({error:person.fullName+": "+reason},{status:400}); }
    const groupError = groupProblem(selected,plan); if (groupError) return Response.json({error:groupError},{status:400});
    const id = crypto.randomUUID();
    const dinnerId = await reserveDinnerId(id);
    const table: TableRecord = { id, status:"invited", activity:plan.activity, intent:plan.intent, format:plan.format, cost:plan.cost, costDetails, venueName, venueAddress, venueArea:"Berkeley", startsAt:plan.startsAt, endsAt, responseDeadline, hosted:body.hosted, hostName:body.hosted?hostName:undefined, sponsorDisclosure, venueNotes, dressCode, createdAt:new Date().toISOString(), members:ids.map(applicationId=>({applicationId,token:crypto.randomUUID(),rsvp:"pending",attendance:"unknown"})) };
    table.venueArea = plan.venueArea || "Berkeley";
    table.photoMode = plan.photoMode;
    table.eventScope = plan.eventScope;
    table.community = plan.eventScope === "community-only" ? plan.community : undefined;
    if (plan.eventScope === "community-only" && plan.community?.trim().toLowerCase() === "mox") table.communityPilotAgreement = { organization: "Mox", confirmedBy: "organizer", confirmedAt: new Date().toISOString() };
    table.hostContactEmail = hostContactEmail;
    table.dinnerId = dinnerId;
    table.theme = theme || plan.intent;
    table.hostReview = { approvedAt: new Date().toISOString(), rationale, aiAssisted: body.aiAssisted === true };
    table.members = table.members.map(member => ({ ...member, expiresAt: new Date(Date.parse(endsAt) + 30 * 24 * 60 * 60 * 1000).toISOString() }));
    await saveTable(table);
    let sheetStatus = "pending"; try { sheetStatus = await queueSheetRecord({id,kind:"group",record:table}); } catch { /* Durable table can be backfilled. */ }
    return Response.json({table,sheetStatus},{status:201});
  } catch { return Response.json({error:"Unable to create this plan. Check its details and try again."},{status:503}); }
}
