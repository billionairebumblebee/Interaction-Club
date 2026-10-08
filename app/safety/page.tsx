import LegalDocument from "../legal-document";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/safety", "Safety | Interaction Club", "Practical guidance for meeting new people, respecting boundaries, and reporting concerns.");

export default function SafetyPage() {
  return <LegalDocument current="/safety" title="Use good judgment." label="SAFETY GUIDELINES" date="July 19, 2026"
    intro="Interaction is for adults meeting new people. Treat every plan as meeting strangers, because that is what it is."
    sections={[
      { title: "Before and during a plan", body: <><p>Meet in a public place. Tell someone you trust where you are going. Arrange your own transportation. Keep control of your food, drink, and belongings. Pay your own way unless you voluntarily arrange a split.</p></> },
      { title: "You can leave", body: <><p>You never owe anyone your time, contact information, or continued participation. Leave if something feels wrong. In an emergency, contact local emergency services.</p></> },
      { title: "What Interaction does not do", body: <><p>We do not screen, background-check, verify, supervise, or guarantee people. We cannot guarantee that a venue can accommodate a dietary or accessibility need; check directly with the venue before attending.</p></> },
    ]} />;
}
