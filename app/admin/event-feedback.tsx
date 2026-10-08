"use client";
import { useEffect, useState } from "react";
import type { ApplicationRecord, TableRecord } from "@/lib/concierge";
import { questionsFor, type SurveyRecord } from "@/lib/event-surveys";

export default function EventFeedback({ adminKey, tables, people }: { adminKey: string; tables: TableRecord[]; people: ApplicationRecord[] }) {
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/surveys", { headers: { "x-interaction-admin-key": adminKey }, cache: "no-store", signal: controller.signal }).then(async response => {
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setSurveys(result.surveys); setError(""); setLoading(false);
    }).catch(error => { if (!controller.signal.aborted) { setError(error.message); setLoading(false); } });
    return () => controller.abort();
  }, [adminKey, refresh]);
  const concerns = surveys.filter(response => response.kind === "concern");
  return <section style={{ gridColumn: "1 / -1" }}>
    <h2>Private event feedback</h2>
    <p>Before check-ins, honest verdicts, and private concerns. No answers are shown to the group or copied to the response Sheet.</p>
    <button className="exp-button" disabled={loading} onClick={() => { setLoading(true); setRefresh(value => value + 1); }}>{loading ? "Loading feedback…" : "Refresh feedback"}</button>
    {error && <p role="alert" className="exp-error">{error}</p>}
    {!!concerns.length && <div style={{ borderLeft: "4px solid #df3373", paddingLeft: 18, marginTop: 24 }}><h3>Private concerns ({concerns.length})</h3><p>Review these separately from satisfaction scores. Follow-up permission is shown on each report.</p>{concerns.map(response => <FeedbackResponse key={response.id} response={response} name={people.find(person => person.id === response.applicationId)?.fullName || "Former attendee"} event={tables.find(table => table.id === response.tableId)?.venueName}/>)}</div>}
    {tables.map(table => {
      const responses = surveys.filter(response => response.tableId === table.id && response.kind !== "concern");
      const after = responses.filter(response => response.kind === "after");
      const attended = after.filter(response => response.experience !== "I didn’t attend");
      return <article className="host-guest" key={table.id}>
        <h3>{table.activity} · {table.venueName} · {new Date(table.startsAt).toLocaleDateString()}</h3>
        <p>{after.length} of {table.members.length} invited people responded after the event. {after.length - attended.length} said they didn’t attend. No response is not a negative response.</p>
        <p><b>Event experience:</b> {attended.filter(response => response.experience === "Loved it").length}/{attended.length} attending respondents loved it. {attended.filter(response => response.experience === "I had a bad experience").length} reported a bad experience.</p>
        <p><b>Connection, separately:</b> {attended.filter(response => response.meetAgain === "Yes").length}/{attended.filter(response => response.meetAgain).length} who answered want to meet the group again. {attended.filter(response => response.connection === "We met again independently").length}/{attended.filter(response => response.connection).length} who answered report an independent second hangout.</p>
        <p className="exp-note">These are individual self-reports, not verified group-level friendships. Invitations and responses are different denominators.</p>
        {table.members.map(member => <p key={member.applicationId}>{people.find(person => person.id === member.applicationId)?.fullName || "Attendee"} · <a href={`/table/${member.token}/feedback`} target="_blank" rel="noreferrer">Private check-in / feedback link ↗</a>{member.feedback && !after.some(response => response.applicationId === member.applicationId) && <span> · Earlier feedback: {member.feedback.meetAgain ? "would meet again" : "would not meet again"}{member.feedback.note ? ` — ${member.feedback.note}` : ""}</span>}</p>)}
        {responses.map(response => <FeedbackResponse key={response.id} response={response} name={people.find(person => person.id === response.applicationId)?.fullName || "Former attendee"}/>)}
      </article>;
    })}
    {!loading && !error && !surveys.length && <p>No survey responses yet. Share each person’s own private link after the event; don’t post invitation links in a group chat.</p>}
  </section>;
}

function FeedbackResponse({ response, name, event }: { response: SurveyRecord; name: string; event?: string }) {
  return <details className="host-guest"><summary>{name} · {response.kind === "before" ? "Before check-in" : response.kind === "concern" ? "Concern" : response.experience}{event ? ` · ${event}` : ""} · {new Date(response.submittedAt).toLocaleString()}</summary>
    {response.hopes?.length ? <p>Hoping for: {response.hopes.join(", ")}</p> : null}
    {questionsFor(response.kind, response.experience).filter(question => response.questionAnswers?.[question.id]).map(question => <p key={question.id}><b>{question.label}</b><br/>{response.questionAnswers?.[question.id]}</p>)}
    {response.meetAgain && <p>Meet again: {response.meetAgain}</p>}
    {response.connection && <p>Since the event: {response.connection}</p>}
    <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{response.note || "No written note."}</p>
    <p>{response.followUp ? "Follow-up invited via signup contact." : "No follow-up requested."}</p>
  </details>;
}
