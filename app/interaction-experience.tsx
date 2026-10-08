"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { InteractionAudio, type SoundCue } from "./interaction-audio";

type Experience = { dark: boolean; sounds: boolean; music: boolean; toggleTheme: () => void; toggleSounds: () => void; toggleMusic: () => void; play: (cue: SoundCue) => void; audioNotice: string };
const Context = createContext<Experience | null>(null);
const save = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Preferences are optional. */ } };

export function InteractionExperience({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [sounds, setSounds] = useState(true);
  const [music, setMusic] = useState(false);
  const [audioNotice, setAudioNotice] = useState("");
  const audio = useRef<InteractionAudio | null>(null);
  const wantsMusic = useRef(false);
  const getAudio = () => audio.current ??= new InteractionAudio();

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDark(document.documentElement.dataset.appearance === "dark");
      try { const enabled = localStorage.getItem("interaction.sounds") !== "off"; setSounds(enabled); getAudio().setEffects(enabled); } catch { /* Defaults work without storage. */ }
    }, 0);
    const click = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target.closest<HTMLElement>("button, a, summary, input[type=checkbox]") : null;
      if (!element || element.closest("[inert]") || element.hasAttribute("disabled") || element.dataset.sound === "none") return;
      const cue = element.dataset.sound;
      void getAudio().play(cue === "happy" || cue === "flip" || cue === "confetti" || cue === "celebrate" || cue === "aw" ? cue : "click");
    };
    const visibility = () => {
      // Never keep playing in a background tab. Returning doesn't auto-restart.
      if (document.hidden) { wantsMusic.current = false; audio.current?.suspend(); setMusic(false); }
    };
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    const systemTheme = () => {
      try { if (localStorage.getItem("interaction.appearance")) return; } catch { /* Follow the system without storage. */ }
      document.documentElement.dataset.appearance = preference.matches ? "dark" : "light"; setDark(preference.matches);
    };
    document.addEventListener("click", click, true);
    document.addEventListener("visibilitychange", visibility);
    preference.addEventListener("change", systemTheme);
    return () => { clearTimeout(id); document.removeEventListener("click", click, true); document.removeEventListener("visibilitychange", visibility); preference.removeEventListener("change", systemTheme); audio.current?.dispose(); audio.current = null; };
  }, []);

  function toggleTheme() { const next = !dark; setDark(next); document.documentElement.dataset.appearance = next ? "dark" : "light"; save("interaction.appearance", next ? "dark" : "light"); }
  function toggleSounds() { const next = !sounds; setSounds(next); getAudio().setEffects(next); save("interaction.sounds", next ? "on" : "off"); if (next) void getAudio().play("click"); }
  async function toggleMusic() {
    const next = !wantsMusic.current; wantsMusic.current = next; setMusic(next); setAudioNotice("");
    if (!next) { getAudio().stopMusic(); return; }
    const started = await getAudio().startMusic();
    if (!wantsMusic.current) { getAudio().stopMusic(); return; }
    if (!started) { wantsMusic.current = false; setMusic(false); setAudioNotice("Audio isn’t available in this browser. Everything else still works."); }
  }
  return <Context.Provider value={{ dark, sounds, music, toggleTheme, toggleSounds, toggleMusic, audioNotice, play: cue => { void getAudio().play(cue); } }}>{children}</Context.Provider>;
}

export function useInteractionExperience() {
  const value = useContext(Context);
  if (!value) throw new Error("InteractionExperience is required");
  return value;
}

export function ExperienceControls() {
  const { dark, sounds, music, toggleTheme, toggleSounds, toggleMusic, audioNotice } = useInteractionExperience();
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (event: MouseEvent) => { if (event.target instanceof Node && !details.current?.contains(event.target) && details.current) details.current.open = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && details.current?.open) { details.current.open = false; details.current.querySelector("summary")?.focus(); } };
    document.addEventListener("click", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("click", outside); document.removeEventListener("keydown", escape); };
  }, []);
  return <details ref={details} className="ic-play-settings"><summary aria-label="Sound and appearance settings">Make it yours <span aria-hidden="true">♪</span></summary><div className="ic-play-panel"><p>SET THE MOOD</p><button type="button" onClick={toggleTheme} aria-pressed={dark}>Dark mode <span>{dark ? "On" : "Off"}</span></button><button type="button" onClick={toggleSounds} data-sound="none" aria-pressed={sounds}>Sound effects <span>{sounds ? "On" : "Off"}</span></button><button type="button" onClick={toggleMusic} data-sound="none" aria-pressed={music}>Background music <span>{music ? "On" : "Off"}</span></button><small>Music plays only when you turn it on.</small>{audioNotice && <small role="status">{audioNotice}</small>}</div></details>;
}
