import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import FounderInvitation from "./founder-invitation";
import "../partners.css";
import "./founders.css";

export const metadata = {
  ...pageMetadata("/founders", "Founders | Interaction Club", "An opt-in Founder Book and thoughtfully curated founder dinners. Explore the next chapter of Interaction Club."),
  robots: { index: false, follow: false },
};

const email = "mailto:vivian_yang@berkeley.edu?subject=Interaction%20Club%20Founder%20Book%20interest";
const call = "https://calendly.com/vivian_yang-berkeley/30min";

export default function FoundersPage() {
  return <div className="ic-partner-page ic-founders-page">
    <header className="ic-partner-hero">
      <div><p className="ic-eyebrow">A NEXT CHAPTER · IN DEVELOPMENT</p>
        <h1>Good companies.<br/><em>Good introductions.</em></h1>
        <p>You’re building something. Let’s help the right people get to know it—and you.</p>
        <p>We’re exploring an opt-in Founder Book and small founder dinners with an experienced investor or operator. Personal invitations, a thoughtful room, and a reason to keep talking.</p>
        <div className="ic-partner-actions"><a className="ic-cta" href={email}>Tell Vivian you’re interested ↗</a><a className="ic-partner-link" href="#founder-book">Meet the Founder Book ↓</a></div>
      </div>
      <FounderInvitation/>
    </header>

    <div className="ic-partner-ribbon"><span>YOUR COMPANY</span><span>YOUR PERMISSION</span><span>A REAL CONVERSATION</span></div>

    <section className="ic-partner-section ic-founder-book-section" id="founder-book" aria-labelledby="founder-book-title">
      <div><p className="ic-eyebrow">THE FOUNDER BOOK · PLANNED</p><h2 id="founder-book-title">A little book.<br/>A better introduction.</h2>
        <p>Think of a resume pack, but for founders and their companies. A short, founder-approved profile that helps a relevant investor understand what you’re building and what kind of help you want.</p>
        <p>We’d refresh it with you from time to time, then share the approved edition with the investors you’ve agreed it can reach. To start, Vivian would handle reviews and updates manually.</p>
      </div>
      <article className="ic-founder-book" aria-label="Illustrative Founder Book cover, not an existing publication"><span>INTERACTION CLUB</span><h3>The<br/>Founder<br/>Book.</h3><p>Your next good introduction.</p><small>Concept preview · not yet distributing</small></article>
    </section>

    <section className="ic-partner-section" aria-labelledby="profile-title"><p className="ic-eyebrow">ONE PAGE, APPROVED BY YOU</p><h2 id="profile-title">The company. The person. The ask.</h2>
      <div className="ic-partner-grid">
        <article className="ic-partner-card"><h3>What you’re building.</h3><p>Your name, company, one-line product, who it serves, and stage.</p></article>
        <article className="ic-partner-card"><h3>What would help.</h3><p>The introductions, expertise, or feedback you’re looking for. Traction is optional; any figure labeled verified needs supporting evidence.</p></article>
        <article className="ic-partner-card"><h3>What stays current.</h3><p>An approved contact link and the date you last confirmed the profile. You review the exact entry before it goes anywhere.</p></article>
      </div>
    </section>

    <section className="ic-partner-section" aria-labelledby="dinner-title"><p className="ic-eyebrow">THE FOUNDER TABLE · PLANNED</p><h2 id="dinner-title">Less pitching into the void.<br/>More passing the plates.</h2>
      <p>A small group of founders, a willing investor or experienced operator, and a host who gives the conversation somewhere to start. Shared interests and what people want help with would shape the group.</p>
      <p>The guest list can be a surprise. The purpose won’t be: your invitation will tell you it’s a professional founder gathering and whether an investor is attending, along with the time, cost, and plan.</p>
      <p>We’re looking for interest, not promising an investor seat or a funding outcome. The first step is finding a group and a guest who genuinely want the conversation.</p>
    </section>

    <section className="ic-partner-section" aria-labelledby="permissions-title"><p className="ic-eyebrow">YOU CHOOSE WHAT LEAVES THE ROOM</p><h2 id="permissions-title">An introduction.<br/>Not a data handoff.</h2>
      <p>Joining a dinner is not permission to put you in a book. Before any distribution, we’d ask separately about:</p>
      <ul className="ic-founder-permissions">
        <li><strong>Profile inclusion</strong><span>Whether your approved company profile belongs in the Founder Book.</span></li>
        <li><strong>Investor distribution</strong><span>Which investors or clearly described recipient group may receive that edition.</span></li>
        <li><strong>Contact sharing</strong><span>Which contact link, if any, may be included. You can keep introductions host-mediated.</span></li>
        <li><strong>Public listing</strong><span>A separate, optional choice. A private book does not put your profile on the public website.</span></li>
      </ul>
      <p>Your private quiz answers stay out of the book. You can request an update or removal by emailing Vivian; we’ll stop future distribution of your entry and ask prior recipients to remove it. We can’t recall copies they already downloaded.</p>
    </section>

    <section className="ic-partner-section"><p className="ic-eyebrow">FOR INVESTORS & COMMUNITY OPERATORS</p><h2>Bring your curiosity.<br/>We’ll talk about the room.</h2>
      <p>Interested in meeting founders in a particular space? Tell Vivian what kinds of companies and conversations would be useful. We can explore a scoped discovery, curation, and hosting service—or invite you as a valued guest without a participation fee.</p>
      <p>These are proposed formats, not active investor partnerships. Any fees, purpose, and participation would be agreed up front. A guest’s name or company would appear in an invitation only with their permission. Participation is not an endorsement or an investment commitment.</p>
    </section>

    <aside className="ic-partner-invite"><p className="ic-eyebrow">LET’S START WITH A CONVERSATION</p><h2>What are you building?</h2><p>Email Vivian with your company and the kind of connection you’re looking for. This starts a conversation—it does not enroll your profile or authorize sharing.</p>
      <div className="ic-partner-actions"><a className="ic-cta" href={email}>Email Vivian ↗</a><a className="ic-partner-link" href={call} target="_blank" rel="noopener noreferrer">Book a call ↗</a><Link className="ic-partner-link" href="/join">Just here to meet people? ↗</Link></div>
      <p className="ic-founder-status">The dinner pilot comes first. The Founder Book is a proposed next step; no book automation or investor network is being claimed.</p>
    </aside>
  </div>;
}
