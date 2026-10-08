import LegalDocument from "../legal-document";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/data", "Your Data | Interaction Club", "Understand your Interaction Club profile data and how to ask for corrections or deletion.");

export default function DataPage() {
  return <LegalDocument current="/data" title="Your data, plainly." label="DATA PRACTICES" date="July 19, 2026"
    sections={[
      { title: "Why each field exists", body: <><p>Name and email make a formal invite possible. Month and year create age bands. Broad area and availability make a plan feasible. Activity, budget, and table preferences shape the plan. Food, dietary, and accessibility details help avoid obviously bad suggestions.</p></> },
      { title: "Optional means optional", body: <><p>Food likes/dislikes, dietary details, accessibility notes, spontaneous-plan notifications, and interests are optional. They are not used to charge you more or sell you something.</p></> },
      { title: "Who invited you", body: <><p>Personal links help us count completed signups from each inviter. They do not decide who you meet. Creating a link publishes only the display name you agree to show—not your friends’ information. Referral counts are private to organizers.</p></> },
      { title: "Access or deletion", body: <><p>For this invite-only MVP, contact the organizer who sent your invite to ask what we hold about you or to request deletion of your private intake record.</p></> },
      { title: "Retention", body: <><p>We keep intake records only while needed to run the launch and its follow-up plans, then delete or de-identify them when practical.</p></> },
    ]} />;
}
