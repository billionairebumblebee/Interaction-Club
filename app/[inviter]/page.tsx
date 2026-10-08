import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DynaPuff } from "next/font/google";
import InvitationHome from "../invitation-home";
import DinnerInvitation from "../dinner-001/invitation";
import { resolveInviter } from "../../lib/referrals";
import { SHARE_IMAGE } from "../../lib/seo";

const bubble = DynaPuff({ subsets: ["latin"], variable: "--font-bubble", display: "swap" });
type Props = { params: Promise<{ inviter: string }> };
function dinnerSlug(slug: string) {
  const match = /^dinner-?(\d{1,6})$/i.exec(slug);
  return match && Number(match[1]) > 0 ? `dinner-${String(Number(match[1])).padStart(3, "0")}` : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).inviter;
  if (dinnerSlug(slug)) return { title: "Your dinner invitation · Interaction Club", description: "Enter your invited first name to open your letter.", robots: {index:false,follow:false}, referrer:"no-referrer", openGraph:{title:"You’re invited 💌",images:[SHARE_IMAGE]} };
  const inviter = await resolveInviter(slug);
  if (!inviter) return {};
  return {
    robots: { index: false, follow: true },
    title: `${inviter.name} invited you — Interaction Club`,
    description: `A personal invitation from ${inviter.name}. Meet new people over dinner.`,
    openGraph: { title: `${inviter.name} invited you`, description: "There’s a place for you at Interaction Club.", images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title: `${inviter.name} invited you`, description: "There’s a place for you at Interaction Club.", images: [SHARE_IMAGE.url] },
  };
}

export default async function InviterPage({ params }: Props) {
  const { inviter: slug } = await params;
  const dinnerId = dinnerSlug(slug);
  if (dinnerId) {
    if (slug !== dinnerId) redirect(`/${dinnerId}`);
    return <div className={bubble.variable}><DinnerInvitation dinnerId={dinnerId}/></div>;
  }
  const inviter = await resolveInviter(slug);
  if (!inviter) notFound();
  if (slug !== inviter.slug) redirect(`/${inviter.slug}`);
  return <div className={bubble.variable}><InvitationHome inviter={inviter}/></div>;
}
