import { cleanAvailability } from "./availability";
import { cleanPilotDinners } from "./pilot-week";

export const AVAILABILITY_REQUIRED = "Pick at least one dinner this week or a usual time for a future plan.";

// Both signup paths share this rule. Being busy this week is fine; a future
// time must still be selected explicitly. Neither opt-ins nor travel are times.
export function hasSignupAvailability(value: { availability?: unknown; pilotDinnerDates?: unknown }) {
  return cleanAvailability(value.availability).length > 0 || cleanPilotDinners(value.pilotDinnerDates).length > 0;
}
