import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TableInvitation from "../../table/[token]/page";
import { getDinnerInvitation } from "@/lib/concierge";
import { dinnerIdValid, inviteTokenValid } from "@/lib/dinner-invitation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your private invitation · Interaction Club", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function DinnerInvitation({ params, searchParams }: { params: Promise<{ dinnerId: string }>; searchParams: Promise<{ token?: string | string[] }> }) {
  const { dinnerId } = await params;
  const { token } = await searchParams;
  if (typeof token !== "string" || !inviteTokenValid(token) || !dinnerIdValid(dinnerId)) notFound();
  try { if (!await getDinnerInvitation(dinnerId, token)) notFound(); }
  catch { notFound(); }
  return <TableInvitation params={Promise.resolve({ token })}/>;
}
