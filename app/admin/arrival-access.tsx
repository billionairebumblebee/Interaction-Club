"use client";
import { useState } from "react";
import Link from "next/link";
import type { TableRecord } from "@/lib/concierge";
export default function ArrivalAccess({ adminKey, tables }: { adminKey: string; tables: TableRecord[] }) {
  const [tableId, setTableId] = useState(""), [confirmed, setConfirmed] = useState(false), [hostKey, setHostKey] = useState(""), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const table = tables.find(item => item.id === tableId);
  async function update(action: string) {
    setBusy(true); setMessage(""); setHostKey("");
    try {
      const response = await fetch("/api/admin/arrival-access", { method: "POST", headers: { "content-type": "application/json", "x-interaction-admin-key": adminKey }, body: JSON.stringify({ tableId, action, confirmAssignedHost: confirmed }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setHostKey(result.hostKey || ""); setMessage(result.revoked ? "Host arrival access revoked." : "Arrival-only key created. Share privately with the assigned host; do not share your organizer key. A new key invalidates the previous one.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to change access."); } finally { setBusy(false); }
  }
  return <section><h2>Assigned host arrival dashboard</h2><p>Guests need a visible table landmark and a host watching arrivals. The dashboard polls every 20 seconds while open. No live alerts are enabled.</p><div className="exp-form"><label>Dinner<select value={tableId} onChange={event => { setTableId(event.target.value); setConfirmed(false); setHostKey(""); }}>{[<option value="" key="empty">Choose dinner</option>, ...tables.filter(item => item.status === "invited").map(item => <option key={item.id} value={item.id}>{item.dinnerId || item.id} · {item.hostName || "No host assigned"}</option>)]}</select></label><label className="exp-check"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)}/> I reviewed the assigned host: {table?.hostName || "choose a dinner"}. This key permits only this dinner’s arrivals and table directions.</label><button className="exp-button dark" disabled={busy || !confirmed || !table?.hostName} onClick={() => update("provision")}>Create or rotate host arrival key</button><button className="exp-button" disabled={busy || !tableId} onClick={() => update("revoke")}>Revoke host arrival key</button></div>{message && <p role="status">{message}</p>}{hostKey && <p>Private host key (shown once): <code style={{ overflowWrap: "anywhere" }}>{hostKey}</code></p>}<p><Link href="/host/arrivals">Open host arrivals ↗</Link> · Hosts enter the dinner ID and their private arrival key.</p></section>;
}
