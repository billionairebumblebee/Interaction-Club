import type { Metadata } from "next";
import { Bitter, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import "./interaction-experience.css";
import { InteractionExperience } from "./interaction-experience";
import BalloonOutlines from "./balloon-outlines";
import PageScrollBoundary from "./page-scroll-boundary";
import WebsiteLoading from "./website-loading";
import "./website-loading.css";
import { MAIN_MOTTO } from "../lib/brand";
import { SITE_URL, SITE_DESCRIPTION, SHARE_IMAGE, SITE_STRUCTURED_DATA } from "../lib/seo";
import "./brand-typography.css";

const glacial = localFont({ variable: "--font-body", display: "swap", src: [
  { path: "../public/fonts/glacial-indifference/GlacialIndifference-Regular.woff2", weight: "400", style: "normal" },
  { path: "../public/fonts/glacial-indifference/GlacialIndifference-SemiBold.woff2", weight: "600", style: "normal" },
  { path: "../public/fonts/glacial-indifference/GlacialIndifference-Bold.woff2", weight: "700", style: "normal" },
] });
const bitter = Bitter({ variable: "--font-editorial", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `Interaction Club — ${MAIN_MOTTO}`,
  description: SITE_DESCRIPTION,
  openGraph: { type: "website", locale: "en_US", siteName: "Interaction Club", title: "Interaction Club", description: SITE_DESCRIPTION, images: [SHARE_IMAGE] },
  twitter: { card: "summary_large_image", title: "Interaction Club", description: SITE_DESCRIPTION, images: [SHARE_IMAGE.url] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('interaction.appearance');document.documentElement.dataset.appearance=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}catch(e){document.documentElement.dataset.appearance='light'}" }}/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_STRUCTURED_DATA).replace(/</g, "\\u003c") }}/></head><body id="top" className={`${glacial.variable} ${bitter.variable} ${geistMono.variable}`}><WebsiteLoading/><BalloonOutlines/><PageScrollBoundary/><InteractionExperience>{children}</InteractionExperience></body></html>;
}
