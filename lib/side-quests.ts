export const sideQuestDays = ["Thursday daytime", "Saturday daytime", "Sunday daytime"] as const;

export const sideQuestTransportOptions = [
  { id: "public-transit", label: "Public transit", detail: "Theme-park example: about $35–55 total. Active BayPass holders may have no extra transit fare." },
  { id: "charter-bus", label: "A charter bus with the club", detail: "Theme-park example: about $90–110 total if enough people join. Includes admission + return transport; food extra." },
  { id: "shared-rental", label: "A shared rental car or van", detail: "Price to confirm. We’d need eligible drivers and rentals; choosing this doesn’t volunteer you to drive." },
  { id: "own-transport", label: "I’ll arrange my own ride", detail: "I’ll meet the group there." },
  { id: "other", label: "Something else", detail: "Tell us below." },
] as const;

export function cleanSideQuestTransport(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && sideQuestTransportOptions.some(option => option.id === item)))] : [];
}

export function cleanSideQuestMaxSpend(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 && amount <= 10000 ? amount : null;
}

export function cleanSideQuestDays(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((day): day is string => typeof day === "string" && sideQuestDays.some(option => option === day)))] : [];
}
