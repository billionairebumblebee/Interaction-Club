import { get, list, del } from "@vercel/blob";
import { writeRecord } from "./concierge";
import { photoConsentSummary } from "./photo-consent";
import { invitationAgreementComplete } from "./invitation-agreement";
export type SheetJob = { id: string; kind: "response" | "group"; record: Record<string, unknown> };
export async function deliverSheetJob(job: SheetJob) {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL, secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
  if (!url || !secret) {
    console.error("Sheet delivery pending: connection is not configured", { id: job.id, kind: job.kind });
    return false;
  }
  try {
    // Mirror exact choices in the existing availability column without changing
    // the private record or requiring broader spreadsheet permissions.
    const week = job.record.pilotWeekAvailability as { dinnerDates?: unknown } | undefined;
    const mirrorAvailability = Array.isArray(job.record.availability) ? [...job.record.availability] : [];
    if (Array.isArray(week?.dinnerDates)) mirrorAvailability.push(...week.dinnerDates.map(date => `This week: ${date}, 6–8 p.m. Pacific`));
    if (Array.isArray(job.record.sideQuestDays)) mirrorAvailability.push(...job.record.sideQuestDays.map(day => `Side quest: ${day}`));
    if (job.record.sideQuestInvitations === true) mirrorAvailability.push("Side-quest invitations: opted in, even outside usual availability");
    if (Array.isArray(job.record.sideQuestTransport) && job.record.sideQuestTransport.length) mirrorAvailability.push(`Side-quest transport: ${job.record.sideQuestTransport.join(", ")}`);
    if (typeof job.record.sideQuestMaxSpend === "number") mirrorAvailability.push(`Side-quest maximum total budget: $${job.record.sideQuestMaxSpend}`);
    if (typeof job.record.sideQuestTransportOther === "string" && job.record.sideQuestTransportOther) mirrorAvailability.push(`Side-quest transport idea: ${job.record.sideQuestTransportOther}`);
    if (job.record.willingToTravelToBerkeley === true) mirrorAvailability.push("Willing to travel to Berkeley: yes, subject to the invitation");
    const yapperNote = job.record.yapper || job.record.yapperContext ? `Yapper: ${job.record.yapper || "No choice selected"}${job.record.yapperContext ? ` (${job.record.yapperContext})` : ""}` : "";
    const record = job.kind === "response" ? {
      ...job.record,
      availability: mirrorAvailability,
      // Existing blurb column also carries the optional quest idea.
      discipline: [job.record.discipline, job.record.pronouns ? `Pronouns for addressing / possible future place cards: ${job.record.pronouns}` : "", yapperNote, job.record.diningHallPreference ? `Dining hall preference: ${job.record.diningHallPreference}` : "", job.record.diningHallContext ? `Dining hall context: ${job.record.diningHallContext}` : "", job.record.dinnerSideQuest ? `Dinner side quest: ${job.record.dinnerSideQuest}` : "", job.record.currentRabbitHole ? `Current rabbit hole: ${job.record.currentRabbitHole}` : "", job.record.tenMinuteTopic ? `Ten-minute topic: ${job.record.tenMinuteTopic}` : "", job.record.meetAgainSpark ? `Would want to meet again for: ${job.record.meetAgainSpark}` : "", job.record.sideQuestIdea ? `Side quest idea: ${job.record.sideQuestIdea}` : "", job.record.comments ? `Comments: ${job.record.comments}` : "", job.record.hackathonGroupOptIn === true ? "Innovation Intelligence Hackathon: wants to meet other hackathon participants" : ""].filter(Boolean).join("\n"),
    } : job.record;
    if (job.kind === "response") record.discipline = [record.discipline, photoConsentSummary(job.record.photoConsent)].filter(Boolean).join("\n");
    const terms = job.record.termsAcceptance as { version?: unknown; acceptedAt?: unknown } | undefined;
    if (job.kind === "response" && typeof terms?.version === "string" && typeof terms.acceptedAt === "string") record.discipline += `\nParticipation terms accepted: ${terms.version}; ${terms.acceptedAt}`;
    if (job.kind === "group" && Array.isArray(job.record.members)) {
      record.members = job.record.members.map((value: Record<string, unknown>) => ({ ...value,
        rsvp: `${value.rsvp}; agreements ${invitationAgreementComplete(value) ? "accepted" : "REQUIRED"}; ${photoConsentSummary(value.photoConsent)}; terms ${JSON.stringify(value.termsAcceptance || null)}${value.decline ? `; decline ${JSON.stringify(value.decline)}` : ""}`,
      }));
    }
    // Apps Script cold starts can exceed 12 seconds even after the row is written.
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ secret, ...job, record }), signal: AbortSignal.timeout(25000) });
    const result = await response.json();
    const delivered = response.ok && result.ok === true && result.id === job.id;
    if (!delivered) console.error("Sheet delivery pending: no matching acknowledgment", { id: job.id, kind: job.kind, status: response.status });
    return delivered;
  } catch {
    console.error("Sheet delivery pending: webhook request failed", { id: job.id, kind: job.kind });
    return false;
  }
}
export async function queueSheetRecord(job: SheetJob) {
  const path = `sheet-outbox/${job.kind}/${job.id}.json`;
  await writeRecord(path, job);
  if (!(await deliverSheetJob(job))) return "pending";
  await del(path); return "synced";
}
export async function retrySheetJobs() {
  const { blobs, hasMore } = await list({ prefix: "sheet-outbox/", limit: 30 });
  let synced = 0;
  for (const blob of blobs) {
    const data = await get(blob.pathname, { access: "private", useCache: false });
    if (!data?.stream) continue;
    const job = await new Response(data.stream).json() as SheetJob;
    if (await deliverSheetJob(job)) { await del(blob.pathname); synced++; }
  }
  return { attempted: blobs.length, synced, pendingInBatch: blobs.length - synced, hasMore };
}
