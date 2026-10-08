"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ReferralReport() {
  const [key, setKey] = useState("");
  const [rows, setRows] = useState<{slug: string; name: string; signups: number}[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/referrals", {headers: {"x-interaction-admin-key": key}, cache: "no-store"});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn’t load referrals.");
      setRows(data.referrals); setMessage(data.referrals.length ? "Updated." : "No referred signups yet.");
    } catch(error) { setRows([]); setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="ic-home" style={{padding: "clamp(24px, 5vw, 72px)", minHeight: "100vh"}}><Link href="/admin">← Organizer inbox</Link><h1>Who brought the company?</h1><p>Private referral report. Counts unique email addresses that finished the quiz through each invitation link—not visits or dinner attendance.</p><form onSubmit={load}><label>Organizer key <input type="password" value={key} onChange={event => setKey(event.target.value)} required autoComplete="off"/></label> <button className="ic-cta" disabled={busy}>{busy ? "Loading…" : "Load referral counts"}</button></form><p role="status">{message}</p>{rows.length > 0 && <table style={{width: "100%", marginTop: 24, textAlign: "left"}}><thead><tr><th>Inviter</th><th>Invitation</th><th>Completed signups</th></tr></thead><tbody>{rows.map(row => <tr key={row.slug}><td>{row.name}</td><td><Link href={`/${row.slug}`}>/{row.slug}</Link></td><td>{row.signups}</td></tr>)}</tbody></table>}</main>;
}
