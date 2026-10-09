# Dinner-day arrivals

October 8, 2026. Web implementation tested with synthetic records and approved for publication. No real notifications, host credentials, permissions, RSVP changes, or invitations created. Reminder sending remains disabled.

## Guest experience

Existing private token invitations and name/session dinner pages share the arrival panel in the existing RSVP component. Confirmed guests with current agreements can save **I’m on my way**, **I’m here**, **I’m running late** with an optional 0–180 minute ETA, or **Can’t find the table**. Manage my RSVP points back to the existing cancellation controls and policy.

Arrival updates open two hours before start and end with the dinner. I’m here opens 30 minutes before start. Cancelled, declined, released, expired, draft, completed and ended invitations cannot submit arrival updates. Every write re-evaluates current participant state inside the existing ETag compare-and-set boundary. Nothing restores or changes an RSVP.

Arrival and timestamps are self-reports. Neither these actions nor the legacy guest check-in endpoint marks attendance as verified. An organizer must separately review attendance. Existing historic attendance records are untouched. No GPS tracking is added.

Guests see only their own status/help reply, assigned host name, exact venue/address already in their private invitation, and current table landmark. Default directions say to look for the small pink sign and explicitly state that the precise table position is not yet posted. Hosts should replace this with the actual landmark on arrival.

## Host access and replies

The organizer’s existing admin console can explicitly provision, rotate or revoke a per-dinner host arrival key after reviewing the assigned host. Only its SHA-256 digest is stored; the generated key is shown once. The host enters it in `/host/arrivals`; it stays in browser memory, never a URL or localStorage. A changed assigned host name or revoked key invalidates the prior access. This role cannot read intake answers, emails, private guest invitation tokens, consent details, full profiles or change RSVP/verified attendance.

The secured host view shows first names for operational identification, latest self-reported status/time/ETA and help requests. The host posts a current table landmark or acknowledges a specific request with directions. Replies require the current request ID and a still-eligible guest, preventing a stale acknowledgment from replacing a new request or responding to a cancelled guest. Guests never receive other guests’ names or records.

Keep both pages open. They poll every 20 seconds while visible. A request saves durably even if the host is offline, but there are **no instant host alerts**, no mail-provider integration, and no native push/Live Activities. UI states this limitation and suggests asking venue staff if there is no reply. `internal@interaction.club` is not represented as a live help desk. General questions go to `the@interaction.club`, labelled not monitored live. No personal host email dependency.

## Notifications and scheduling

The existing durable outbox includes preparation for a one-hour confirmed-guest reminder with arrival/RSVP deep links. It retains exact-draft approval, live eligibility checks, event/member/type deduplication, idempotent provider handoff and delivery-uncertainty quarantine. The new kind must be queued before its due time and sent only within a 15-minute due window. Cancelled/expired guests are suppressed. Actual sending stays disabled; no 15-minute nudge is added.

The proposed response-window helper and three-hour expiry reminder do not change the existing disclosed cancellation/release policy. Before enabling expiry for new invitations, approve exact deadline/release wording and record its disclosure. Existing pending invitations remain historical pending records with a release timestamp rather than falsely recorded declines. Compatible waitlist backfill needs actual seat/capacity and matching review; no automatic substitutions are enabled.

## Pending

- Approve the exact public changes and deploy.
- Approve/send reminder drafts through an idempotent email provider; no provider or scheduler is installed.
- Optional table-location photo: provide an approved image without nonconsenting people, then implement private delivery. No unreviewed photo is displayed now.
- Native app notifications/Live Activities are future work, not website capabilities.
- Approve a new deadline/expiry policy before activating it. No existing policy disclosure or guest acceptance is overwritten.

## Verification

`node scripts/dinner-arrival-test.cjs`: synthetic durable writes/readback, self-report versus attendance, invalid ETA, scoped/revocable host authorization, redacted guest/host payloads, stale help IDs, cancellation races, expiry, reminder deduplication and no retroactive sends.

`node scripts/reminder-cancellation-test.cjs` and `node scripts/invitation-agreement-test.cjs`: existing cancellation, consent and outbox regressions. Production webpack build and focused ESLint checks verify routes/types. No live participant data is used.
