export const MAIN_MOTTO = "We want you at our table.";

/** The invitation follows the actual plan; the homepage stays dinner-focused. */
export function eventMotto(activity?: string): string {
  if (!activity) return MAIN_MOTTO;
  if (/\b(party|afterparty|after-party|dance)\b/i.test(activity)) return "We want you at our party.";
  if (/\b(dinner|lunch|brunch|breakfast|meal|table)\b/i.test(activity)) return MAIN_MOTTO;
  return "We want you at our event.";
}
