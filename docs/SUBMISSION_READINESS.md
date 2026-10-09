# Hackathon submission readiness

Checked October 9, 2026. Draft only: no final submission has been made.

## Confirmed requirements and portal status

- Deadline: Saturday October 10, 11:59 p.m. Pacific.
- Public repository; README with a 2–3 minute pitch/demo video plus what was built, who it is for and how it works.
- Organizer announcement also requests a one-paragraph thesis.
- Calendar deadline entry contains instructions but no submission URL.
- Slack's announcement and workspace search for “submission” did not expose a final submission portal. The organizers say it will be posted in Slack closer to the deadline. The official website links registration and partner forms, not final project submission.
- A focused Berkeley Gmail search for Innovation Intelligence submission/portal messages found the calendar instructions and unrelated sponsor/newsletter correspondence, not a final submission form.
- The team-formation/check-in form is separate. It was completed and acknowledged by the organizer; do not resubmit it as the project entry.
- Final form fields cannot be fully inspected or filled until the portal is available. Do not infer them from the check-in form.
- Live walkthrough and backup demos are ready according to Vivian; the final pitch/video edit remains with her.

## Prepared answers

Project: Interaction Club

Founder: Vivian Yang

Website: https://interaction.club/

Public repository: https://github.com/billionairebumblebee/Interaction-Club

Primary track: Track 5 — Consumer & New Experiences. Use additional tracks only if the final form permits them.

One-sentence idea: Interaction Club turns people's availability, interests and preferences into personal invitations to thoughtfully hosted small-group dinners.

One-paragraph thesis:

Meeting people is not the same as getting to know them. Interaction Club replaces repeated event browsing and coordination with personal invitations to small-group dinners that fit people's availability, interests and preferences. During hackathon week, we rebuilt the invitation-first web experience, shortened intake, connected durable private records to an organizer's Google Sheet, and added host-reviewed grouping, private invitations, consent, RSVPs and dinner-day arrival support. We then recruited real participants and delivered our first Berkeley dinner with three guests plus the founder-host. That pilot exposed practical opportunities around timely confirmations, finding the table and welcoming everyone into the conversation. Community-operator conversations are also testing a business model in which spaces pay for recurring hosted gatherings for their members. The next milestone is a paid pilot and a repeatable workflow another trained host can deliver.

Earlier work / reuse: Problem discovery, informal conversations, an unfinished prototype and the framework/tooling scaffold predate the hackathon. This week's work rebuilt the product experience and operational workflows; not every line of code is new. The README distinguishes earlier work from hackathon-week changes.

Demo URL: the README currently links `full demo.mp4`. Playback was verified in the Berkeley browser and the player shows **1:29**. Drive visibly reports “Anyone with the link” and “No sign-in required”; actual signed-out playback was not verified. Add the remaining pitch explanation and replace this link with Vivian's final 2–3 minute version before submission.

## Access and privacy checks

- Submission checkout: `interaction-club-hackathon`, not the older archive checkout. Local HEAD matched public GitHub main at the start of this check.
- Public repo visibility verified through GitHub.
- Current/history heuristic scan: 257 current files and 295 historical blobs; six findings, all from three synthetic credential fixtures appearing in both current files and history. Each uses `synthetic-test-only`.
- No tracked participant-response exports, private outreach screenshots, recruiter-email image, production environment file or organizer credential was found in the submission file list. The excluded recruiter-image path has no history in this submission repo.
- Live homepage, join, preview/dinner, host-preview, sponsors, investors and sitemap returned HTTP 200.
- Live `/api/admin`, `/api/admin/surveys` and unauthenticated dinner-session requests returned 401. Host-arrival API rejects a missing dinner ID with 400 and its code requires scoped host or organizer authorization for a valid ID.
- A valid-ID unauthenticated host-arrival request and organizer-referrals request both returned 401. The match endpoint rejects GET with 405; this does not substitute for testing its authenticated POST path.
- Preview routes carry noindex and private/no-store headers. No new participant responses or RSVP actions were submitted during this check.
- `/founder-recruiter-email.jpg` returns an HTML fallback, not an image. A 200 alone must not be interpreted as the old screenshot remaining published.
- The bundled public pitch PDF is a 13-page October 6 export. Extracted text contains no participant names checked, email addresses or local paths, but it is stale: old economics and pre-pilot content remain. Do not use it as the final deck without reviewing/replacing the export. Embedded images were not comprehensively visually audited here.
- Final video footage and any replacement deck need a visual privacy review: no real participant profiles, inboxes, personal contact details, private invitation tokens or organizer keys on screen.

## Verification results

Passed: `dinner-name-access-test.cjs`, `dinner-arrival-test.cjs`, `matching-test.cjs`.

Not passing: `dinner-invitation-test.cjs` stops on a missing `./dinner-arrival` dependency mock; `photo-consent-test.cjs` stops on a missing `@/lib/signup-availability` dependency mock. These are test-harness errors, not evidence of a production failure, and need repair/rerun before claiming those suites pass.

## Finish before submitting

1. Obtain the final portal from the organizers' Slack; inspect every section and prepare its exact fields without clicking Submit.
2. Add the final 2–3 minute video, verify duration and signed-out playback, and visually check for private data.
3. Review/publish the README result refresh and decide whether to replace the stale downloadable pitch PDF.
4. Review the completed form with Vivian, submit only after her approval, and save confirmation.

A one-time thread reminder is scheduled for Saturday October 10 at 10 p.m. Pacific, ahead of the 11:59 p.m. deadline. It does not authorize automatic submission.
