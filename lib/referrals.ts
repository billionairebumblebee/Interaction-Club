import { get, put } from "@vercel/blob";
import { getInviter } from "./inviters";

export type Referrer = { slug: string; name: string };
const reserved = new Set(["about", "admin", "api", "data", "faq", "how-it-works", "investors", "join", "philosophy", "preview", "privacy", "safety", "share", "sponsors", "table", "terms", "host-preview", "vivian", "mox", "memories", "scrapbook"]);
export function referralSlug(value: unknown) {
  if (typeof value !== "string") return "";
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40).replace(/-$/g, "");
}
export function validReferralSlug(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,47}$/.test(value) && !reserved.has(value);
}
export async function resolveInviter(value: unknown): Promise<Referrer | null> {
  const known = getInviter(value);
  if (known) return known;
  if (typeof value !== "string" || !validReferralSlug(value.toLowerCase()) || !process.env.BLOB_READ_WRITE_TOKEN) return null;
  const slug = value.toLowerCase();
  const blob = await get(`referrers/${slug}.json`, { access: "private", useCache: false });
  if (!blob?.stream) return null;
  const record = await new Response(blob.stream).json();
  return record.slug === slug && typeof record.name === "string" ? { slug, name: record.name } : null;
}
export async function createReferrer(name: string, desiredSlug: string): Promise<Referrer> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = attempt === 0 ? desiredSlug : `${desiredSlug.slice(0, 34)}-${crypto.randomUUID().slice(0, 8)}`;
    if (await resolveInviter(slug)) continue;
    try {
      await put(`referrers/${slug}.json`, JSON.stringify({ slug, name, createdAt: new Date().toISOString() }), { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json" });
      return { slug, name };
    } catch (error) {
      if (await resolveInviter(slug)) continue;
      throw error;
    }
  }
  throw new Error("Please try another link name.");
}

export function referralCounts(records: { invitedBy?: string | null; email: string }[]) {
  const groups = new Map<string, Set<string>>();
  for (const record of records) {
    if (!record.invitedBy) continue;
    const people = groups.get(record.invitedBy) || new Set<string>();
    people.add(record.email.trim().toLowerCase());
    groups.set(record.invitedBy, people);
  }
  return [...groups].map(([slug, people]) => ({ slug, signups: people.size })).sort((a, b) => b.signups - a.signups || a.slug.localeCompare(b.slug));
}
