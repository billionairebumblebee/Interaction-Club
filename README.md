# Interaction Club

> We want you at our table.

Interaction Club helps adults meet through small-group dinners and personal invitations. It starts with founder-led curation and hosting, using real availability, spending limits, interests and conversational vibe to make a plan people can attend.

## From working product to real community conversations

**Built, marketed and tested during hackathon week:** a working invitation-to-RSVP experience, **33 unique sign-ups**, and **one Berkeley dinner hosted on October 8**.

We sent **237 initial cold emails and 10 follow-ups/replies — 247 company emails total**, opening partnership conversations with **Mox SF, Pear VC and Yes SF / SF Chamber of Commerce** about bringing Interaction Club to their communities.

Vivian personally posted on social media, pitched on campus, and sent more personal texts and hand-sold invitations than she could keep count of. That hands-on marketing brought people into the product and turned an idea into a real dinner, with participant feedback and buyer conversations shaping what we build next.

## Hackathon week: October 5–11, 2026

Vivian researched the problem before the hackathon, then rebuilt an unfinished prototype into a working invitation and hosting experience during the week. Implementation details follow below. Outreach and dinner observations combine dated operational audits with Vivian's reports; Saturday and Sunday activities remain planned.

| Day | Work and status |
| --- | --- |
| Mon, Oct 5 | Rebuilt the invitation experience, interest entry and meal-availability UI; added before/after feedback, check-in and cancellation-priority handling. |
| Tue, Oct 6 | Improved durable Sheets delivery and retries, shortened intake, added date-specific dinner choices and optional community affinity, and refined referral and partner invitation pages. **Vivian pitched to a consulting club Tuesday night to practice and recruit customers.** According to Vivian, members challenged the pitch, liked the idea and signed up. |
| Wed, Oct 7 | Added roster-gated dinner access, explicit participation/photo choices, clearer RSVP controls and saved-response celebrations; separated consent fields from optional answers in the response export. Community-operator outreach surfaced the member-only dinner use case. |
| Thu, Oct 8 | Aligned invitation details with Calendar timing and consolidated matching, hosting and business operations. **Delivered Dinner 001 with four people including Vivian**, founder-reported. Shared-interest conversation and hosting lessons informed the next iteration. |
| Fri, Oct 9 | **Vivian worked on the presentation and pitch after cancellations left the second dinner without enough confirmed guests.** People expressed interest in future dinners but reported midterm-related scheduling constraints. The second dinner was postponed. Updated audit: **33 unique sign-ups including Vivian, 247 company emails sent, and 20 substantive human replies across 18 organizations**. |
| Sat, Oct 10 | **Planned:** practice another pitch and attend an SF Tech Week event. Finish the pitch/demo and submission preparation. |
| Sun, Oct 11 | **Scheduled by organizers:** Demo Day at SCET, Grimes Engineering Center, top floor, 1–4 PM; table rounds 1:30–2:30 PM. Finalists pitch for three minutes. |

### Partner outreach prospects — October 9

| Organization | Response and opportunity | Next step |
| --- | --- | --- |
| **Yes SF / SF Chamber of Commerce** | Following an internal referral, Sydney requested a call to explore how Interaction Club could benefit the organization. | Coordinate a conversation for next week. |
| **Pear VC** | Khalil asked about our community, previous founder/VC-focused events and costs, and included another contact in the conversation. | Share our launch progress and discuss a first pilot. |
| **Mox SF** | Robin expressed interest in a dinner entirely for Mox members, with space and support for facilitating matches. | Replied to discuss the pilot format and shared a personalized concept preview. |
| **Malaika (San Francisco)** | Discussed community promotion and potential recurring dinners. | Continue discussing the format and distribution opportunity. |
| **StartOut** | Cori forwarded our proposal to the team organizing Bay Area events for consideration. | Await the events team's review. |
| **Lovable** | The community team invited a workshop application and described support through Lovable credits, hackathon playbooks and resources for an approved workshop. Its published community-event criteria require 30+ expected participants and at least two weeks' lead time. | Explore a 30+ participant builder workshop and submit an application. |

