export const MAX_INTERESTS = 5;
export const MAX_TAG_LENGTH = 40;
export const starterInterests = [
  "AI agents", "Vibe coding", "Tools for everyday life", "Mechanical engineering",
  "Physical products", "Experiments", "Consumer products", "Current events",
  "Entrepreneurship", "Content creation", "Makeup", "Product reviews", "Marketing",
  "Thoughtful dinners", "Community building", "Interesting conversations",
  "Side hustles", "Silly side quests", "Founder LARP",
  "Builders", "Art", "Anime + games", "Deep talk", "Food people", "Music", "Books", "New in town",
];
export const featuredInterests = ["AI agents", "Art", "Makeup", "Thoughtful dinners", "Music", "Silly side quests"];

export function tagKey(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export function cleanTag(value: unknown): string {
  if (typeof value !== "string") return "";
  const label = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  // Tags are short interest labels, never contact details, links, or sentences.
  if (label.length < 2 || label.length > MAX_TAG_LENGTH || !/\p{L}/u.test(label)) return "";
  if (!/^[\p{L}\p{N} &'’+#().-]+$/u.test(label) || /\d{5}|https?|www\.|\.(com|org|net|edu)\b/i.test(label)) return "";
  return starterInterests.find(tag => tagKey(tag) === tagKey(label)) || label;
}

export function cleanInterests(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const tags = new Map<string, string>();
  for (const item of value) {
    const tag = cleanTag(item);
    if (tag && !tags.has(tagKey(tag))) tags.set(tagKey(tag), tag);
    if (tags.size === MAX_INTERESTS) break;
  }
  return [...tags.values()];
}

export function suggestInterests(query: string, extra: string[] = [], selected: string[] = []) {
  const key = tagKey(query);
  const excluded = new Set(selected.map(tagKey));
  const candidates = new Map<string, string>();
  for (const label of [...(key ? starterInterests : featuredInterests), ...extra]) {
    const tag = cleanTag(label);
    if (tag && !excluded.has(tagKey(tag)) && (!key || tagKey(tag).includes(key))) candidates.set(tagKey(tag), tag);
  }
  return [...candidates.values()].sort((a, b) => Number(tagKey(b).startsWith(key)) - Number(tagKey(a).startsWith(key))).slice(0, 8);
}
