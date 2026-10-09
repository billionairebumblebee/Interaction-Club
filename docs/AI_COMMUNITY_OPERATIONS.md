# AI-assisted community operations

Operating specification, October 9, 2026. Existing code and external assistant work are distinguished below. This document installs no cron, sends no messages and changes no live event or guest record. Production activation requires separately reviewed configuration and approval.

## Product and responsibility

The consumer gets a personal invitation and a small-group experience. A community buyer gets assistance with the recurring coordination workflow behind it. The current pilot combines a Next.js product, deterministic constraints, durable records, an external AI assistant and a human organizer/host. No integrated model API or fully autonomous event operator is claimed.

AI supports interpretation of optional introductions/interests, group rationale, draft communications, host prompts and feedback synthesis. Deterministic code enforces practical constraints and state transitions. Organizers approve groups, spending, final messages and exceptions; hosts welcome guests, facilitate the actual experience and confirm attendance. Guests make their own RSVP and consent decisions. Measure coordination minutes per dinner before claiming labor savings.

## One event from setup to completion

1. **Configure once.** Set the dinner ID, community scope, named host, date/time with `America/Los_Angeles`, venue and arrival landmark, seat capacity including/excluding host, full expected costs, table constraints, minimum confirmed headcount and a go/no-go decision time. Confirm venue feasibility. Disclose and approve any response deadline/release policy before invitations; do not retrofit it onto old invitations.
2. **Read current opt-in intake.** Use stable member IDs, actual availability/travel/budget/table choices, interests, dietary/access needs and separate capture/publication permissions. Missing constraints require confirmation, not inference. Do not treat a signup as a booked seat.
3. **Propose and review.** Apply hard constraints before conversational fit. Use AI to explain the suggestion and uncertainty; the organizer approves the group and private rationale. Keep a compatible waitlist, not an indiscriminate next-signup list.
4. **Populate the host record before sending.** Put every finalized guest and host in the existing private event tab: member ID, name/contact, relevant interests, availability, invitation/RSVP state, reply deadline, accepted agreements and needs. Add a prominent allergies/dietary and photos panel; show capture and posting separately. Retain source/version/time for consent. Host access is limited to assigned-event operational information; the current arrival-only dashboard does not yet expose this full roster.
5. **Prepare exact invitations.** Generate individual private links with date, location, cost, host and deadline. Review sender, individual recipient, CC/BCC, wording, timing and link before approving a send. The assistant can operate the existing verified Gmail account through the browser and record the sent-message receipt. A separate mail API is optional. Never expose a shared guest list or private tokens in logs. The application's dispatch hook is a separate execution route, not the only way to send.
6. **Process responses at reminder checkpoints.** The website records RSVP actions as they happen. The assistant reconciles current responses into the existing private event view only when a configured reminder/checkpoint is due, rather than repeatedly polling or chasing DMs. Retain prior states and cancellation history. Accepted, declined, pending, released and attended are distinct. Skip unanswered-RSVP nudges for everyone who already responded; attendance and arrival reminders remain relevant to confirmed guests. Re-read live state immediately before an approved send.
7. **Backfill safely.** A decline/cancellation or valid disclosed expiry creates a replacement-preparation task. Check actual capacity and compatible opt-ins; propose one replacement per open seat. Review and approve their exact invitation before sending. Record the new invitation and deadline without deleting the earlier guest. Never reinstate a cancellation or assign an accepted seat merely because a job retried. Automatic backfill and event-tab synchronization are not implemented yet.
8. **Make the go/no-go decision.** At the configured cutoff, assess confirmed guests against the agreed minimum. If insufficient, prepare a proceed/postpone decision and guest notices; the organizer approves before changing commitments. Do not silently cancel an event or rely on repeated personal DMs.
9. **Prepare the host.** Reconcile roster/needs/permissions, provide the table landmark, brief introduction round, optional prompts and payment arrangements. Remind only eligible guests through the documented schedule. A one-hour reminder can link to arrival actions; help is not promised as instantly monitored.
10. **Deliver and learn.** Human host runs the dinner and verifies actual attendance. Capture only permitted photos and uses, record feedback/costs and host work time, and review next-event improvements. A guest pressing “I'm here” is not verified attendance. Share contacts or publish recaps only with appropriate permission.

## Assistant scheduling and application-worker options

A scheduler is a clock, not the source of truth. The assistant operating route uses a scheduled Codex run, the organizer's verified browser accounts and the existing private Sheet. A local event checkpoint register determines whether a run has any due work before external sources are opened. Register a new event's actual start time and disclosed deadline, then align the schedule with its reminder times. For the current 6 PM dinner pattern, the checkpoints are 5 PM for arrival and 6 PM for day-before/two-days-before reminders. A three-hours-before-deadline reminder needs its own matching checkpoint. Do not assume all dinners start at 6 PM, or send a missed reminder retroactively.

At a due checkpoint, make one bounded current-state read, reconcile the private roster, prepare only eligible reminders and assess compatible backups for newly open seats. Review each exact message before sending unless that identical send already has approval. For browser Gmail, retain a stable event/member/reminder key and verify Sent evidence before marking completion. An ambiguous click or missing receipt must not trigger a blind retry. No automatic channel fallback. If no replacement fits before the cutoff, record the open seat and ask for a proceed/postpone decision.

The alternative application-worker route uses authenticated due-job dispatch with approval-digest checks and an idempotent mail provider. It can be added later without redefining the product. Store only necessary data in the private system. Do not put credentials, participant information or invitation tokens in public cron configuration.

Use existing `lib/dinner-reminders.ts` and `/api/admin/reminders` rather than adding a second outbox. Existing jobs cover initial invitations, unanswered-48h, confirmed-24h, arrival-1h and rsvp-expiring-3h. The latter two require advance queueing and a 15-minute dispatch window; missed windows are not retroactive sends. Do not stack every reminder onto short-notice pilots. See [reminder timing, approval and cancellation rules](DINNER_REMINDERS.md).

Keep cancelled/expired/released guests and cancelled events suppressed. Uncertain delivery stays quarantined rather than automatically retrying or falling back to DMs. Changed content/recipient requires renewed approval. Scheduled does not mean sent; sent does not mean delivered or attended.

## Activation checklist

- Choose the assistant/browser route or the application/provider route. Verify sender identity and a reliable sent-receipt/deduplication procedure for the selected route.
- Configure authenticated scheduling and monitoring, timezone-aware deadlines, bounded scans and a clear owner for failures.
- Implement and test event-roster projection, capacity-safe backfill and the approved go/no-go workflow before claiming them as automatic.
- Verify consent/reply deadline disclosure, exact-message approval and cancelled-event handling.
- Test with synthetic recipients, then an explicitly approved internal test; inspect receipts and duplicate suppression.
- Verify no cancelled/released guest receives a pending reminder; no stale replay restores a seat; no guest sees another guest's private data.
- Review the real event and exact sends before activation. No current dinner is changed by this checklist.

## Current verification commands

`node scripts/matching-test.cjs`

`node scripts/reminder-cancellation-test.cjs`

`node scripts/invitation-agreement-test.cjs`

`node scripts/dinner-arrival-test.cjs`

These tests support existing components, not a claim that the unimplemented integrations above have passed end-to-end testing.
