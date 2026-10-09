# Dinner RSVP and reminder workflow

Updated October 8, 2026. Preparation and safeguards are implemented; no email provider, cron, automatic sends, or new guest outreach is enabled.

## Timing and status

1. Aim to send the initial invitation seven days before the event, with a clear RSVP deadline. Short-notice pilots can be sent manually after review; never pretend they received a week's notice.
2. About 48 hours before, remind only unanswered guests who already received an invitation and whose RSVP deadline has not passed. Do not send this reminder in the final 24 hours as another nudge.
3. About 24 hours before, remind only confirmed guests. The **Need to cancel?** button opens their own private invitation. Canceled, declined, expired, released, or canceled-event invitations are suppressed.
4. Re-read the guest, event, and recipient immediately before sending. Never use an old Sheet export as send authority. No extra DM/text reminder or channel fallback.

October 8 web implementation: `arrival-1h` prepares a confirmed-guest reminder with a private deep link to arrival actions and RSVP management. `rsvp-expiring-3h` prepares a pending-guest reminder three hours before an explicit deadline. Both must be queued before their due time and dispatched only within a 15-minute due window, with exact-message approval, a previously sent invitation, and fresh eligibility. No retroactive catch-up sends. Stable event/member/type IDs deduplicate each kind. Reminder sending remains disabled. No 15-minute nudge has been enabled.

The proposed 12-hour response window for events within 48 hours, 24 hours within seven days, and 48 hours farther ahead is a review-only helper in `lib/rsvp-deadline-proposal.ts`. It extends overnight deadlines into daytime, or returns manual review if insufficient time remains. It changes no current event or release rule. Expiry/release wording and disclosure still require approval under the policy below. Waitlist replacement remains manually reviewed against actual capacity and matching constraints, never assumed.

## Cancellation policy already in force

Policy `2026-10-05-v1`: two unexcused cancellations made less than 24 hours before start, within 90 days, lower matching priority. Exactly 24 hours is timely. Declining before acceptance does not count; emergency/mistake review remains available. There is no cancellation fee or new financial consequence.

Mention a consequence only with recorded prior disclosure/acceptance (`policyAcceptedAt`). New cancellations without that evidence are recorded with `penaltyApplicable: false`. Do not rewrite old declines, add penalties retroactively, or infer attendance from missing taps.

Confirmed guests can cancel. Guest self-service cancellation is terminal: old links, replayed API requests, and concurrent stale Yes requests cannot restore the seat. Organizer reinstatement requires authenticated action, explicit seat review, a reason, and a valid event/deadline; it returns the invitation to **pending**, not confirmed. Prior cancellation and RSVP history are retained. Excusing a cancellation is not reinstatement.

## Unconfirmed seats

The existing RSVP deadline blocks late self-service confirmation. Seat release itself additionally requires `deadlineRelease.approvedAt`, `deadlineRelease.disclosedAt`, and the approved text on the event. No release rule was added to existing dinners. The release action preserves a pending guest's RSVP/decline history and records `seatReleasedAt`; no automatic replacement is selected.

Before enabling a release rule for a new event, Vivian must approve its exact wording, it must appear in the actual initial invitation, and its disclosure must be recorded. The app does not invent or automatically enable this rule. Reinstatement never guarantees a place.

## Private queue and approval

Authenticated `/api/admin/reminders` supports listing jobs and preparing/approving drafts. Its response explicitly says `sendingEnabled: false`. One durable job per event + member + reminder type, independent of channel, prevents repeat outreach. Queue creation uses conditional create; updates use ETag compare-and-set retries. Participant writes use the same conditional-write boundary, re-evaluating the action on current state after a conflict.

Review the complete draft, recipient, sender, CC/BCC, private link and timing with Vivian before approving its digest. Templates default to Berkeley sender, the individual guest in BCC, and `vivian@interaction.club` in CC. Do not bulk-send a shared private link. Approval is invalid if recipient or message changes.

`dispatchReminder` is an integration hook, not an installed mail sender. A future authorized worker must use an email provider with idempotency-key support and this hook, not send queue drafts directly. It atomically claims the job, immediately rechecks live state/message, then hands off to the provider. A cancellation after provider handoff cannot recall an email already in flight. Delivery uncertainty is quarantined as `delivery-unknown`; do not retry or switch channels until an organizer verifies delivery. A crashed `dispatching` job likewise needs review, not automatic lease recovery.

No current guest list or canceled names is stored in this public document. All actual recipient/status checks stay in the private inbox.

## Verification

Run `node scripts/reminder-cancellation-test.cjs` and `node scripts/invitation-agreement-test.cjs`. Tests use synthetic storage and an email spy only; they do not change live RSVPs or send mail.
