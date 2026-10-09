// Proposal only. Never applies a deadline or release rule to an existing dinner.
export function proposeRsvpDeadline(startsAt: string, invitedAt: string) {
  const start = Date.parse(startsAt), invited = Date.parse(invitedAt), hour = 3600000;
  if (!Number.isFinite(start) || !Number.isFinite(invited) || start <= invited) throw new Error("Confirm future invitation and event times.");
  const hours = start - invited <= 48 * hour ? 12 : start - invited <= 7 * 24 * hour ? 24 : 48;
  let deadline = invited + hours * hour;
  const localHour = (time: number) => Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }).format(time));
  const daytimeHours = (until: number) => {
    let minutes = 0;
    for (let cursor = invited; cursor < until; cursor += 15 * 60000) {
      const sample = localHour(cursor + 7 * 60000);
      if (sample >= 9 && sample < 21) minutes += Math.min(15, (until - cursor) / 60000);
    }
    return minutes / 60;
  };
  // Include at least three daytime hours, not merely a 9am deadline after
  // an entirely overnight invitation. This is still an approval-only proposal.
  for (let step = 0; step < 48 && (localHour(deadline) < 9 || localHour(deadline) >= 21 || daytimeHours(deadline) < 3); step++) deadline += hour;
  if (deadline >= start - 3 * hour) return { hours, requiresReview: true, deadline: null, reason: "There is not enough time for the proposed response window and a three-hour expiry reminder. Review a short-notice invitation manually." };
  return { hours, requiresReview: true, deadline: new Date(deadline).toISOString(), reason: "Proposed deadline only. Approve and disclose expiry/release wording before enabling seat release." };
}
