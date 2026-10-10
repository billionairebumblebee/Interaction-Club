"use client";
import { FormEvent, useEffect, useState } from "react";
import { CircleMark } from "../club-brand";
import { useInteractionExperience } from "../interaction-experience";
import "./personal.css";

export default function PersonalInvitation() {
  const [open, setOpen] = useState(false), [name, setName] = useState("");
  const [timezone, setTimezone] = useState(""), [time, setTime] = useState(""), [slots, setSlots] = useState<string[]>([]);
  const [mode, setMode] = useState("call"), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ id: string; token: string } | null>(null), [withdrawn, setWithdrawn] = useState(false), [preview, setPreview] = useState(false);
  const { play } = useInteractionExperience();
  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const query = new URLSearchParams(window.location.search);
    setPreview(query.get("preview") === "1");
    if (query.get("request") && query.get("key")) { setReceipt({ id: query.get("request")!, token: query.get("key")! }); setOpen(true); }
  }, []);
  const display = (iso: string, zone: string) => new Intl.DateTimeFormat(undefined, { timeZone: zone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(iso));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setError("");
    if (!slots.length) { setError("Add at least one time that works for you."); return; }
    if (preview) { setError("Preview only: no request saved and no calendar booking created."); return; }
    const form = new FormData(event.currentTarget); setBusy(true);
    try {
      const response = await fetch("/api/personal-meetings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email: form.get("email"), topic: form.get("topic"), location: form.get("location"), duration: Number(form.get("duration")), mode, timezone, slots, website: form.get("website") }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setReceipt(result); play("happy");
      window.history.replaceState(null, "", `/vivianbuilds?request=${result.id}&key=${result.token}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); } finally { setBusy(false); }
  }
  async function withdraw() {
    if (!receipt || busy) return; setBusy(true); setError("");
    try {
      const response = await fetch("/api/personal-meetings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(receipt) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error); setWithdrawn(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Please try again."); } finally { setBusy(false); }
  }
  return <main className="personal-invite"><a className="personal-brand" href="/">Interaction Club <CircleMark/></a><h1>Let’s keep talking 💌</h1><p>A personal invitation. Just you and Vivian.</p>{preview && <p className="personal-note">Local preview · no messages or bookings</p>}
    {!open ? <section className="personal-envelope"><span className="personal-stamp"><CircleMark/></span><p>From Vivian, to</p><label>Your name<input value={name} onChange={e => setName(e.target.value)} maxLength={80} autoComplete="name" placeholder="Your name here"/></label><button className="personal-seal" aria-label="Open your personal letter" onClick={() => { setOpen(true); play("confetti"); }}><CircleMark/></button><p>Open your letter ↗</p></section> : <section className="personal-letter">
    {receipt ? <><h2>{withdrawn ? "Another time, then 💕" : "Your meeting request"}</h2><p>{withdrawn ? "Your request is withdrawn. No meeting was booked through this form." : "This is a request, not a reservation. Vivian will review the proposed times and confirm by email. No Calendar event or Google Meet has been created."}</p>{!withdrawn && <><p>Keep this private link to withdraw your request. To change your times, withdraw and send a new request.</p><button disabled={busy} onClick={withdraw}>{busy ? "Working…" : "Withdraw this request"}</button></>}<a href="/vivianbuilds">Start a new request ↗</a></> : <><p>Dear {name || "you"},</p><h2>I’d love to continue our conversation.</h2><p>A quick call, or a little more time over dinner? Tell me what you have in mind and when you’re free.</p><p>— Vivian</p><form onSubmit={submit}>
    <label>Your name<input required value={name} maxLength={80} onChange={e => setName(e.target.value)} autoComplete="name"/></label><label>Email<input name="email" required type="email" maxLength={254} autoComplete="email"/></label><label>Where did we meet? What should we talk about?<textarea name="topic" required maxLength={1200} rows={3}/></label>
    <fieldset><legend>The plan</legend><div className="personal-options">{[["call", "A Google Meet call"], ["in-person", "Dinner / in person"]].map(([id, label]) => <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}>{label}</button>)}</div></fieldset>
    <label>How long?<select name="duration" defaultValue="30"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">An hour</option></select></label>{mode === "in-person" && <><label>Where would you like to meet?<input name="location" required maxLength={240} placeholder="An area or venue suggestion"/></label><p className="personal-note">We’ll agree on a location and any costs before confirming. Food isn’t included or promised.</p></>}
    <fieldset><legend>Suggest up to five times</legend><p>Your device timezone: {timezone || "loading…"}. These are your suggestions, not Vivian’s verified availability.</p><label>A time that works for you<input type="datetime-local" value={time} onChange={e => setTime(e.target.value)}/></label><button type="button" disabled={!time || slots.length >= 5} onClick={() => { const date = new Date(time); if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) { setError("Choose a future time."); return; } setSlots(current => [...new Set([...current, date.toISOString()])]); setTime(""); setError(""); }}>Add this time</button><ul>{slots.map(slot => <li key={slot}><b>{display(slot, timezone)}</b><small>Pacific: {display(slot, "America/Los_Angeles")}</small><button type="button" aria-label={`Remove ${display(slot, timezone)}`} onClick={() => setSlots(current => current.filter(value => value !== slot))}>Remove</button></li>)}</ul></fieldset>
    <label className="personal-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label><p className="personal-note">Your details are saved privately for this conversation request, not added to the group-dinner signup. Vivian must confirm before you make plans.</p><button className="personal-submit" disabled={busy} type="submit">{busy ? "Saving your request…" : "Let’s find a time 💌"}</button></form></>}{error && <p role="alert">{error}</p>}</section>}
    <footer><a href="/privacy">Privacy</a> · <a href="/">Back to Interaction Club</a></footer></main>;
}
