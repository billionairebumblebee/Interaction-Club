import { findCommunityTags } from "@/lib/interest-catalog";
import { MAX_TAG_LENGTH, suggestInterests } from "@/lib/interest-tags";

export async function GET(request: Request) {
  const query = (new URL(request.url).searchParams.get("q") || "").slice(0, MAX_TAG_LENGTH);
  let community: string[] = [];
  try { community = await findCommunityTags(query); } catch { /* Starter suggestions still work. */ }
  return Response.json({ tags: suggestInterests(query, community) }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
