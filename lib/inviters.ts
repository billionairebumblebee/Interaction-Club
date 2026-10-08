// Only publish invitation pages for people who have agreed to invite guests.
export const inviters: Record<string, { name: string }> = {
  vivian: { name: "Vivian" },
};

export function getInviter(slug: unknown) {
  if (typeof slug !== "string") return null;
  const key = slug.toLowerCase();
  return Object.hasOwn(inviters, key) ? { slug: key, ...inviters[key] } : null;
}
