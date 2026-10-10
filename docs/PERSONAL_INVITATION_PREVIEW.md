# Personal conversation invitation

Isolated local feature: `/vivianbuilds`. Existing `/vivian` and group signup are unchanged by this feature.

## Review

Run the existing development server and open `/vivianbuilds?preview=1`. Preview mode never sends or saves a request. Normal mode requires the existing private Blob configuration. No new tracker or OAuth connection is created.

The envelope opens a one-on-one request for Vivian, with call/in-person choices, context, duration, location preference and up to five proposed times. Date entry uses the viewer's device timezone. Each proposed instant displays locally and in Pacific time. Requests remain pending confirmation. A private capability link permits withdrawal; rescheduling means withdrawing and submitting new proposed times. Keep that link private.

## Integration boundary

The inspected application has Calendar links and ICS generation, but no verified server-side Google Calendar free/busy or booking integration. This feature reuses private Blob persistence, the existing circle mark, brand fonts and sound provider. It creates no Calendar event, Meet link, external invitation or email. Vivian must review requests manually; no automated notification is enabled. Pending request storage is under `personal-meetings/`, outside participant applications.

Before enabling real booking: authorize the intended calendar, implement privacy-preserving free/busy checks, atomic slot reservation, recheck conflicts before event creation, idempotent Calendar writes, confirmed Meet/location details, and cancellation/rescheduling against the actual event. Display only bookable slots, never underlying calendar titles, attendees or private locations. Protect the public request endpoint with production rate limits before launch.

## Checks and release

`node scripts/personal-meeting-test.cjs` uses synthetic storage. `npx tsc --noEmit` checks types. Visual browser QA remains required.

Publication is not approved. Proposed action for review: commit only this feature's six implementation/test files and this document to the public Interaction Club repository, then deploy the reviewed revision to the existing Vercel project. Exclude unrelated dirty changes. Do not turn pending requests into confirmed bookings without the separate calendar integration and approval.
