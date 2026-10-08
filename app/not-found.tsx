import Link from "next/link";
import { DynaPuff } from "next/font/google";
import { CircleMark, ClubNavigation, ClubFooter } from "./club-brand";
import "./invitation-home.css";
import "./party.css";
import "./foil-invitation.css";
import "./materials.css";
import "./club-pages.css";
import "./not-found.css";

const bubble = DynaPuff({subsets:["latin"],variable:"--font-bubble",display:"swap"});

export default function NotFound() {
  return <div className={`${bubble.variable} ic-home ic-not-found`}>
    <ClubNavigation/>
    <main className="ic-lost-page" id="main-content">
      <div className="ic-lost-postcard">
        <span className="ic-lost-stamp" aria-hidden="true">RETURN TO<br/>GOOD COMPANY</span>
        <div className="ic-lost-number" aria-hidden="true"><span>4</span><span className="ic-lost-seal"><CircleMark/></span><span>4</span></div>
        <p className="ic-lost-label">404 · PAGE NOT FOUND</p>
        <h1>This page<br/>wandered off.</h1>
        <p className="ic-lost-copy">The club’s this way. 💌</p>
        <Link className="ic-lost-button" href="/" data-sound="happy">Let’s go back! <span aria-hidden="true">↗</span></Link>
      </div>
    </main>
    <ClubFooter/>
  </div>;
}
