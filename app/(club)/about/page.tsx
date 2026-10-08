import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { CircleMark } from "../../club-brand";
import { ClubPageHeading } from "../../club-page-content";
import { ClubChapter, ClubEditorialInvitation, ClubEssay } from "../../club-editorial";
import "./about.css";

export const metadata = pageMetadata("/about", "About | Interaction Club", "Meet Vivian, the founder of Interaction Club. Small groups, real invitations, and a reason to meet.");

export default function AboutPage() {
  return <>
    <ClubPageHeading label="ABOUT THE CLUB" title="Good company. An actual plan.">A small group, a thoughtful invitation, and enough time to actually talk.</ClubPageHeading>
    <section className="ic-founder" aria-labelledby="meet-vivian">
      <figure className="ic-founder-portrait">
        <span className="ic-founder-tape" aria-hidden="true"/>
        <div className="ic-founder-photo"><Image src="/vivian-headshot.jpg" width={1200} height={1801} sizes="(max-width: 760px) 85vw, 440px" alt="Vivian Yang, founder of Interaction Club, on the UC Berkeley campus." priority/></div>
        <figcaption>Vivian Yang <span>your first host</span></figcaption>
        <div className="ic-founder-seal" aria-hidden="true"><CircleMark/></div>
      </figure>
      <div className="ic-founder-note">
        <p className="ic-founder-label">A REAL PERSON BEHIND THE INVITATION</p>
        <h2 id="meet-vivian">Hi, I’m Vivian.</h2>
        <p className="ic-founder-intro">I’m a UC Berkeley student building Interaction Club. I want meeting new people to feel like getting invited somewhere—not another thing on your to-do list.</p>
        <p>We bring people together over small dinners. Good company, a little intention, and a reason to make another plan.</p>
        <nav className="ic-founder-socials" aria-label="Follow Vivian">
          <a href="https://www.instagram.com/vivianbuilds/" target="_blank" rel="noopener noreferrer"><span>Instagram</span><strong>@vivianbuilds ↗</strong></a>
          <a href="https://www.tiktok.com/@vivianbuilds" target="_blank" rel="noopener noreferrer"><span>TikTok</span><strong>@vivianbuilds ↗</strong></a>
        </nav>
        <Link className="ic-cta" href="/join">Come join us <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
    <div className="ic-founder-ribbon" aria-hidden="true"><span>PERSONAL INVITATIONS</span><CircleMark/><span>REAL PEOPLE</span><CircleMark/><span>AN ACTUAL PLAN</span></div>
    <ClubEssay>
      <ClubChapter title="A note from Vivian.">
        <p>I’m Vivian, a UC Berkeley student and the founder of Interaction Club.</p>
        <p>After a guest-speaker dinner, I kept thinking about how much the person hosting mattered. Someone welcomed everyone, made room for the conversation, and helped the table feel like a place you wanted to be.</p>
        <p>At another founder event, I spent most of the evening talking to one person instead of trying to meet the entire room. That conversation gave me more than another round of introductions would have.</p>
        <p>Those experiences helped clarify what I wanted to build. Not another list of people to message. A reason to meet them, with the awkward planning part already started.</p>
      </ClubChapter>
      <ClubChapter title="The people are the point.">
        <p>A venue, good food, and a cute invitation can make an evening appealing. But the people are what make it worth showing up.</p>
        <p>We want people looking for a similar experience without making everyone at the table the same person. Shared intent. Different perspectives. Room for something unexpected. You shouldn’t need an impressive introduction to have something interesting to say.</p>
      </ClubChapter>
      <ClubChapter title="First, make one table work.">
        <p>We bring people together over small-group dinners and learn what makes an introduction turn into another plan. We listen to what works and what doesn’t, and make the next invitation better.</p>
        <p>The longer-term vision includes other experiences and thoughtful partnerships with organizations. Some could be more elaborate or premium. That’s a direction we want to explore, not a list of experiences we already offer.</p>
        <p className="ic-editorial-aside">You don’t need a perfect introduction. Just curiosity, a little time, and a willingness to show up.</p>
      </ClubChapter>
    </ClubEssay>
    <ClubEditorialInvitation>Start with one good evening.</ClubEditorialInvitation>
  </>;
}
