import { pageMetadata } from "@/lib/seo";
import { ClubPageHeading } from "../../club-page-content";
import { ClubChapter, ClubEditorialInvitation, ClubEssay } from "../../club-editorial";

export const metadata = pageMetadata("/philosophy", "Our Philosophy | Interaction Club", "Real invitations, practical plans, and friendships that happen away from the screen. What guides Interaction Club.");

export default function PhilosophyPage() {
  return <>
    <ClubPageHeading label="OUR PRODUCT PHILOSOPHY" title="An invitation, not another feed.">We don’t want you to spend your evening shopping for people. We want you to have something to look forward to.</ClubPageHeading>
    <ClubEssay>
      <ClubChapter title="Choose the evening. Discover the people.">
        <p>The guest list isn’t the product. Some of the fun is finding out who you’ll meet, without deciding how you feel about everyone from a photo and a few lines of a bio.</p>
        <p>We want you to preview the vibe, not browse faces, profiles, or details that identify the other guests. But a little mystery about the people should never mean mystery about the plan. Time, place, full cost, whether someone is hosting, and any sponsor or professional purpose belong in the invitation.</p>
      </ClubChapter>
      <ClubChapter title="Similar intent doesn’t mean identical people.">
        <p>A chill dinner shouldn’t accidentally become a pitch night. What you want out of the evening matters, whether that’s talking about something you’re building or getting out and meeting someone new.</p>
        <p>Within that shared intent, different backgrounds and perspectives make things interesting. Matching only by job title would miss a lot. We’d rather find a reason for people to start talking than assume they need to have everything in common.</p>
      </ClubChapter>
      <ClubChapter title="Make people feel wanted, not marketed to.">
        <p>A personal welcome can change how it feels to walk into a room. An invitation with your name on it, a clear plan, and someone making space for you can matter more than an elaborate production.</p>
        <p>That’s the feeling we want to build around. Not endless swiping, or making people prove they’re important enough to belong. A smaller group should make it easier to connect, not turn the evening into a popularity contest.</p>
      </ClubChapter>
      <ClubChapter title="Be here while you’re here.">
        <p>Give the people in front of you a chance. Put the scrolling aside, make room for someone quieter to speak, and take a call away from the table when you can.</p>
        <p>Phone-light doesn’t mean inaccessible or unreachable. Essential calls, accessibility tools, and anything you need to feel safe are welcome. We’re asking for attention, not control of your phone.</p>
      </ClubChapter>
      <ClubChapter title="Sponsorship should improve the evening.">
        <p>If we work with sponsors in the future, the partnership should give people something worth having: a good meal, a thoughtful activity, or an experience that makes sense for the group. Not a table full of ads.</p>
        <p>The invitation should say who’s involved and why, including any planned recruiting, research, or sales purpose. Turning up should never be treated as permission to hand over your information or an obligation to post about a brand. We’re describing how we want partnerships to work, not claiming those partnerships are already in place.</p>
      </ClubChapter>
      <ClubChapter title="The second plan matters.">
        <p>Being interested, saying yes, showing up, and choosing to meet again are different things. A fun dinner matters. So does finding out whether anyone makes another plan without us arranging it.</p>
        <p>That’s why we ask for honest, private feedback, including when the group wasn’t a fit. We can start an introduction. We can’t promise instant best friends, and we don’t want to mistake a nice evening for a friendship that hasn’t happened yet.</p>
      </ClubChapter>
    </ClubEssay>
    <ClubEditorialInvitation>A little curiosity goes a long way.</ClubEditorialInvitation>
  </>;
}
