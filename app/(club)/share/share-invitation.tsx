"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CircleMark } from "../../club-brand";
import { useInteractionExperience } from "../../interaction-experience";

type Referrer = { name: string; slug: string };
function slugFor(name: string) { return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0,40).replace(/-$/g, ""); }
export default function ShareInvitation() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [customSlug, setCustomSlug] = useState(false);
  const [consent, setConsent] = useState(false);
  const [referrer, setReferrer] = useState<Referrer | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [origin, setOrigin] = useState("");
  const { play } = useInteractionExperience();
  useEffect(() => {
    const timer = setTimeout(() => {
      setOrigin(window.location.origin);
      try { const saved = JSON.parse(localStorage.getItem("interaction.my-invitation") || "null"); if (saved && typeof saved.name === "string" && /^[a-z0-9-]{1,48}$/.test(saved.slug)) setReferrer(saved); } catch { /* Links still work without local storage. */ }
    },0);
    return () => clearTimeout(timer);
  }, []);
  const url = referrer ? `${origin}/${referrer.slug}` : "";
  async function create(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/referrals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, slug, publicNameConsent: consent }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please try again.");
      setReferrer(data.referrer); play("celebrate");
      try { localStorage.setItem("interaction.my-invitation", JSON.stringify(data.referrer)); } catch { /* Saving locally is optional. */ }
    } catch(error) { setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url); setMessage("Copied! Go make someone’s day."); play("happy"); }
    catch { setMessage("Select the link below to copy it."); }
  }
  return <div className="ic-partner-page ic-share-page"><header className="ic-share-heading"><p className="ic-eyebrow">GOOD COMPANY IS CONTAGIOUS</p><h1>Your name.<br/><em>Their invitation.</em></h1><p>Someone you’d love to see at the table? Make them a personal invitation.</p></header><section className="ic-share-card" aria-labelledby="share-title"><CircleMark/><h2 id="share-title">{referrer ? "Your invitation is ready." : "Make it yours."}</h2>{referrer ? <><p>Friends opening your link will see an invitation from <strong>{referrer.name}</strong>.</p><label>Your invitation link<input readOnly value={url} onFocus={event => event.currentTarget.select()}/></label><div className="ic-partner-actions"><button type="button" className="ic-cta" onClick={copy}>Copy my link ↗</button><Link href={`/${referrer.slug}`} className="ic-partner-link">Preview invitation ↗</Link></div><button type="button" className="ic-share-reset" onClick={() => { setReferrer(null); setMessage(""); }}>Make another invitation</button></> : <form onSubmit={create}><label>Your name<input value={name} maxLength={60} required autoComplete="given-name" placeholder="The name your friends know you by" onChange={event => { setName(event.target.value); if (!customSlug) setSlug(slugFor(event.target.value)); }}/></label><label>Your link name<div className="ic-share-url"><span>/</span><input value={slug} maxLength={40} required autoCapitalize="none" autoCorrect="off" placeholder="your-name" onChange={event => { setCustomSlug(true); setSlug(slugFor(event.target.value)); }}/></div><small>If it’s taken, we’ll add a short ending so your link stays yours.</small></label><label className="ic-share-consent"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)}/><span>I’m happy for this name to appear on my public invitation page.</span></label><button className="ic-cta" type="submit" disabled={busy}>{busy ? "Making your invitation…" : "Make my invitation ↗"}</button></form>}{message && <p role="status" className="ic-share-message">{message}</p>}</section><aside className="ic-share-note"><h2>A hello, not a homework assignment.</h2><p>We record which invitation link someone uses when they finish the quiz. It helps us understand how people find the club. Referral links aren’t identity verification, and they don’t change matching or guarantee a dinner seat.</p><Link className="ic-partner-link" href="/data">How we handle your data ↗</Link></aside></div>;
}
