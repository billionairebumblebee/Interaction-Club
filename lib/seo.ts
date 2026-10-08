import type { Metadata } from "next";

export const SITE_URL = "https://www.interaction.club";
export const SITE_DESCRIPTION = "Meet new people through small-group dinners and personal invitations. Join Interaction Club’s free personality quiz to help us make a plan that fits you.";
export const SHARE_IMAGE = {
  url: `${SITE_URL}/invitation-preview.png?v=2`,
  width: 1200,
  height: 630,
  alt: "A sealed envelope with Interaction Club’s pink circle-logo seal. You’re invited.",
};

export function pageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}${path}` },
    openGraph: { type: "website", locale: "en_US", siteName: "Interaction Club", url: `${SITE_URL}${path}`, title, description, images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE.url] },
  };
}

export const PUBLIC_PAGES = ["/", "/how-it-works", "/about", "/philosophy", "/faq", "/join", "/share", "/side-quests", "/sponsors", "/investors", "/privacy", "/terms", "/data", "/safety"];

export const SITE_STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Interaction Club", url: SITE_URL, description: SITE_DESCRIPTION, email: "vivian_yang@berkeley.edu" },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: "Interaction Club", alternateName: "Interaction", publisher: { "@id": `${SITE_URL}/#organization` }, inLanguage: "en-US" },
  ],
};
