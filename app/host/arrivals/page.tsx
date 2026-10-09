"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { MemberState } from "@/lib/concierge";
import { ARRIVAL_POLL_MS } from "@/lib/dinner-arrival";
import "../../experience.css";
type HostData = { venueName: string; venueAddress?: string; plan: { hostName: string; landmark: string }; guests: { id: string; name: string; arrival?: MemberState["arrival"]; help?: MemberState["arrivalHelp"] }[] };
export default function HostArrivals() {
  const [tableId, setTableId] = useState(""), [key, setKey] = useState(""), [opened, setOpened] = useState(false), [data, setData] = useState<HostData | null>(null), [error, setError] = useState(""), [landmark, setLandmark] = useState(""), [replies, setReplies] = useState<Record<string, string>>({}), [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!opened) return;
    let active = true;
    async function refresh() {
      try {
        const response = await fetch(`/api/host/arrival?tableId=${encodeURIComponent(tableId)}`, { headers: { "x-interaction-host-key": key }, cache: "no-store" });
        const result = await response.json(); if (!response.ok) throw new Error(result.error);
        if (active) { setData(result); setError(""); }
      } catch (error) { if (active) setError(error instanceof Error ? error.message : "Refresh failed."); }
    }
    void refresh(); const timer = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, ARRIVAL_POLL_MS);
    return () => { active = false; clearInterval(timer); };
  }, [opened, key, tableId]);
  async function save(body: Record<string, unknown>) {
    if (busy) return; setBusy(true); setError("");
    try {
      const response = await fetch("/api/host/arrival", { method: "POST", headers: { "content-type": "application/json", "x-interaction-host-key": key }, body: JSON.stringify({ tableId, ...body }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      if (result.plan) setData(current => current ? { ...current, plan: result.plan } : current);
      if (result.help) setData(current => current ? { ...current, guests: current.guests.map(guest => guest.id === body.applicationId ? { ...guest, help: result.help } : guest) } : current);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to save."); } finally { setBusy(false); }
  }
  return <main className="experience-site"><nav className="exp-nav"><Link href="/">Interaction Club</Link></nav><header className="host-heading"><h1>Your table is coming together 💌</h1><p>Arrival-only access. Refreshes every 20 seconds while this page is visible. Keep it open during arrivals. No push, email or instant alerts are enabled.</p>{!opened ? <form className="exp-form" onSubmit={event => { event.preventDefault(); setOpened(true); }}><label>Dinner ID<input value={tableId} onChange={event => setTableId(event.target.value)} required maxLength={100}/></label><label>Assigned host key<input type="password" autoComplete="off" value={key} onChange={event => setKey(event.target.value)} required/></label><button className="exp-button dark">Open arrivals</button></form> : <button className="exp-text-button" onClick={() => { setOpened(false); setData(null); setKey(""); }}>Close and clear host access</button>}{error && <p role="alert">{error}</p>}</header>{data && <section className="host-heading"><h2>{data.plan.hostName} · {data.venueName}</h2><p>{data.venueAddress}</p><p>Current table directions: {data.plan.landmark}</p><form className="exp-form" onSubmit={event => { event.preventDefault(); void save({ action: "directions", landmark }); }}><label>Table landmark<textarea required maxLength={400} value={landmark} onChange={event => setLandmark(event.target.value)} placeholder="By the window, look for the small pink sign. No names or contact details."/></label><button className="exp-button" disabled={busy}>Update directions</button></form>{data.guests.map(guest => <article className="host-guest" key={guest.id}><h3>{guest.name}</h3><p>{guest.arrival ? `${guest.arrival.status.replaceAll("-", " ")} · ${new Date(guest.arrival.at).toLocaleTimeString()}${guest.arrival.etaMinutes === undefined ? "" : ` · ETA ${guest.arrival.etaMinutes} minutes`}` : "No arrival update yet"}</p><p>Self-reported arrival. Verified attendance stays in the organizer workflow.</p>{guest.help && <><p>Help requested at {new Date(guest.help.requestedAt).toLocaleTimeString()}{guest.help.acknowledgedAt && ` · acknowledged ${new Date(guest.help.acknowledgedAt).toLocaleTimeString()}`}</p><form className="exp-form" onSubmit={event => { event.preventDefault(); void save({ action: "respond", applicationId: guest.id, requestId: guest.help!.id, response: replies[guest.id] || data.plan.landmark }); }}><label>Directions for this guest<textarea maxLength={400} value={replies[guest.id] ?? guest.help.response ?? ""} onChange={event => setReplies(current => ({ ...current, [guest.id]: event.target.value }))} placeholder={data.plan.landmark}/></label><button className="exp-button dark" disabled={busy}>Acknowledge and send directions</button></form></>}</article>)}</section>}</main>;
}
