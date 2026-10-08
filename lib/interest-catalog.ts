import { list, put } from "@vercel/blob";
import { cleanInterests, cleanTag, tagKey } from "./interest-tags";

const PREFIX = "interest-tags/";

export async function publishInterestTags(tags: string[]) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  // Separate, label-only index. Never query or expose application records here.
  // Deterministic paths deduplicate concurrent submissions without a shared counter.
  await Promise.all(cleanInterests(tags).map(tag => put(`${PREFIX}${encodeURIComponent(tagKey(tag))}.json`, "{}", {
    access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json",
  })));
}

export async function findCommunityTags(query: string): Promise<string[]> {
  const key = tagKey(query);
  if (!process.env.BLOB_READ_WRITE_TOKEN || key.length < 2 || !cleanTag(key)) return [];
  const result = await list({ prefix: `${PREFIX}${encodeURIComponent(key)}`, limit: 16 });
  return result.blobs.flatMap(blob => {
    try {
      const tag = cleanTag(decodeURIComponent(blob.pathname.slice(PREFIX.length).replace(/\.json$/, "")));
      return tag && tagKey(tag).startsWith(key) ? [tag] : [];
    } catch { return []; }
  });
}
