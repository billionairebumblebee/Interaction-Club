export const availabilityDays = [
  { short: "Sun", name: "Sunday" }, { short: "Mon", name: "Monday" },
  { short: "Tue", name: "Tuesday" }, { short: "Wed", name: "Wednesday" },
  { short: "Thu", name: "Thursday" }, { short: "Fri", name: "Friday" },
  { short: "Sat", name: "Saturday" },
] as const;

export const mealWindows = [
  { id: "breakfast", name: "Breakfast", hours: "8–11 AM", start: 8, end: 11 },
  { id: "lunch", name: "Lunch", hours: "12–3 PM", start: 12, end: 15 },
  { id: "dinner", name: "Dinner", hours: "6–8 PM", start: 18, end: 20 },
] as const;

export const availabilitySlots = availabilityDays.flatMap(day => mealWindows.map(meal => `${day.short} ${meal.id}`));
export const pilotAvailabilitySlots = availabilityDays.map(day => `${day.short} dinner`);

export function normalizeAvailabilitySlot(value: unknown): string | null {
  if (typeof value !== "string") return null;
  // Preserve older submissions without widening their original availability.
  const slot = value.replace(/^(Fri|Sat|Sun) afternoon$/, "$1 lunch").replace(/^(Fri|Sat|Sun) evening$/, "$1 dinner");
  return availabilitySlots.includes(slot) ? slot : null;
}

export function cleanAvailability(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(normalizeAvailabilitySlot).filter((slot): slot is string => slot !== null))];
}