These are exploratory prospects and program-support discussions, not announced partnerships or endorsements. Lovable's described support is in-kind workshop resources, not cash sponsorship; see its [published community-event criteria](https://lovable.dev/community-events). Detailed outreach metrics and first-dinner lessons appear below; private correspondence and contact information remain outside this repository.

## Hackathon submission

### Earlier work and hackathon scope

**The problem came before the hackathon. The rebuilt product experience came this week.**

Interaction Club grew from a practical observation at Berkeley: meeting people is not the same as getting to know them. Through her own efforts to connect on campus and attending thoughtfully hosted dinners, Vivian saw how a small table, an engaged host and time for conversation could turn introductions into meaningful connections.

Before hackathon week, Vivian asked people about how they met others at Berkeley, what made connecting difficult and what they would change. These informal conversations and firsthand experiences provided early qualitative problem validation and informed the product's direction. The hackathon became the opportunity to test that direction with a working experience and real participant signups.

Vivian initially explored forming a Berkeley student club, then chose an independent format to focus on delivering the experience rather than navigating club administration. An unfinished earlier website explored the idea but did not deliver the intended experience. During hackathon week, beginning October 5, 2026, Vivian rebuilt the invitation-first experience around personal invitations, richer intake, host-reviewed grouping and private dinner confirmations.

The foundation brought into the hackathon was problem discovery, early conversations and a clear product direction—not a finished product. This week's work turned that foundation into the implementation and operating workflows described below. The public submission repository was created during hackathon week; the original private repository is retained separately, not rewritten or backdated.

The framework/tooling scaffold and some basic UI, utility and planning files were retained from the earlier prototype. This is not a claim that every line was newly authored. The week-specific features and workflow changes are described below. Private outreach, negotiation materials, participant records, credentials and production event configuration are excluded.

