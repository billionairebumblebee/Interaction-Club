export const PILOT_WEEK = { startsOn: "2026-10-06", endsOn: "2026-10-10", label: "Oct 6–10" } as const;
export const PILOT_DINNERS = [
  { id: "2026-10-08", label: "Thursday, Oct 8 · 6–8 p.m." },
  { id: "2026-10-09", label: "Friday, Oct 9 · 6–8 p.m." },
] as const;

export function cleanPilotDinners(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((date): date is string => typeof date === "string" && PILOT_DINNERS.some(dinner => dinner.id === date)))] : [];
}

function localDinnerTime(startsAt: string) {
  const start = new Date(startsAt);
  return {
    date: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(start),
    time: new Intl.DateTimeFormat("en-GB", { timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(start),
  };
}

export function hasDatedDinnerSelection(person: object, startsAt: string) {
  const { date } = localDinnerTime(startsAt);
  const answer = (person as { pilotWeekAvailability?: { dinnerDates?: unknown } }).pilotWeekAvailability;
  return date >= PILOT_WEEK.startsOn && date <= PILOT_WEEK.endsOn && Array.isArray(answer?.dinnerDates);
}

export function pilotWeekProblem(person: object, startsAt: string) {
  const { date, time } = localDinnerTime(startsAt);
  if (date < PILOT_WEEK.startsOn || date > PILOT_WEEK.endsOn) return "";
  const answer = (person as { pilotWeekAvailability?: { startsOn?: string; endsOn?: string; available?: boolean; dinnerDates?: unknown } }).pilotWeekAvailability;
  if (!answer || answer.startsOn !== PILOT_WEEK.startsOn || answer.endsOn !== PILOT_WEEK.endsOn) return "Confirm availability for Oct 6–10";
  if (!Array.isArray(answer.dinnerDates)) return answer.available ? "Confirm Thursday or Friday, 6–8 p.m. availability" : "Unavailable Oct 6–10; keep for later invitations";
  if (!PILOT_DINNERS.some(dinner => dinner.id === date) || time !== "18:00") return "This week's dinners are Thursday or Friday, 6–8 p.m. Pacific";
  return cleanPilotDinners(answer.dinnerDates).includes(date) ? "" : "Unavailable for this dinner; keep for later invitations";
}
