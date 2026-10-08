"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DynaPuff } from "next/font/google";
import { againOptions, connectionOptions, experienceOptions, hopeOptions, questionsFor, type SurveyAnswers, type SurveyKind } from "@/lib/event-surveys";
import "./survey.css";

const bubble = DynaPuff({ subsets: ["latin"], variable: "--survey-bubble", weight: ["500", "600"] });
type Saved = SurveyAnswers & { submittedAt: string };
type SurveyData = { table: { activity: string; venueName: string; startsAt: string }; available: { before: boolean; after: boolean }; before: Saved | null; after: Saved | null };
const empty: SurveyAnswers = { note: "", followUp: false, hopes: [] };

export default function EventSurvey({ token }: { token: string }) {
  const [data, setData] = useState<SurveyData | null>(null);
  const [kind, setKind] = useState<SurveyKind>("after");
  const [answers, setAnswers] = useState<SurveyAnswers>(empty);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/table/${token}/survey`, { signal: controller.signal, cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
      const requested = new URLSearchParams(window.location.search).get("view");
      const initial: SurveyKind = requested === "concern" ? "concern" : requested === "before" && result.available.before ? "before" : result.available.after ? "after" : result.available.before ? "before" : "concern";
      setKind(initial); setAnswers(initial === "concern" ? empty : result[initial] || empty); setError("");
    }).catch(error => { if (!controller.signal.aborted) setError(error.message || "Please try again."); });
    return () => controller.abort();
  }, [token, loadAttempt]);
  function switchTo(next: SurveyKind) { setKind(next); setAnswers(next === "concern" ? empty : data?.[next] || empty); setSaved(false); setError(""); }
  const patch = (value: Partial<SurveyAnswers>) => { setAnswers(current => ({ ...current, ...value })); setSaved(false); };
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setSaved(false);
    try {
      const response = await fetch(`/api/table/${token}/survey`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...answers, kind }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Your response wasn’t saved. Please try again.");
      setSaved(true);
      if (kind !== "concern") setData(current => current ? { ...current, [kind]: { ...answers, submittedAt: result.submittedAt } } : current);
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  const noteFields = <>
    <label className="survey-note">{kind === "before" ? "What, if anything, would help you feel more ready to go? (optional)" : kind === "concern" ? "What happened?" : answers.experience === "I didn’t attend" ? "What could we change to make a future plan easier to attend? (optional)" : "What should we keep or change about the group or plan? (optional)"}<textarea aria-describedby="survey-note-help" maxLength={2000} rows={4} required={kind === "concern"} value={answers.note} onChange={event => patch({ note: event.target.value })}/></label>
    <p id="survey-note-help" className="survey-help">{kind === "before" ? "For example: knowing more about the group, clearer arrival instructions, or a different activity or budget. You can tell us if the match feels off." : kind === "concern" ? "If you’re comfortable, tell us when and where it happened, what was said or done, and what help you’d like. Share only what you want to." : answers.experience === "I didn’t attend" ? "For example: a different time, lower cost, easier transport, or clearer information." : "For example: shared interests, chances to speak, group size, the activity, or an unexpected cost. A specific moment helps us understand."}</p>
    <label className="survey-follow"><input type="checkbox" checked={answers.followUp} onChange={event => patch({ followUp: event.target.checked })}/>It’s okay to contact me about this response.</label>
  </>;
  const specificQuestions = <>{questionsFor(kind, answers.experience).map(question => <fieldset key={question.id}><legend>{question.label} <small>Optional · choose one</small></legend>{question.help && <p className="survey-question-help" id={`help-${question.id}`}>{question.help}</p>}<div className="survey-choices" aria-describedby={question.help ? `help-${question.id}` : undefined}>{question.options.map(option => <button type="button" key={option} aria-pressed={answers.questionAnswers?.[question.id] === option} onClick={() => { const next = { ...answers.questionAnswers }; if (next[question.id] === option) delete next[question.id]; else next[question.id] = option; patch({ questionAnswers: next }); }}>{option}</button>)}</div></fieldset>)}</>;
  return <main className={`event-survey ${bubble.variable}`}>
    <nav><Link className="survey-wordmark" href="/">interaction<span>•</span></Link><Link href={`/table/${token}`}>Your invitation ↗</Link></nav>
    <section className="survey-card">
      {!data ? <><h1>A little check-in.</h1><p role={error ? "alert" : "status"}>{error || "Opening your check-in…"}</p>{error && <button onClick={() => setLoadAttempt(value => value + 1)}>Try again</button>}</> : <>
        <p className="survey-context">{data.table.activity} · {data.table.venueName} · {new Date(data.table.startsAt).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric" })}</p>
        <div className="survey-tabs" aria-label="Choose a check-in">
          {data.available.before && <button disabled={busy} aria-pressed={kind === "before"} onClick={() => switchTo("before")}>Before you go</button>}
          {data.available.after && <button disabled={busy} aria-pressed={kind === "after"} onClick={() => switchTo("after")}>How was it?</button>}
          <button disabled={busy} aria-pressed={kind === "concern"} onClick={() => switchTo("concern")}>Share a concern</button>
        </div>
        <h1>{kind === "before" ? "Before you go." : kind === "after" ? "Give us the real version." : "We’re listening."}</h1>
        <p>{kind === "before" ? "How are you feeling, and does this match make sense for you? Answer what you want; this won’t affect your spot." : kind === "after" ? "Tell us how you felt, how the group fit, and what the plan was actually like. One answer is enough; the rest is optional." : "Tell the organizer what happened and what help you’d like."}</p>
        <p className="survey-private">Private to the Interaction organizers, not your group. Linked to your invitation—not anonymous.</p>
        {saved ? <div className="survey-thanks" role="status"><h2>{kind === "concern" ? "Your report is saved." : "Thanks for being honest."}</h2><p>{kind === "concern" ? "It’s in the private organizer inbox. This isn’t monitored in real time." : kind === "before" ? "We’ve saved your check-in. See you there." : "Your answer helps shape the next one. You can return here to update it—including if you meet again."}</p>{answers.followUp && <p>You’ve said it’s okay for us to follow up using your signup contact.</p>}{kind !== "concern" && <button onClick={() => setSaved(false)}>Edit my answers</button>}{kind === "after" && <button onClick={() => switchTo("concern")}>Need to share a concern?</button>}</div> : <form onSubmit={submit}>
          <fieldset disabled={busy} className="survey-fields">
            {kind !== "after" && specificQuestions}
            {kind === "before" && <fieldset><legend>What would make this a good time? <small>Please select all that fit.</small></legend><div className="survey-choices">{hopeOptions.map(option => <button type="button" key={option} aria-pressed={answers.hopes?.includes(option) || false} onClick={() => patch({ hopes: answers.hopes?.includes(option) ? answers.hopes.filter(value => value !== option) : [...answers.hopes || [], option] })}>{option}</button>)}</div></fieldset>}
            {kind === "after" && <>
              <fieldset><legend>Overall, how was this event for you? <small>Required</small></legend><div className="survey-choices survey-verdict">{experienceOptions.map(option => <label key={option} data-selected={answers.experience === option}><input type="radio" name="experience" required value={option} checked={answers.experience === option} onChange={() => patch({ experience: option, ...((option === "I didn’t attend") !== (answers.experience === "I didn’t attend") ? { questionAnswers: {}, meetAgain: undefined, connection: undefined } : {}) })}/><span>{option}</span></label>)}</div></fieldset>
              <details className="survey-more"><summary>Add a little more (optional)</summary>
              {answers.experience && specificQuestions}
              {answers.experience && answers.experience !== "I didn’t attend" && <>
                <fieldset><legend>Would you like to see this group again? <small>Optional</small></legend><div className="survey-choices">{againOptions.map(option => <button type="button" aria-pressed={answers.meetAgain === option} key={option} onClick={() => patch({ meetAgain: answers.meetAgain === option ? undefined : option })}>{option}</button>)}</div></fieldset>
                <fieldset><legend>Have you made plans or met again with anyone from this group, outside Interaction? <small>Optional · come back and update this later.</small></legend><div className="survey-choices">{connectionOptions.map(option => <button type="button" aria-pressed={answers.connection === option} key={option} onClick={() => patch({ connection: answers.connection === option ? undefined : option })}>{option}</button>)}</div></fieldset>
              </>}
              {noteFields}
              </details>
            </>}
            {kind !== "after" && noteFields}
            {kind === "concern" && <p className="survey-help">You don’t have to agree to follow-up to send a report. This form isn’t monitored in real time. For immediate danger, contact local emergency services.</p>}
            <button className="survey-submit" type="submit">{busy ? "Saving…" : kind === "concern" ? "Send privately" : data[kind] ? "Update my answers" : "Send my answer"}</button>
          </fieldset>
          {error && <p className="survey-error" role="alert">{error}</p>}
        </form>}
        {kind === "before" && !saved && <Link className="survey-skip" href={`/table/${token}`}>Skip this · back to my invitation</Link>}
      </>}
    </section>
    <footer><Link href="/privacy">Privacy</Link><Link href="/safety">Safety</Link><span>Good company starts with listening.</span></footer>
  </main>;
}
