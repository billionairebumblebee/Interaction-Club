import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { ClubPageHeading } from "../../club-page-content";
import { ClubChapter, ClubEditorialInvitation, ClubEssay } from "../../club-editorial";
import { cancellationPolicy } from "@/lib/attendance";

export const metadata = pageMetadata("/how-it-works", "How It Works | Interaction Club", "Tell us what works for you. Get a small-group invitation. Decide whether to join, then meet in real life.");

export default function HowItWorksPage() {
  return <>
    <ClubPageHeading label="HOW IT WORKS" title="You bring yourself. We start the plan.">Small-group dinners for people 18 and older. Joining is free. The cost of an actual plan is always specific to its invitation.</ClubPageHeading>
    <ClubEssay>
      <ClubChapter number={1} title="Tell us what works for you.">
        <p>Start with the practical things: when you’re available, what you’d like to do, your spending limit, and the kind of evening you want. You can add interests and relevant food or accessibility needs, too. You don’t need a perfect bio.</p>
        <p>We use a broad base area, not a live location. Optional questions stay optional. Food and accessibility details help the organizer check the venue; they aren’t a reason to sort you away from other people. Specific accommodations still need to be confirmed with the venue.</p>
      </ClubChapter>
      <ClubChapter number={2} title="We put together a possible evening.">
        <p>An organizer reviews suggested groups and puts the invitation together. The matching tool checks availability, age group, activity, budget, the table formats you chose, and whether you already have an upcoming invitation. Interests and different perspectives help shape the group within those practical limits.</p>
        <p>Joining the club puts you in the matching pool, not at a reserved table. A dinner isn’t guaranteed. We keep groups small and send separate dinner invitations when there’s a fit and room to host. If demand exceeds our hosting capacity, we’ll let you know you’re on the waitlist.</p>
      </ClubChapter>
      <ClubChapter number={3} title="Open your invitation.">
        <p>You’ll see what kind of evening it is, where and when to go, the full per-person cost and what it includes, and when to respond. The invitation also says whether there’s a host or the plan is self-guided, plus any sponsor involvement or planned professional purpose.</p>
        <p>You won’t browse a guest list to decide whether the other people look interesting enough. You’re choosing the experience. The practical details should be clear before you say yes, including how payment or splitting the bill will work.</p>
      </ClubChapter>
      <ClubChapter number={4} title="Accept or pass. Both are fine.">
        <p>If the plan works, accept your private invitation before its deadline. If it doesn’t, pass. Declining an evening isn’t rejecting a person, and it doesn’t count as cancelling an accepted RSVP.</p>
        <p>Your dinner invitation is for one specific plan, not every event. You can invite a friend to join the club, but that doesn’t reserve them a dinner seat or a place at your table. Ask the organizer before bringing someone. If you cancel, ask before rejoining too—your place may already have been offered to someone else.</p>
        <p>Free signup doesn’t mean every meal or future experience is free. Decide using the cost in your invitation, not a guess.</p>
      </ClubChapter>
      <ClubChapter number={5} title="Show up and settle in.">
        <p>When you arrive, tap “I’m here” on your invitation. Check-in opens 30 minutes before the start and closes when the event ends. It doesn’t track your location. If you miss the tap, the organizer can confirm your attendance; it isn’t automatically a no-show.</p>
        <p>For a hosted plan, the invitation names the host. For a self-guided plan, nobody is secretly assigned the job of running the evening. Hosting should be something you agree to, not a responsibility you discover at the table.</p>
        <p>Bring some curiosity, give other people room to talk, and keep your phone available for whatever you need. You don’t have to perform being the most outgoing person there.</p>
      </ClubChapter>
      <ClubChapter number={6} title="Tell us how it really went.">
        <p>Before the event, an optional check-in asks how you feel about going and whether the match makes sense to you. Afterward, tell us privately how the group felt, how easy it was to join the conversation, and whether you’d want to meet again. There’s also a separate way to share a concern.</p>
        <p>If you want to stay in touch, ask each other before exchanging contact details. Then come back and tell us if you make another plan or actually meet again. Those are different from enjoying the first evening, and we want to learn about both.</p>
        <p>{cancellationPolicy} You’ll see the policy when you RSVP and a warning before confirming a late cancellation. <Link href="/terms">Read the attendance terms</Link> or <Link href="/safety">visit the safety page</Link>.</p>
      </ClubChapter>
    </ClubEssay>
    <ClubEditorialInvitation>Less planning in circles. More actual plans.</ClubEditorialInvitation>
  </>;
}
