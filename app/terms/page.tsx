import { participationTermsSections } from "./terms-content";
import LegalDocument from "../legal-document";
import { pageMetadata } from "@/lib/seo";
import { PARTICIPATION_TERMS_VERSION } from "@/lib/participation-terms";

export const metadata = pageMetadata("/terms", "Terms of Use | Interaction Club", "The terms for joining Interaction Club and participating in small-group plans, including attendance, costs, and responsibilities.");

export default function TermsPage() {
  return <LegalDocument current="/terms" title="Terms of Use" label={`PARTICIPATION TERMS · ${PARTICIPATION_TERMS_VERSION}`} date="October 8, 2026"
    intro="Interaction Club, operated by Vivian Yang, helps adults meet through curated plans and hosted experiences. These terms apply to club participation; activity-specific conditions will be shared before you accept a particular outing."
    sections={participationTermsSections} />;
}
