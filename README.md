# Interaction Club

> We want you at our table.

Interaction Club helps adults meet through small-group dinners and personal invitations. It starts with founder-led curation and hosting, using real availability, spending limits, interests and conversational vibe to make a plan people can attend.

## From working product to real community conversations

**Built, marketed and tested during hackathon week:** a working invitation-to-RSVP experience, 33 signup responses reported by the founder on October 9, and our first Berkeley dinner delivered on October 8. Targeted outreach is also opening conversations about bringing the format to existing communities.

### Partner outreach prospects — October 9

| Organization | Response and opportunity | Next step |
| --- | --- | --- |
| **Yes SF / SF Chamber of Commerce** | Following an internal referral, Sydney requested a call to explore how Interaction Club could benefit the organization. | Coordinate a conversation for next week. |
| **Pear VC** | Khalil asked about our community, previous founder/VC-focused events and costs, and included another contact in the conversation. | Share our launch progress and discuss a first pilot. |
| **Mox SF** | Robin expressed interest in a dinner entirely for Mox members, with space and support for facilitating matches. | Replied to discuss the pilot format and shared a personalized concept preview. |
| **Malaika (San Francisco)** | Proposed a specific community-distribution partnership for founder dinners, with potential for a recurring format. | Explore the proposed partnership format. |
| **StartOut** | Cori forwarded our proposal to the team organizing Bay Area events for consideration. | Await the events team's review. |
| **Lovable** | The community team invited a workshop application and described support through Lovable credits, hackathon playbooks and resources for an approved workshop. Its published community-event criteria require 30+ expected participants and at least two weeks' lead time. | Explore a 30+ participant builder workshop and submit an application. |

These are exploratory prospects and program-support discussions, not announced partnerships or endorsements. Lovable's described support is in-kind workshop resources, not cash sponsorship; see its [published community-event criteria](https://lovable.dev/community-events). Detailed outreach metrics and first-dinner lessons appear below; private correspondence and contact information remain outside this repository.

## Hackathon submission

### Earlier work and hackathon scope

**The problem came before the hackathon. The rebuilt product experience came this week.**

Interaction Club grew from a practical observation at Berkeley: meeting people is not the same as getting to know them. Through her own efforts to connect on campus and attending thoughtfully hosted dinners, Vivian saw how a small table, an engaged host and time for conversation could turn introductions into meaningful connections.

Before hackathon week, she asked people about how they met others at Berkeley, what made connecting difficult and what they would change. These informal conversations and firsthand experiences provided early qualitative problem validation and informed the product's direction. The hackathon became the opportunity to test that direction with a working experience and real participant signups.

She initially explored forming a Berkeley student club, then chose an independent format to focus on delivering the experience rather than navigating club administration. An unfinished earlier website explored the idea but did not deliver the intended experience. During hackathon week, beginning October 5, 2026, she rebuilt the invitation-first experience around personal invitations, richer intake, host-reviewed grouping and private dinner confirmations.

The foundation brought into the hackathon was problem discovery, early conversations and a clear product direction—not a finished product. This week's work turned that foundation into the implementation and operating workflows described below. The public submission repository was created during hackathon week; the original private repository is retained separately, not rewritten or backdated.

The framework/tooling scaffold and some basic UI, utility and planning files were retained from the earlier prototype. This is not a claim that every line was newly authored. The week-specific features and workflow changes are described below. Private outreach, negotiation materials, participant records, credentials and production event configuration are excluded.

