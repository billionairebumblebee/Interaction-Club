import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { ClubPageHeading, ClubPageInvitation } from "../../club-page-content";

export const metadata = pageMetadata("/faq", "FAQ | Interaction Club", "Questions about invitations, budgets, food preferences, and meeting your group.");

export default function FaqPage() {
  return <><ClubPageHeading label="FAQ" title="Before you pull up.">The details before you say yes.</ClubPageHeading><div className="ic-faq-list">
    <details><summary>Who is this for?</summary><p>People 18+ who want to meet new people through small-group plans.</p></details>
    <details><summary>Does it cost anything to join?</summary><p>Joining is free. You pay for food and agreed activities. Costs are shared before you accept.</p></details>
    <details><summary>Am I booking a dinner when I sign up?</summary><p>No. You’re joining the club’s matching pool. A dinner isn’t guaranteed. If there’s a group that fits and room to host, we’ll send a separate invitation with the time, place, and cost for you to accept.</p></details>
    <details><summary>Is there a waitlist?</summary><p>When more people want to join than we can host, yes. We’ll tell you if you’re on the waitlist. Openings depend on availability, group fit, and hosting capacity—not a promised dinner date.</p></details>
    <details><summary>Can I invite a friend?</summary><p>Yes—invite them to fill out their own profile and join the matching pool. A club invitation isn’t a dinner reservation or a plus-one.</p></details>
    <details><summary>How do you choose the group?</summary><p>By hand, using availability, location, budget, group preferences, and interests. Optional answers aren’t required.</p></details>
    <details><summary>What if I have dietary or accessibility needs?</summary><p>Tell us in the form. Needs guide venue choices, not who you meet. Accommodations aren’t guaranteed; confirm essentials with the venue before accepting.</p></details>
    <details><summary>What if I can’t make it anymore?</summary><p>Use the contact in your invitation to cancel early—ideally a day ahead. People who opted into spontaneous plans may receive openings 1–3 days out.</p></details>
    <details><summary>Do I have to share my exact location?</summary><p>No home address or live location—just a broad area. See <Link href="/privacy">Privacy</Link> and <Link href="/data">Your data</Link> for details.</p></details>
    <details><summary>What should I know about meeting new people?</summary><p>Meet at the agreed public venue, respect each other’s boundaries, and make a plan for getting home. Interaction Club doesn’t include identity or background checks. Read our <Link href="/safety">safety guidance</Link> before your first gathering.</p></details>
    <details><summary>What happens after dinner?</summary><p>Tell us privately if you’d meet again. Exchange details and make your own plans if you click.</p></details>
  </div><ClubPageInvitation/></>;
}
