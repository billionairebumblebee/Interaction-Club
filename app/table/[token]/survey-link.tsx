import Link from "next/link";
import { surveyWindow } from "@/lib/event-surveys";

export default function SurveyLink({ token, table }: { token: string; table: { status: string; startsAt: string; endsAt?: string } }) {
  const available = surveyWindow(table);
  return <aside style={{ marginTop: 32, padding: 24, border: "2px solid #8091df", borderRadius: 24 }}>
    <h2>{available.after ? "How was it, really?" : "Before you go."}</h2>
    <p>{available.after ? "How did you feel? Did the group fit? Tell us privately." : available.before ? "Excited, nervous, or unsure about the match? Tell us how you’re feeling and whether the plan fits what you asked for." : "The after-event survey opens when your event ends."}</p>
    {(available.before || available.after) && <Link className="exp-button dark" href={`/table/${token}/feedback`}>{available.after ? "Share my experience" : "Before-event survey (optional)"} ↗</Link>}
    <p><Link href={`/table/${token}/feedback?view=concern`}>Something wrong? Share a private concern.</Link></p>
  </aside>;
}
