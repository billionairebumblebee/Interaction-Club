import { readPrefix, requireAdmin } from "@/lib/concierge";
import type { SurveyRecord } from "@/lib/event-surveys";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!requireAdmin(request)) return Response.json({ error: "Unauthorized." }, { status: 401, headers });
  try {
    const surveys = (await readPrefix<SurveyRecord>("surveys/")).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    return Response.json({ surveys }, { headers });
  } catch { return Response.json({ error: "Unable to load private feedback. Please try again." }, { status: 503, headers }); }
}
