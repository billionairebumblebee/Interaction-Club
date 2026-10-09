# Interaction Club

> We want you at our table.

Interaction Club helps adults meet through small-group dinners and personal invitations. It starts with founder-led curation and hosting, using real availability, spending limits, interests and conversational vibe to make a plan people can attend.

## Hackathon submission

### Earlier work and hackathon scope

**The problem came before the hackathon. The rebuilt product experience came this week.**

Interaction Club grew from a practical observation at Berkeley: meeting people is not the same as getting to know them. Through her own efforts to connect on campus and attending thoughtfully hosted dinners, Vivian saw how a small table, an engaged host and time for conversation could turn introductions into meaningful connections.

Before hackathon week, she asked people about how they met others at Berkeley, what made connecting difficult and what they would change. These informal conversations and firsthand experiences provided early qualitative problem validation and informed the product's direction. The hackathon became the opportunity to test that direction with a working experience and real participant signups.

She initially explored forming a Berkeley student club, then chose an independent format to focus on delivering the experience rather than navigating club administration. An unfinished earlier website explored the idea but did not deliver the intended experience. During hackathon week, beginning October 5, 2026, she rebuilt the invitation-first experience around personal invitations, richer intake, host-reviewed grouping and private dinner confirmations.

The foundation brought into the hackathon was problem discovery, early conversations and a clear product direction—not a finished product. This week's work turned that foundation into the implementation and operating workflows described below. The public submission repository was created during hackathon week; the original private repository is retained separately, not rewritten or backdated.

The framework/tooling scaffold and some basic UI, utility and planning files were retained from the earlier prototype. This is not a claim that every line was newly authored. The week-specific features and workflow changes are described below. Private outreach, negotiation materials, participant records, credentials and production event configuration are excluded.

**Pitch/demo video: not linked yet. This is a submission blocker.** The final linked video must be 2–3 minutes; existing longer footage needs a verified compliant edit.

- Primary: **Track 5 — Consumer & New Experiences**
- Secondary: **Track 3 — Health & Human Performance**, focused on social connection and belonging. No clinical or health-outcome claims.
- Deadline: **Saturday, October 10, 2026, 11:59 PM Pacific**
- This repository is public. Final submission remains pending the compliant pitch/demo video and Vivian's approval.

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

## Business validation and operating design

Alongside the product, we developed a private business playbook covering customer segments, outreach, pilot qualification, delivery economics, hosting, matching review, guest expectations and repeatable dinner operations. Vivian directed this work with AI assistance, revising the plan as participant and prospective partner conversations revealed different needs.

The initial consumer experiment tests whether a personal invitation and a thoughtfully hosted small group turn interest into attendance and independent second hangouts. A potential business customer is a community operator who wants its existing members to connect, without planning each gathering itself.

Interaction Club is in talks with **Mox SF, Malaika in San Francisco, and Pear VC** about hosting curated gatherings for builder/founder communities. These three exploratory conversations are helping shape the offer: member profiles, curated groups, a prepared host and operational follow-through. Calls are being planned for next week. The next commercial test is a paid hosted program and repeat purchase, with host compensation included in delivery costs.

Private prospect contacts, participant records, pricing proposals and agreement drafts are not part of this public summary.

## Outreach and go-to-market validation

During hackathon week, Vivian took Interaction Club beyond the code through personal invitations, campus-club pitches, social posts and targeted partner outreach. Conversations informed the intake, invitation wording, scheduling and group-compatibility requirements. The goal is to turn interest into real plans people attend, not simply collect a waitlist.

### Partner outreach — October 8 snapshot

| Metric | Count |
| --- | ---: |
| Initial cold emails sent | 152 |
| Exploratory conversations: Mox SF, Malaika (San Francisco), Pear VC | 3 |

The **152 initial cold emails sent** figure is from the existing October 8 outreach snapshot. Next-week discovery calls are being planned to discuss community needs, scope and costs. Alongside outreach, Vivian developed private buyer-specific playbooks covering pilot qualification, delivery economics, host compensation and repeatable dinner operations.

### Community sign-ups and dinner invitations — October 8

| Metric | Count |
| --- | ---: |
| Participant signups, founder-reported | 31 |
| Dinners scheduled: October 8 and October 9 | 2 |

**31 signups are interest, not attendance.** Vivian is heading to host the first dinner on October 8; it remains scheduled until she reports the delivered outcome. The second dinner is scheduled for October 9. Actual attendance, guest feedback and independent second hangouts will be recorded after the events.

## Hackathon week: October 5–11, 2026

Idea research and an existing website predate this hackathon. This timeline distinguishes in-window iteration from that earlier work. Build entries are supported by repository history; signup counts are founder-reported, and future events remain planned until delivered.

| Day | Work and status |
| --- | --- |
| Mon, Oct 5 | Iterated the invitation experience, interest entry and meal-availability UI; added before/after feedback, check-in and cancellation-priority handling. |
| Tue, Oct 6 | Improved durable Sheets delivery and retries, shortened intake, added date-specific dinner choices and optional community affinity, and refined referral and partner invitation pages. Participant outreach informed the pilot. |
| Wed, Oct 7 | Added roster-gated dinner access, explicit participation/photo choices, clearer RSVP controls and saved-response celebrations; separated consent fields from optional answers in the response export. Community-operator outreach surfaced the member-only dinner use case. |
| Thu, Oct 8 | Updated invitation access and aligned the first dinner's website details with its Calendar timing. Consolidated matching, hosting and business operations. Vivian reports **31 participant signups**, **152 initial cold emails sent** in the outreach snapshot, and **three exploratory conversations**: Mox SF, Malaika in San Francisco, and Pear VC. The first dinner is scheduled; delivery and attendance will be recorded after hosting. |
| Fri, Oct 9 | **Scheduled:** the second dinner. Further community-pilot qualification continues. |
| Sat, Oct 10 | **Pending:** finalize the verified 2–3 minute pitch/demo link and submission package, complete the privacy/security review, and obtain publication approval. Submission deadline: 11:59 PM Pacific. |
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