**Pitch/demo video:** [Watch the full Interaction Club demo](https://drive.google.com/file/d/1_dx79GduuyG2RJd1URAOAdQR9BekCrN5/view).

Submission check: the hackathon requests a **2–3 minute pitch or demo video linked in this README**. This link points to `full demo.mp4`; its duration and signed-out judge playback still need verification. If the full demo exceeds three minutes, use a compliant 2–3 minute cut here and retain the longer walkthrough as supplementary material.

- Primary: **Track 5 — Consumer & New Experiences**
- Additional: **Track 1 — AI-Native Enterprise**, for AI-assisted community operations: turning member intake into reviewed groups, personal invitations, coordinated RSVPs and a prepared host. The present pilot uses an external AI assistant; it is not an integrated autonomous enterprise agent.
- Secondary: **Track 3 — Health & Human Performance**, focused on social connection and belonging. No clinical or health-outcome claims.
- Deadline: **Saturday, October 10, 2026, 11:59 PM Pacific**
- This repository is public. The demo link is included above; final submission remains pending video-length/access verification and Vivian's approval.

## What was built, who it is for, and how it works

For adults who want a manageable way to meet people offline, rather than browse another event feed:

1. Open a personalized envelope and share the information needed for a plan.
2. The organizer reviews compatible group suggestions, actual availability, interests, vibe, food/accessibility needs and the proposed experience.
3. The host explicitly approves the group and records a private matching rationale.
4. Each guest receives a private invitation with a definite date, start/end time, Pacific timezone, public venue, full expected cost/payment coverage, theme and optional dress guidance.
5. Accept or decline the invitation. After acceptance, optionally add the dinner to Google Calendar or download an .ics file.
6. Check in and provide private before/after feedback. Track independent second hangouts separately from enjoying the first event.

Joining the matching pool does not guarantee a dinner seat. Guest identities remain a surprise; invitations and calendar files contain no shared attendee list.

## AI-assisted, host-reviewed matching

AI assistance currently happens **outside the website**, through the founder's assistant-assisted interpretation and curation. There is no integrated model API or autonomous AI matchmaker in this repository.

The in-app suggestion engine is deterministic TypeScript: it checks availability, age band, budget, activity, intent, table opt-in, existing invitations and do-not-rematch constraints. It uses shared interests and optional discipline variety as heuristics. A score is not a validated compatibility prediction. The host reviews the proposed group and its rationale before creating invitations, and records whether AI assistance was used.

## AI-assisted community operations

**Consumer experience on the outside; an AI-assisted operating workflow behind it.** Community operators should not have to repeatedly interpret member profiles, assemble groups, chase replies and prepare every host from scratch. Interaction Club combines structured software with an external AI assistant to help turn member interest into a concrete, hosted gathering.

During the pilot, Vivian uses the assistant for intake interpretation, group-curation support, communication drafts, operational record updates, host preparation and synthesis of event feedback. The website supplies durable records and explicit guest actions. This is a founder-operated, human-supervised workflow today, not a claim that the repository contains a model integration or that all tasks run unattended.

| Stage | Available today | Remaining automation work |
| --- | --- | --- |
| Intake | Web profiles/preferences and queued Google Sheets delivery | Reliable event-specific roster projection on every change |
| Curation | Deterministic constraint-based suggestions plus external AI review | Integrated model-assisted proposals; organizer approval stays explicit |
| Invitations | Private numbered dinner pages, guest access, consent and RSVP controls; assistant-operated Gmail | Verify exact-message approval and delivery receipts; a separate email API is optional |
| Follow-through | Durable reminder jobs, approved-message digests, live eligibility checks and cancellation safeguards | Scheduled assistant checkpoints, event registration and verified delivery |
| Seat replacement | Compatibility review and a documented replacement workflow | Capacity-safe backfill proposals and approved replacement sends |
| Host delivery | Private arrival dashboard, table directions and help replies; private operating playbook | Full guest-needs host view and repeatable trained-host handoff |
| Learning | First dinner delivered; founder/assistant operational review | Tested feedback-to-next-event automation and measured coordination savings |

The repeatable target is **configure an event → review a proposed group → approve invitations → scheduled follow-through → human-hosted experience → reviewed learning**. The assistant can operate the organizer's existing Gmail and Google Sheets through the computer, without requiring a separate email API. At reminder checkpoints it reads current RSVPs, updates the private host roster, suppresses unanswered-RSVP nudges for guests who already responded, and prepares compatible replacements for released seats. Confirmed guests can still receive relevant attendance/arrival reminders. If no compatible replacement is available before the cutoff, keep the smaller roster and request a go/no-go decision rather than force a match.

Our scaling goal is **AI handles the coordination; a trained host delivers the experience**. The founder supplies taste, event configuration and approvals. Hosts provide presence and guest care. The pilot remains human-supervised; a scheduled assistant run is different from a fully autonomous application backend.

See [the community operations workflow and automation launch checklist](docs/AI_COMMUNITY_OPERATIONS.md). No new scheduler, external send, or production policy is activated by this documentation.

## Business validation and operating design

Alongside the product, we developed a private business playbook covering customer segments, outreach, pilot qualification, delivery economics, hosting, matching review, guest expectations and repeatable dinner operations. Vivian directed this work with AI assistance, revising the plan as participant and prospective partner conversations revealed different needs.

The initial consumer experiment tests whether a personal invitation and a thoughtfully hosted small group turn interest into attendance and independent second hangouts. A potential business customer is a community operator who wants its existing members to connect, without planning each gathering itself.

Interaction Club's outreach has opened conversations with **Mox SF, Malaika in San Francisco, Pear VC and Yes SF** about community gatherings. These conversations are helping shape the offer: member profiles, curated groups, a prepared host and operational follow-through. Malaika proposed a community-distribution partnership with potential for recurring dinners; Yes SF requested a conversation. Calls are being planned for next week. The next commercial test is a paid hosted program and repeat purchase, with host compensation included in delivery costs.

Private prospect contacts, participant records, pricing proposals and agreement drafts are not part of this public summary.

### Host-powered operating model

The proposed commercial product combines the operating system and execution: member intake, reviewed matching, invitations, RSVP coordination, a prepared host, and aggregate follow-up. Coworking spaces and community organizations can buy recurring gatherings for their existing members. Cross-community experiences are an optional, separately agreed format, not a requirement to share member data or mix audiences.

Vivian hosts the initial pilot. **One prospective host has expressed interest**, not yet a hiring or staffing commitment. Future founding hosts would receive training and compensation for preparation and event delivery. “Founding host” describes an early operating role, not cofounder status or equity.

The software supports repeatable administration today; a paid host network, host assignment and payouts remain planned. Central operations would approve groups and handle member support, while hosts deliver assigned gatherings. The next operating test is another host delivering a good experience with less founder intervention.

Commercial proposals separate the operations/hosting fee from food and venue funding. Restaurant guests pay for their own meals. Community-space customers supply their venue and pay their caterer directly, or prepay a separately approved food budget if Interaction procures it. Interaction does not subsidize customer food from its service fee. Partner-provided venues are the default; any actual venue charge needs separate customer funding rather than an assumption that every venue is free.

Expansion depends on repeat attendance, independent second hangouts, buyer reorders, contribution after host and coordination labor, and falling coordination time per gathering. Potential defensibility comes from member trust, reliable host coverage, tested formats and repeat buyer relationships. These are advantages to build and measure, not an established moat or claimed network effect. Exploratory partner conversations do not constitute investment or endorsement.

The consolidated business plan remains private in the original project workspace (`docs/BUSINESS_PLAN.md`). This README is the public product and operating-model summary; private contacts, negotiations and participant records stay outside the submission repository.

## Outreach and go-to-market validation

During hackathon week, Vivian took Interaction Club beyond the code through personal invitations, campus-club pitches, social posts and targeted partner outreach. Conversations informed the intake, invitation wording, scheduling and group-compatibility requirements. The goal is to turn interest into real plans people attend, not simply collect a waitlist.

### Partner outreach — October 8 snapshot

| Metric | Count |
| --- | ---: |
| Initial cold emails sent | 164 |
| Follow-up/reply emails sent | 10 |
| **Total company emails sent** | **174** |
| Initial emails scheduled for Friday, October 9—not sent | 73 |
| Organizations with substantive human replies | 15 |
| Organizations declining the current pitch, mailbox-audited | 10 |
| Additional founder-reported decline, outside mailbox audit | 1 |
| Follow-ups after rejection sent, included in the 10 follow-ups/replies | 6 |
| Exploratory conversations: Mox SF, Malaika (San Francisco), Pear VC | 3 |
| Confirmed paid partnership agreements | 0 |

The October 8 mailbox audit counts **164 initial + 10 follow-up/reply emails = 174 sent**; the initial count includes one bounced attempt. The **73 scheduled emails are separate**: 50 at 8 a.m. and 23 at 10 a.m. Pacific on October 9. Human-response counts exclude automated replies and application routing. The additional founder-reported decline is Jobright; response categories can overlap and are not an additive funnel. Next-week calls are being planned, not reported as booked. No paid partnership agreement is confirmed.

### Community sign-ups and dinner invitations — October 8

| Metric | Count |
| --- | ---: |
| Unique signups in Members, including Vivian | 31 |
| Unique invited guests, excluding Vivian as host | 9 |
| Guest invitation instances across two dinners, excluding host | 10 |
| Guest RSVPs accepted | 4 |
| Guest invitations declined | 1 |
| Guest invitations pending | 5 |
| First dinner delivered: October 8 | 1 |
| First-dinner guests attended, founder-reported | 3 |
| First-dinner attendees including founder-host, founder-reported | 4 |
| Second dinner proposed: October 9, unconfirmed | 1 |

The earlier October 8 Sheet audit shows **31 unique signups, including Vivian**. Guest RSVP counts exclude her: **4 accepted + 1 declined + 5 pending = 10 invitation instances across 9 unique guests**. Including the host, the two rosters contain 12 invitation instances across 10 unique people. These are the earlier invitation/RSVP snapshot, not attendance totals. Personal hand-selling/message volume is untracked. Vivian subsequently reported **three guests plus herself as founder-host attended dinner-001 on October 8**. The proposed October 9 dinner remains unconfirmed. Repeat attendance and independent second hangouts have not been established.

### First live pilot delivered — October 8

**October 9 founder update:** 33 signup responses including Vivian as host, or **32 participant responses excluding the host**, with Ayushi the latest signup according to Vivian's check. This is newer than the October 8 audit above; response count is not a verified attendance or unique-person metric.

We hosted our first Berkeley dinner with three guests plus the founder-host. The pilot produced shared-interest conversation and practical lessons for improving arrivals, introductions, and inclusive facilitation. Next iteration: a brief opening round after guests order, stronger follow-up prompts, and a clear closing invitation to reconnect.

Operational learning now informs the dinner-day workflow: clear RSVP deadlines, delayed-reply handling, safe cancellations, and help finding the actual table. **Implemented web workflow:** private arrival status/ETA saves, help requests and host replies, an arrival-only host dashboard with visible-page polling, and one-hour reminder preparation in the existing outbox. Self-reported arrival stays separate from organizer-verified attendance. Actual notification delivery, approved table photos and native push/Live Activities remain pending. The proposed deadline/expiry policy requires approval before activation. See [dinner-day arrival workflow](docs/DINNER_ARRIVALS.md).

### What Thursday's first dinner taught us

The first delivered dinner tested the experience beyond the signup form. It was a useful first pilot, not a claim that one evening establishes lasting friendships. The founder's observations now inform both hosting and product design:

- **Interest is not a confirmed seat.** Scheduling, unanswered invitations and cancellations create real coordination work. The next workflow should show explicit RSVP deadlines, send one timely reminder, expire unanswered invitations and offer released seats to compatible waitlisted guests—without relying on the founder chasing people through personal DMs.
- **An address is not an arrival experience.** Guests need to identify the host and find the actual table. Our small pink table sign helps, but the invitation also needs a table landmark and an easy way to request help or report an ETA.
- **Introductions need more than handshakes.** A brief opening round can give everyone an entry point. Shared interests led to conversation at the pilot; follow-up questions and room for quieter guests can help a table build on those connections without requiring everyone to perform.
- **Ordering affects the flow.** At a counter-order restaurant, separate ordering interrupts the opening conversation. Let guests order and settle in before starting the round; choose future venues with ordering flow, affordability and conversation in mind.
- **Guests can help shape the venue shortlist.** Restaurant recommendations could make future planning more informed, particularly for vegetarian, vegan and allergy-related needs. Recommendations are leads for host/restaurant checks, not guarantees of safe accommodation.

## Future plans

These are directions identified after the first dinner, not claims of shipped app features. We will test the web invitation and host workflow first, then use those lessons to guide a native app.

### A member app built around real plans

- **Manage your profile:** update interests, conversational preferences, availability, travel areas, budget, dietary/accessibility needs and photo permissions without submitting everything again.
- **Your invitations and upcoming dinners:** view private invitations, exact RSVP deadlines, event details, expected costs and arrival instructions; accept or decline, manage an accepted RSVP, and request cancellation through clear rules.
- **Calendar and reminder preferences:** add confirmed plans to Google Calendar, manage notification choices and receive useful reminders rather than repeated manual follow-ups. Calendar export exists on the web today; a native app experience is planned.
- **Dinner-day arrival actions:** a one-hour reminder opens the invitation with “I'm on my way,” “I'm here,” “I'm running late” with an optional ETA, “Can't find the table,” and “Manage my RSVP.” The assigned host needs an operational view of these updates and a way to acknowledge help requests; self-reported arrival is distinct from verified attendance.
- **Native notifications and Live Activities:** explore an opt-in live event status surface showing the next dinner, time and arrival actions, where the platform supports it. This needs native implementation, permission handling and delivery testing; it is not currently provided by the website.

### Make the next experience better—and more fun

- **Feedback and recommendation surveys:** short optional post-dinner feedback, restaurant suggestions and places guests already enjoy, including relevant dietary options. Surface these as useful contributions rather than another long required form.
- **SideQuests and fun extras:** browse concrete small-group activities, suggest themes and future outings, and earn returning SideQuester recognition from verified participation. Preserve the invitation-first feel rather than turning the app into a generic event feed.
- **Repeatable host operations:** clear arrival instructions, a lightweight welcome/conversation script, consent-aware photos, bill-settlement guidance and reliable staff escalation. Support trained hosts without requiring the founder to personally manage every guest conversation.

The immediate test is whether these changes improve timely responses, attendance, arrival confidence and the experience at the table. A native app should make a proven workflow easier—not substitute for delivering good dinners.

## Hackathon week: October 5–11, 2026

Idea research and an existing website predate this hackathon. This timeline distinguishes in-window iteration from that earlier work. Build entries are supported by repository history; the October 8 metrics above come from the mailbox and Sheet audit, and future events remain scheduled until delivered.

| Day | Work and status |
| --- | --- |
| Mon, Oct 5 | Iterated the invitation experience, interest entry and meal-availability UI; added before/after feedback, check-in and cancellation-priority handling. |
| Tue, Oct 6 | Improved durable Sheets delivery and retries, shortened intake, added date-specific dinner choices and optional community affinity, and refined referral and partner invitation pages. Participant outreach informed the pilot. |
| Wed, Oct 7 | Added roster-gated dinner access, explicit participation/photo choices, clearer RSVP controls and saved-response celebrations; separated consent fields from optional answers in the response export. Community-operator outreach surfaced the member-only dinner use case. |
| Thu, Oct 8 | Updated invitation access and aligned the first dinner's website details with its Calendar timing. Consolidated matching, hosting and business operations. The audit shows **31 unique signups including the host**, **164 initial cold emails sent**, **10 follow-up/reply emails sent**, and **73 initial emails scheduled separately for October 9**. Three founder-identified exploratory conversations: Mox SF, Malaika in San Francisco, and Pear VC. **Delivered dinner-001 with three guests plus the founder-host**, according to Vivian's report. Shared-interest conversation and hosting lessons inform the next iteration. |
| Fri, Oct 9 | **Proposed, unconfirmed:** the second dinner. Further community-pilot qualification continues. |
| Sat, Oct 10 | **Pending:** verify the linked demo is 2–3 minutes and accessible to judges, finalize the submission package, complete the privacy/security review, and obtain publication approval. Submission deadline: 11:59 PM Pacific. |
| Sun, Oct 11 | **Scheduled by organizers:** Demo Day at SCET, Grimes Engineering Center, top floor, 1–4 PM; table rounds 1:30–2:30 PM. Finalists pitch for three minutes. Selection and participation outcomes are not claimed. |

## Technical implementation

- Next.js App Router, React and TypeScript.
- Private Vercel Blob storage holds intake, dinner records and separate per-guest participation records.
- Secret-authenticated Google Sheets delivery mirrors records for organizer operations; queued delivery can be retried.
- Organizer endpoints require a server-only organizer key.
- New dinner links use stable numbered IDs, such as `/invitation/dinner-01?token=...`. Private create-only reservations prevent competing requests from allocating the same ID. Numbers are not authorization: each recipient needs an unguessable token.
- Existing `/table/[token]` links remain supported. New invitations expire 30 days after the scheduled end.
- Calendar generation uses explicit UTC times and the America/Los_Angeles timezone. The guest chooses whether to add an event; the app does not create Google events or send calendar emails.
- The host must confirm the venue and full cost before generating a real invitation. No venue bookings, email sending, payment collection or native app are implemented by this workflow.

## Synthetic demo

`/preview/dinner` uses the real invitation UI with a clearly labeled synthetic event and browser-only RSVP persistence. It never writes to the live response inbox, sends an invitation, books a venue or collects a payment. Reset the demo from its visible reset control.

`/host-preview` is a separate synthetic organizer walkthrough. Keep real contact information, participant records and organizer credentials off screen when recording.

## Setup

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Create a local `.env.local` with your own server-side configuration. Never commit values:

```dotenv
BLOB_READ_WRITE_TOKEN=
GOOGLE_SHEETS_WEBHOOK_URL=
GOOGLE_SHEETS_WEBHOOK_SECRET=
INTERACTION_ADMIN_KEY=
INTERACTION_FIRST_DINNER_JSON=
```

Use a private Vercel Blob store. The Sheets URL must point to a deployed webhook configured with the same secret. Do not prefix these variables with `NEXT_PUBLIC_`. Import the project into Vercel with the Next.js preset.

```bash
npm run build
npm start
```

## Focused verification

```bash
node scripts/dinner-invitation-test.cjs
node scripts/matching-test.cjs
node scripts/publication-audit.cjs
```

Dinner tests use mocked storage and synthetic identities to check collision-safe numbering, token mismatch/expiry, persistent accept/decline, calendar gating, correct Pacific/UTC times and absence of other guest data. The publication scanner checks current non-ignored files and unique historical blobs across local Git refs without printing matched secret values. It is a heuristic aid, not a substitute for manual review of screenshots, PDFs, encoded secrets and private data.

## Privacy and pilot scope

Adult eligibility uses month/year plus an 18+ attestation, not identity-document screening. The pilot keeps ages 18–22 together and separate from older age groups. Broad base area replaces continuous location tracking. Dietary/accessibility information supports host and venue review without promising accommodation. Participant information is not automatically shared with sponsors.

The initial pilot tests attendance and whether people independently meet again. Sponsor-supported gatherings and compensated local hosts are business hypotheses to validate, not current revenue or guaranteed outcomes.
