import type { Metadata } from "next";
import EventSurvey from "./survey";

export const metadata: Metadata = { title: "How was it? — Interaction", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function FeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <EventSurvey token={token}/>;
}