**Pitch/demo video:** [Watch the full Interaction Club demo](https://drive.google.com/file/d/1_dx79GduuyG2RJd1URAOAdQR9BekCrN5/view).

The hackathon requests a **2–3 minute pitch or demo video**. The linked `full demo.mp4` is **1:29**, as checked October 9.

- Primary: **Track 5 — Consumer & New Experiences**
- Secondary: **Track 3 — Health & Human Performance**, focused on social connection and belonging. No clinical or health-outcome claims.
- Additional: **Track 1 — AI-Native Enterprise**, for AI-assisted community operations: turning member intake into reviewed groups, personal invitations, coordinated RSVPs and a prepared host. The present pilot uses an external AI assistant; it is not an integrated autonomous enterprise agent.

## What was built, who it is for, and how it works

For adults who want a manageable way to meet people offline, rather than browse another event feed:

1. Open a personalized envelope and share the information needed for a plan.
2. The organizer reviews compatible group suggestions, actual availability, interests, vibe, food/accessibility needs and the proposed experience.
3. The host explicitly approves the group and records a private matching rationale.
4. Each guest receives a private invitation with a definite date, start/end time, Pacific timezone, public venue, full expected cost/payment coverage, theme and optional dress guidance.
5. Accept or decline the invitation. After acceptance, optionally add the dinner to Google Calendar or download an .ics file.
6. Check in and provide private before/after feedback. Track independent second hangouts separately from enjoying the first event.

Joining the matching pool does not guarantee a dinner seat. Guest identities remain a surprise; invitations and calendar files contain no shared attendee list.

## Technical implementation

### Application architecture

- Next.js App Router, React and TypeScript.
- Private Vercel Blob storage holds intake, dinner records and separate per-guest participation records.
- Secret-authenticated Google Sheets delivery mirrors records for organizer operations; queued delivery can be retried.
- Organizer endpoints require a server-only organizer key.
- New dinner links use stable numbered IDs, such as `/invitation/dinner-01?token=...`. Private create-only reservations prevent competing requests from allocating the same ID. Numbers are not authorization: each recipient needs an unguessable token.
- Existing `/table/[token]` links remain supported. New invitations expire 30 days after the scheduled end.
- Calendar generation uses explicit UTC times and the America/Los_Angeles timezone. The guest chooses whether to add an event; the app does not create Google events or send calendar emails.
- The host must confirm the venue and full cost before generating a real invitation. No venue bookings, email sending, payment collection or native app are implemented by this workflow.

### AI-assisted, host-reviewed matching

AI assistance currently happens **outside the website**, through the founder's assistant-assisted interpretation and curation. There is no integrated model API or autonomous AI matchmaker in this repository.

The in-app suggestion engine is deterministic TypeScript: it checks availability, age band, budget, activity, intent, table opt-in, existing invitations and do-not-rematch constraints. It uses shared interests and optional discipline variety as heuristics. A score is not a validated compatibility prediction. The host reviews the proposed group and its rationale before creating invitations, and records whether AI assistance was used.

### AI-assisted community operations

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

Interaction Club's outreach has opened exploratory conversations with **Mox SF, Pear VC and Yes SF** about community gatherings. These conversations are helping shape the offer: member profiles, curated groups, a prepared host and operational follow-through. Mox requested a dinner for its existing members; the fee is not agreed. Pear asked about event history and costs, not an endorsement. Yes SF requested a conversation. Malaika discussed community promotion and potential recurring dinners. The next commercial test is a paid hosted program and repeat purchase, with host compensation included in delivery costs.

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

### Partner outreach — audited October 9, 2:30 p.m. Pacific

| Metric | Count |
| --- | ---: |
| Initial cold emails sent | 237 |
| Follow-up/reply emails sent | 10 |
| **Total company emails sent** | **247** |
| Scheduled messages remaining | 0 |
| Substantive human reply messages | 20 |
| Organizations with substantive human replies | 18 |
| Organizations declining the current pitch, mailbox-audited | 12 |
| Additional founder-reported decline, outside mailbox audit | 1 |
| Interested/exploratory organizations: Mox SF, Pear VC, Yes SF | 3 |
| Confirmed paid partnership agreements | 0 |

The October 9 mailbox audit counts **237 initial + 10 follow-up/reply emails = 247 sent**. All 73 previously scheduled Friday messages have been sent; none remain scheduled. Sent volume is not a delivered-to-inbox metric. Human-response counts exclude automated replies, bots and Mercury form routing. The additional founder-reported decline is Jobright; response categories can overlap and are not an additive funnel. StartOut's internal forwarding is not counted as buying interest. No paid deal is evidenced. Personal text/outreach volume is **untracked**.

**Commercial learning:** interest in hosting for an existing member community points toward a clearer buyer use case than sponsoring a six-student dinner. Onshape explicitly questioned the sponsor return on that small format. This is an early positioning insight from outreach, not proof of willingness to pay or repeat purchase.

### Community sign-ups and dinner invitations — October 9 update

| Metric | Count |
| --- | ---: |
| **Unique sign-ups in Members, including Vivian** | **33** |
| **Unique people on dinner invitation rosters, including Vivian** | **10** |
| Invitation instances across two dinner rosters, including Vivian | 12 |
| Guest-only unique invitees | 9 |
| Guest-only invitation instances | 10 |
| Guest RSVPs accepted | 4 |
| Guest-submitted declines | 1 |
| First dinner delivered: October 8 | 1 |
| First-dinner guests attended, founder-reported | 3 |
| First-dinner attendees including founder-host, founder-reported | 4 |
| Second dinner proposed for October 9; subsequently postponed | 1 |

The October 9 Members audit confirms **33 unique sign-ups including Vivian**. Invitation instances count a person again when they appear on a second dinner roster; they are not unique people or attendance. Guest RSVP totals are separate from the host's participation. Invitations closed by the organizer after Dinner 002 was postponed are **not guest-submitted declines, late cancellations or no-shows**. Vivian reported on October 9 that **three guests plus herself attended Dinner 001 on October 8: four people total**. The October 9 dinner was postponed because too few guests confirmed; it is not counted as delivered. Repeat attendance and independent second hangouts have not been established.

### First live pilot delivered — October 8

**Attendance evidence:** four people including Vivian, founder-reported October 9; this is not inferred from accepted RSVPs or presented as independently verified check-in data.

We hosted our first Berkeley dinner with three guests plus the founder-host. The pilot produced shared-interest conversation and practical lessons for improving arrivals, introductions, and inclusive facilitation. Next iteration: a brief opening round after guests order, stronger follow-up prompts, and a clear closing invitation to reconnect.

**Midterms constrained this week's availability.** Vivian reports that people expressed interest in future dinners but could not attend this week because of midterms. The Friday dinner was postponed when too few guests confirmed. This feedback informs future scheduling; interest in a later dinner is not yet a confirmed RSVP or repeat attendance.

Operational learning now informs the dinner-day workflow: clear RSVP deadlines, delayed-reply handling, safe cancellations, and help finding the actual table. **Implemented web workflow:** private arrival status/ETA saves, help requests and host replies, an arrival-only host dashboard with visible-page polling, and one-hour reminder preparation in the existing outbox. Self-reported arrival stays separate from organizer-verified attendance. Actual notification delivery, approved table photos and native push/Live Activities remain pending. The proposed deadline/expiry policy requires approval before activation. See [dinner-day arrival workflow](docs/DINNER_ARRIVALS.md).

### What Thursday's first dinner taught us

The first delivered dinner tested the experience beyond the signup form. It was a useful first pilot, not a claim that one evening establishes lasting friendships. The founder's observations now inform both hosting and product design:

- **Interest is not a confirmed seat.** Scheduling, unanswered invitations and cancellations create real coordination work. The next workflow should show explicit RSVP deadlines, send one timely reminder, expire unanswered invitations and offer released seats to compatible waitlisted guests—without relying on the founder chasing people through personal DMs.
- **An address is not an arrival experience.** Guests need to identify the host and find the actual table. Our small pink table sign helps, but the invitation also needs a table landmark and an easy way to request help or report an ETA.
- **Introductions need more than handshakes.** A brief opening round can give everyone an entry point. Shared interests led to conversation at the pilot; follow-up questions and room for quieter guests can help a table build on those connections without requiring everyone to perform.
- **Hosts need a private preparation sheet.** Before each dinner, the assigned host should have the guests' reported allergies, photo permissions and short blurbs, plus shared interests that suggest points of connection. This supports thoughtful follow-up questions and deeper conversation without making guests repeat their profiles. Restrict the sheet to the assigned host and necessary organizers; do not expose it to the table or sponsors. This fuller host view is a next iteration, not a completed feature.
- **Ordering affects the flow.** At a counter-order restaurant, separate ordering interrupts the opening conversation. Let guests order and settle in before starting the round; choose future venues with ordering flow, affordability and conversation in mind.
- **Guests can help shape the venue shortlist.** Restaurant recommendations could make future planning more informed, particularly for vegetarian, vegan and allergy-related needs. Recommendations are leads for host/restaurant checks, not guarantees of safe accommodation.

## Future plans

These are directions identified after the first dinner, not claims of shipped app features. We will test the web invitation and host workflow first, then use those lessons to guide a native app.

### A member app built around real plans

**Priority: the invitation should carry people all the way to the table.** Arrival actions are a core future app experience, not an afterthought. A guest should be able to open the dinner, find the host and send a useful update in a tap. The host should see who is on the way, running late or needs help, and respond privately.

- **Manage your profile:** update interests, conversational preferences, availability, travel areas, budget, dietary/accessibility needs and photo permissions without submitting everything again.
- **Your invitations and upcoming dinners:** view private invitations, exact RSVP deadlines, event details, expected costs and arrival instructions; accept or decline, manage an accepted RSVP, and request cancellation through clear rules.
- **Calendar and reminder preferences:** add confirmed plans to Google Calendar, manage notification choices and receive useful reminders rather than repeated manual follow-ups. Calendar export exists on the web today; a native app experience is planned.
- **Dinner-day arrival actions:** a one-hour reminder opens the invitation with “I'm on my way,” “I'm here,” “I'm running late” with an optional ETA, “Can't find the table,” and “Manage my RSVP.” The assigned host needs an operational view of these updates and a way to acknowledge help requests; self-reported arrival is distinct from verified attendance.
- **Native notifications and Live Activities:** explore an opt-in live event status surface showing the next dinner, time and arrival actions, where the platform supports it. This needs native implementation, permission handling and delivery testing; it is not currently provided by the website.

### Personal invitations through native messaging

The future experience should also work through **opt-in text messaging**, rather than rely on email or require an app download. A warm, brief dinner text can open a personalized, high-effort invitation: a cute envelope animation, clear typography, the guest's name, and one obvious RSVP action. Rich layout and animation would live in the linked invitation or native app, not be promised inside a plain SMS. Email remains a fallback.

Messaging should connect directly to dinner-day actions and private help, with clear sender identity and notification preferences. Native messaging integration, delivery receipts and reliable notification sending remain future implementation work. The aim is the convenience of a personal text with the care of a designed invitation.

### Make the next experience better—and more fun

- **Feedback and recommendation surveys:** short optional post-dinner feedback, restaurant suggestions and places guests already enjoy, including relevant dietary options. Surface these as useful contributions rather than another long required form.
- **SideQuests and fun extras:** browse concrete small-group activities, suggest themes and future outings, and earn returning SideQuester recognition from verified participation. Preserve the invitation-first feel rather than turning the app into a generic event feed.
- **Repeatable host operations:** clear arrival instructions, a lightweight welcome/conversation script, consent-aware photos, bill-settlement guidance and reliable staff escalation. Support trained hosts without requiring the founder to personally manage every guest conversation.

The immediate test is whether these changes improve timely responses, attendance, arrival confidence and the experience at the table. A native app should make a proven workflow easier—not substitute for delivering good dinners.

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

October 9 submission-readiness check: the GitHub repository is public; the homepage, signup, synthetic dinner preview, organizer preview and sitemap respond successfully. Unauthenticated organizer and dinner-session requests reject access. The publication scan of this submission checkout and its local Git history found only the documented `synthetic-test-only` fixtures, not live credentials. Name-access, arrival and matching tests passed. Two older test harnesses currently fail on missing dependency mocks; they are not counted as passes. See [submission readiness and prepared thesis](docs/SUBMISSION_READINESS.md) for remaining checks. This bounded review is not a comprehensive security certification.

```bash
node scripts/dinner-invitation-test.cjs
node scripts/matching-test.cjs
node scripts/publication-audit.cjs
```

Dinner tests use mocked storage and synthetic identities to check collision-safe numbering, token mismatch/expiry, persistent accept/decline, calendar gating, correct Pacific/UTC times and absence of other guest data. The publication scanner checks current non-ignored files and unique historical blobs across local Git refs without printing matched secret values. It is a heuristic aid, not a substitute for manual review of screenshots, PDFs, encoded secrets and private data.

## Privacy and pilot scope

Adult eligibility uses month/year plus an 18+ attestation, not identity-document screening. The pilot keeps ages 18–22 together and separate from older age groups. Broad base area replaces continuous location tracking. Dietary/accessibility information supports host and venue review without promising accommodation. Participant information is not automatically shared with sponsors.

The initial pilot tests attendance and whether people independently meet again. Sponsor-supported gatherings and compensated local hosts are business hypotheses to validate, not current revenue or guaranteed outcomes.
