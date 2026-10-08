import { listApplications, requireAdmin } from "@/lib/concierge";
import { referralCounts, resolveInviter } from "@/lib/referrals";

export async function GET(request: Request) {
  if (!requireAdmin(request)) return Response.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const records = await listApplications();
    const counts = referralCounts(records);
    const referrals = await Promise.all(counts.map(async count => ({ ...count, name: (await resolveInviter(count.slug))?.name || count.slug })));
    return Response.json({ referrals, definition: "Unique email addresses with completed signups attributed to each invitation link. Not visits, attendance, or verified personal relationships." }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Couldn’t load referral counts." }, { status: 503 }); }
}
