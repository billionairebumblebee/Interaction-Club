import { listApplications, listTables, requireAdmin } from "@/lib/concierge";
import { suggestGroups, type MatchPlan } from "@/lib/matching";
export async function POST(request: Request) {
  if (!requireAdmin(request)) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try { const plan = await request.json() as MatchPlan; if (!["community-only", "cross-community"].includes(plan.eventScope || "")) return Response.json({ error: "Choose an explicit event scope before suggesting a new group." }, { status: 400 }); const [people, tables] = await Promise.all([listApplications(), listTables()]); return Response.json(suggestGroups(people, tables, plan)); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to form groups." }, { status: 400 }); }
}
