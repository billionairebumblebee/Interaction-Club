"use client";
import { useEffect, useRef, useState } from "react";
import type { GuestAttendance } from "./attendance-panel";
import { ARRIVAL_POLL_MS } from "@/lib/dinner-arrival";
export default function ArrivalPanel({ endpoint, onMember }: { endpoint: string; onMember: (member: GuestAttendance) => void }) {
  const [data, setData] = useState<{ member: GuestAttendance; arrivalAvailable: boolean; arrivalPlan: { hostName: string; landmark: string }; table: { venueName: string; venueAddress?: string } } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [eta, setEta] = useState("");
  const callback = useRef(onMember);
  useEffect(() => { callback.current = onMember; }, [onMember]);
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        const next = await response.json();
        if (!response.ok) throw new Error(next.error || "Unable to refresh arrivals.");
        if (active) { setData(next); callback.current(next.member); setError(""); }
      } catch { if (active) setError("Arrival updates couldn’t refresh. Please try again; no instant alerts are enabled."); }
    }
    void refresh();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, ARRIVAL_POLL_MS);
    return () => { active = false; clearInterval(timer); };
  }, [endpoint]);
  async function update(value: string) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(endpoint, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "arrival", value, ...(value === "running-late" && eta !== "" ? { etaMinutes: Number(eta) } : {}) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save your arrival update.");
      setData(current => current ? { ...current, member: result.member } : current); callback.current(result.member);
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to save your arrival update."); }
    finally { setBusy(false); }
  }
  return <section id="arrival" className="arrival-panel" aria-label="Find your dinner table">
    <h3>Find your people 💌</h3>
    {data ? <><p><b>{data.arrivalPlan.hostName}</b> is your assigned host.<br/>{data.table.venueName}<br/>{data.table.venueAddress}</p><p><b>Find the table:</b> {data.arrivalPlan.landmark}</p>
      <p className="arrival-note">The host checks a dashboard that refreshes every 20 seconds while open. This is not instant or emergency support. If there’s no reply, ask venue staff where the Interaction Club table is. Email is not monitored live.</p>
      <fieldset disabled={busy || !data.arrivalAvailable}><legend>Your arrival</legend><div className="arrival-actions"><button type="button" className="exp-button" onClick={() => update("on-my-way")}>I’m on my way</button><button type="button" className="exp-button dark" onClick={() => update("here")}>I’m here</button></div><label>ETA in minutes (optional)<input type="number" min="0" max="180" step="1" inputMode="numeric" value={eta} onChange={event => setEta(event.target.value)}/></label><div className="arrival-actions"><button type="button" className="exp-button" onClick={() => update("running-late")}>I’m running late</button><button type="button" className="exp-button" onClick={() => update("help")}>Can’t find the table</button></div></fieldset>
      {!data.arrivalAvailable && <p>Arrival updates open two hours before your confirmed dinner and close when it ends. “I’m here” opens 30 minutes before dinner.</p>}
      {data.member.arrival && <p role="status">Saved: {data.member.arrival.status.replaceAll("-", " ")} at {new Date(data.member.arrival.at).toLocaleTimeString()}{data.member.arrival.etaMinutes !== undefined && ` · ETA ${data.member.arrival.etaMinutes} minutes`}. This is your self-report, not verified attendance.</p>}
      {data.member.arrivalHelp && <p role="status">{data.member.arrivalHelp.response ? `Your host’s directions: ${data.member.arrivalHelp.response}` : "Help request saved. Keep this page open for the host’s reply; a response is not guaranteed."}</p>}
    </> : <p role="status">Loading your arrival details…</p>}
    {busy && <p role="status">Saving…</p>}{error && <p role="alert">{error}</p>}
    <a href="#manage-rsvp">Manage my RSVP ↓</a>
  </section>;
}
