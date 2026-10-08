export type Intent = "Builder / founder" | "Chill / social" | "Open to either";
export type Guest = { id: string; name: string; discipline: string; intent: Intent; slots: string[]; status: "interested" | "confirmed" | "declined" | "overflow"; attended: boolean; reconnect: boolean };
export const slots = ["Wed evening", "Thu evening", "Fri evening", "Sat afternoon", "Sat evening", "Sun afternoon", "Sun evening"];
export const intents: Intent[] = ["Builder / founder", "Chill / social", "Open to either"];
export const demoGuests: Guest[] = [
  { id: "sample-1", name: "Sample guest A", discipline: "Engineering", intent: "Builder / founder", slots: ["Fri evening"], status: "interested", attended: false, reconnect: false },
  { id: "sample-2", name: "Sample guest B", discipline: "Design", intent: "Builder / founder", slots: ["Fri evening", "Sat evening"], status: "interested", attended: false, reconnect: false },
  { id: "sample-3", name: "Sample guest C", discipline: "Climate", intent: "Open to either", slots: ["Fri evening"], status: "interested", attended: false, reconnect: false },
  { id: "sample-4", name: "Sample guest D", discipline: "Art", intent: "Chill / social", slots: ["Sat evening"], status: "interested", attended: false, reconnect: false },
];
export function compatibleGuests(guests: Guest[], intent: Intent, availability: string[]) {
  return guests.filter((guest) => guest.status !== "declined" && guest.status !== "overflow" && (intent === "Open to either" || guest.intent === "Open to either" || guest.intent === intent) && guest.slots.some((slot) => availability.includes(slot)));
}
export type PreviewPlan = { venue: string; time: string; cost: string; funded: boolean; capacity: number | null };
export const emptyPlan: PreviewPlan = { venue: "", time: "", cost: "", funded: false, capacity: null };
export const previewKey = "interaction-review-v1";
