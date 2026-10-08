import Link from "next/link";
import SideQuestArt from "../../side-quest-art";
import { pageMetadata } from "@/lib/seo";
import { ClubPageHeading } from "../../club-page-content";
import QuestInvitation from "./quest-invitation";
import SideQuestBadge from "../../side-quest-badge";
import "./side-quests.css";

export const metadata = pageMetadata("/side-quests", "Side Quests | Interaction Club", "Amusement parks, day trips, and random little adventures. Tell Interaction Club what sounds fun and when you’re free.");

export default function SideQuestsPage() {
  return <>
    <ClubPageHeading label="SIDE QUESTS" title="Someone to do the thing with.">The idea you keep saving for someday? Let’s give it a group.</ClubPageHeading>
    <QuestInvitation/>
    <p className="ic-quest-art-caption">The dinner was only chapter one.</p>
    <SideQuestArt/>
    <p className="ic-quest-art-caption">A few things we could get up to. Which one’s your kind of day?</p>
    <SideQuestBadge/>
    <section className="ic-quest-explainer"><p className="ic-eyebrow">YOUR INTERESTS FIRST. THE PLAN NEXT.</p><h2>We’re down.<br/>What are you down for?</h2><div className="ic-quest-benefits"><article><h3>Tell us your kind of fun.</h3><p>A big day out or something close to home. Share an idea and the days that usually work.</p></article><article><h3>Get a real invitation.</h3><p>We’ll shape outings around the interest. You’ll see the time, place, full cost, and access details before you RSVP.</p></article><article><h3>Come as you are.</h3><p>Meet people while doing something together. No networking pitch or social-posting assignment.</p></article></div><Link href="/join?side-quests=1" className="ic-cta">Tell us what you’re down for ↗</Link><p className="ic-quest-small">Already filled out the quiz? No need to submit it again. Your optional side-quest answers are already part of your profile.</p></section>
    <section className="ic-quest-explainer ic-quest-perks"><p className="ic-eyebrow">FOR BRANDS WITH A SENSE OF HUMOR</p><h2>We’ll make<br/>you cool.</h2><p>Help get the bus there. Pick up the snacks. Make a ridiculous little adventure possible—and give people a reason to remember your brand.</p><p>We’ll bring the ideas, invitations, and good company. Together, we can make something worth talking about.</p><Link href="/sponsors" className="ic-cta">Sponsor a side quest ↗</Link><p className="ic-quest-small">Sponsor support is disclosed in the invitation. Let’s agree on the experience and how we’ll measure it.</p></section>
  </>;
}
