"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cleanTag, MAX_INTERESTS, MAX_TAG_LENGTH, suggestInterests, tagKey } from "../../lib/interest-tags";

export default function InterestPicker({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<{ query: string; tags: string[] }>({ query: "", tags: [] });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const full = value.length >= MAX_INTERESTS;
  const suggestions = suggestInterests(query, remote.query === query ? remote.tags : [], value);
  const draft = cleanTag(query);
  const selected = value.some(tag => tagKey(tag) === tagKey(query));
  const canCreate = Boolean(draft && !selected && !suggestions.some(tag => tagKey(tag) === tagKey(draft)));
  const choices = [...suggestions, ...(canCreate ? [draft] : [])];
  const expanded = open && Boolean(query.trim()) && !full && choices.length > 0;

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/interests?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (!controller.signal.aborted && Array.isArray(data.tags)) setRemote({ query, tags: data.tags.filter((tag: unknown): tag is string => typeof tag === "string") });
      } catch { /* Adding a custom tag and local suggestions work offline. */ }
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  function add(raw: string) {
    const tag = cleanTag(raw);
    if (full) return setMessage("Five picked. Remove one to add another.");
    if (!tag) return setMessage("Use a short interest name, without links or contact details.");
    if (value.some(item => tagKey(item) === tagKey(tag))) return setMessage("That tag is already on your list.");
    onChange([...value, tag]); setQuery(""); setActive(-1); setOpen(false); setMessage(`${tag} added. ${canCreate ? "That’s oddly specific. Perfect." : "Lore acquired."}`); input.current?.focus();
  }

  return <fieldset className="interest-picker" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <legend>Interests <span>optional</span></legend>
    <p className="helper" id={`${id}-hint`}>Type an interest, then press Enter to make it a tag. Suggestions appear as you type. Add up to five.</p>
    {value.length > 0 && <ul className="interest-chips" aria-label="Your interests">{value.map(tag => <li key={tagKey(tag)}><span>{tag}</span><button type="button" aria-label={`Remove ${tag}`} onClick={() => { onChange(value.filter(item => item !== tag)); setMessage(`${tag} removed.`); }}>×</button></li>)}</ul>}
    <div className="interest-search">
      <div className="tag-entry">
        <input ref={input} role="combobox" aria-label="Add your own interest" aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? `${id}-list` : undefined} aria-activedescendant={expanded && active >= 0 && active < choices.length ? `${id}-${active}` : undefined} aria-describedby={`${id}-hint ${id}-privacy ${id}-status`} autoComplete="off" value={query} maxLength={MAX_TAG_LENGTH} placeholder={full ? "Five interests picked" : "Type an interest…"} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); setActive(-1); setMessage(""); }} onKeyDown={event => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Escape") { setOpen(false); setActive(-1); }
          if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !full && choices.length) { event.preventDefault(); setOpen(true); setActive(current => event.key === "ArrowDown" ? (current + 1) % choices.length : (current <= 0 ? choices.length - 1 : current - 1)); }
          if (event.key === "Enter") { event.preventDefault(); if (expanded && active >= 0 && choices[active]) add(choices[active]); else if (query.trim()) add(query); }
        }} />
        <button type="button" disabled={full || !query.trim()} onClick={() => add(query)}>add</button>
      </div>
      {expanded && <ul id={`${id}-list`} className="interest-suggestions" role="listbox" aria-label="Suggested interests">{choices.map((tag, index) => <li id={`${id}-${index}`} key={tagKey(tag)} role="option" aria-selected={active === index} onPointerDown={event => event.preventDefault()} onClick={() => add(tag)}>{canCreate && index === choices.length - 1 ? <>Add “{tag}” <small>new tag</small></> : tag}</li>)}</ul>}
    </div>
    <p className="helper interest-count" id={`${id}-status`} role="status">{message || (full ? "Five picked. Remove one to add another." : `${value.length} of ${MAX_INTERESTS} picked. You can also skip this.`)}</p>
    <p className="helper interest-privacy" id={`${id}-privacy`}>New tag names can become suggestions for others after you join. Your name and profile stay private. Keep tags about interests.</p>
  </fieldset>;
}
