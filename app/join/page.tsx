"use client";

import Link from "next/link";
import { CSSProperties, FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CircleMark, ClubNavigation, ClubFooter } from "../club-brand";
import { useInteractionExperience } from "../interaction-experience";
import { dressCodeOptions } from "../../lib/dress-code";
import PersonalityQuestions from "./personality-questions";
import SchoolWorkFields from "./school-work-fields";
import { baseAreas } from "../../lib/locations";
import InterestPicker from "./interest-picker";
import CommunityFields from "./community-fields";
import { MOX_PILOT_BOUNDARY } from "../../lib/communities";
import "./community-notice.css";
import AvailabilityCalendar from "./availability-calendar";
import SideQuestTransport from "./side-quest-transport";
import { availabilitySlots } from "../../lib/availability";
import { AVAILABILITY_REQUIRED, hasSignupAvailability } from "../../lib/signup-availability";
import { PILOT_DINNERS } from "../../lib/pilot-week";
import { sideQuestDays } from "../../lib/side-quests";
import { getInviter } from "../../lib/inviters";
import PhotoPermissions from "./photo-permissions";
import { PHOTO_CONSENT_VERSION, photoAnswersComplete, type PhotoAnswers } from "@/lib/photo-consent";
import { PARTICIPATION_TERMS_VERSION } from "@/lib/participation-terms";

const activities = ["Dinner", "Quick connect", "Build together", "Do something"];
const tableOptions = ["50/50 men + women", "Women only", "Men only", "Inclusive / everyone"];
const dietaryOptions = ["Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Peanut allergy", "Tree nut allergy", "Shellfish allergy", "Lactose intolerant"];
const foodLikeTags = ["Ramen", "Tacos", "Burgers", "Coffee + matcha", "Desserts", "Shared plates", "Spicy food"];
const foodDislikeTags = ["Seafood", "Very spicy food", "Loud places", "Meat-heavy", "Dairy-heavy", "Sweet food"];

type FormState = {
  pronouns: string;
  diningHallPreference: string; diningHallContext: string;
  dinnerSideQuest: string; currentRabbitHole: string; tenMinuteTopic: string; meetAgainSpark: string; yapper: string; yapperContext: string;
  comments: string;
  affiliations: string[]; communityOther: string; crossCommunityOptIn: boolean;
  pilotDinnerDates: string[];
  sideQuestDays: string[]; sideQuestIdea: string; sideQuestInvitations: boolean;
  sideQuestTransport: string[]; sideQuestTransportOther: string; sideQuestMaxSpend: string;
  willingToTravelToBerkeley: boolean;
  schoolStage: string; major: string; industry: string; jobTitle: string;
  fullName: string; email: string; birthMonth: string; birthYear: string; baseArea: string;
  intent: string; discipline: string; maxSpend: string; gender: string; tableFormats: string[]; activities: string[]; budget: string; availability: string[];
  dressCodes: string[]; foodLikes: string; foodDislikes: string; foodLikeTags: string[]; foodDislikeTags: string[]; dietaryNeeds: string[]; dietaryOther: string;
  conversationStyle: string; conversationTopic: string; mbti: string; arrivalStyle: string; accessibilityNotes: string; spontaneous: boolean; interests: string[]; agreement: boolean; ageConfirmed: boolean;
};

const initial: FormState = {
  pronouns: "",
  diningHallPreference: "", diningHallContext: "",
  dinnerSideQuest: "", currentRabbitHole: "", tenMinuteTopic: "", meetAgainSpark: "", yapper: "", yapperContext: "",
  comments: "",
  willingToTravelToBerkeley: false,
  affiliations: [], communityOther: "", crossCommunityOptIn: false,
  pilotDinnerDates: [],
  sideQuestDays: [], sideQuestIdea: "", sideQuestInvitations: false,
  sideQuestTransport: [], sideQuestTransportOther: "", sideQuestMaxSpend: "",
  schoolStage: "", major: "", industry: "", jobTitle: "",
  intent: "", discipline: "", maxSpend: "", fullName: "", email: "", birthMonth: "", birthYear: "", baseArea: "", gender: "", tableFormats: [],
  activities: [], budget: "", availability: [], dressCodes: [], foodLikes: "", foodDislikes: "", foodLikeTags: [], foodDislikeTags: [], dietaryNeeds: [],
  conversationStyle: "", conversationTopic: "", mbti: "", arrivalStyle: "", dietaryOther: "", accessibilityNotes: "", spontaneous: false, interests: [], agreement: false, ageConfirmed: false,
};

export default function Join() {
  const [step, setStep] = useState(0);
  const [path, setPath] = useState<"quick" | "quiz" | null>(null);
  const [photoChoices, setPhotoChoices] = useState<PhotoAnswers>({ capture: null, hackathon: null, publicPosting: null });
  const stages = path === "quiz" ? [0, 3, 1, 2] : [0, 1, 2];
  const position = stages.indexOf(step);
  const labels = path === "quiz" ? ["Hello", "Your vibe", "Your plan", "Finish"] : ["Hello", "Your plan", "Finish"];
  const [form, setForm] = useState<FormState>(initial);
  const [genderDescription, setGenderDescription] = useState("");
  const gender = form.gender === "Prefer to self-describe" ? genderDescription.trim() : form.gender === "Prefer not to say" ? "" : form.gender;
  const [error, setError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const availabilitySection = useRef<HTMLFieldSetElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [invitedBy, setInvitedBy] = useState<ReturnType<typeof getInviter>>(null);
  const [invitationSource, setInvitationSource] = useState("");
  const [sideQuestFocus, setSideQuestFocus] = useState(false);
  const { play } = useInteractionExperience();
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const blurbInput = useRef<HTMLTextAreaElement>(null);
  const submitting = useRef(false);
  const greeting = form.fullName.trim() ? `Hello, ${form.fullName.trim()}!` : "Hello!";
  const stepNames = [greeting, "Your plan", greeting, "A little table talk."];

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => { setError(""); setForm((current) => ({ ...current, [key]: value })); };
  const toggle = (key: "activities" | "dressCodes" | "interests" | "availability" | "tableFormats" | "dietaryNeeds" | "foodLikeTags" | "foodDislikeTags" | "pilotDinnerDates" | "sideQuestDays" | "sideQuestTransport", item: string, maximum: number) => { setError(""); setForm((current) => {
    const exists = current[key].includes(item);
    return { ...current, [key]: exists ? current[key].filter((value) => value !== item) : current[key].length < maximum ? [...current[key], item] : current[key] };
  }); };

  useEffect(() => {
    const controller = new AbortController();
    const restoreName = window.setTimeout(() => {
      setSideQuestFocus(new URLSearchParams(window.location.search).get("side-quests") === "1");
      let source = new URLSearchParams(window.location.search).get("from") || "";
      try { source ||= sessionStorage.getItem("interaction.invitedBy") || ""; } catch { /* Storage is optional. */ }
      setInvitationSource(source);
      const requestedPath = new URLSearchParams(window.location.search).get("path");
      if (requestedPath === "quick" || requestedPath === "quiz") setPath(requestedPath);
      const known = getInviter(source);
      setInvitedBy(known);
      if (source && !known) void fetch(`/api/referrals?from=${encodeURIComponent(source)}`, { signal: controller.signal }).then(response => response.ok ? response.json() : null).then(result => { if (result?.referrer) setInvitedBy(result.referrer); }).catch(() => { /* Referral lookup never blocks the quiz. */ });
      try { const name = sessionStorage.getItem("interaction.invitation.name"); if (name) setForm(current => ({ ...current, fullName: current.fullName || name.slice(0, 80) })); } catch { /* Storage is optional. */ }
    }, 0);
    return () => { clearTimeout(restoreName); controller.abort(); };
  }, []);

  useEffect(() => { stepHeading.current?.focus({ preventScroll: true }); if (step > 0) stepHeading.current?.scrollIntoView({ block: "start", behavior: "instant" }); }, [step]);
  useEffect(() => { if (submitted) { successHeading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" }); } }, [submitted]);

  useLayoutEffect(() => {
    const resize = () => {
      const input = blurbInput.current;
      if (!input) return;
      input.style.height = "auto";
      input.style.height = `${input.scrollHeight + input.offsetHeight - input.clientHeight}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [step, form.discipline]);

  function isAtLeast18() {
    const month = Number(form.birthMonth);
    const year = Number(form.birthYear);
    if (!month || !year) return false;
    const now = new Date();
    const age = now.getFullYear() - year;
    // We only collect month + year, so a self-attested person in their 18th
    // birth month is allowed through rather than being rejected on an unknown day.
    return age > 18 || (age === 18 && month <= now.getMonth() + 1);
  }

  function next() {
    if (step === 0 && (!form.fullName || !form.email || !form.baseArea || !form.birthMonth || !form.birthYear || !form.ageConfirmed)) return setError("Finish the basics first. We only ask what makes a real plan possible.");
    if (step === 0 && !isAtLeast18()) return setError("You need to be 18 or older to join Interaction.");
    if (step === 1 && !hasSignupAvailability(form)) return requireAvailability();
    if (step === 1 && (!form.intent || !form.activities.length || !form.budget || !form.tableFormats.length)) return setError("Finish every plan detail before you continue.");
    if (step === 1 && form.budget === "$100+" && (!form.maxSpend || Number(form.maxSpend) < 100)) return setError("Add your maximum total spend for a LARP dinner.");
    play("happy"); setError(""); setStep((current) => stages[Math.min(stages.indexOf(current) + 1, stages.length - 1)]);
  }

  function requireAvailability() {
    setAvailabilityError(AVAILABILITY_REQUIRED);
    setStep(1);
    window.setTimeout(() => {
      availabilitySection.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      availabilitySection.current?.focus({ preventScroll: true });
    }, 0);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || step !== 2) return;
    if (!hasSignupAvailability(form)) { requireAvailability(); return; }
    submitting.current = true; setError(""); setIsSubmitting(true);
    try {
      if (!form.fullName || !form.email || !form.baseArea || !form.birthMonth || !form.birthYear || !form.ageConfirmed || !isAtLeast18() || !form.intent || !form.activities.length || !form.budget || !form.tableFormats.length) {
        throw new Error("Please complete the required fields before joining.");
      }
      if (!form.agreement) throw new Error("Accept the participation terms and show-up agreement to join Interaction.");
      if (!photoAnswersComplete(photoChoices)) throw new Error("Please choose Yes or No for the photo release. No is completely fine.");
      const response = await fetch("/api/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, participationTermsVersion: PARTICIPATION_TERMS_VERSION, photoConsent: { ...photoChoices, version: PHOTO_CONSENT_VERSION }, gender, invitedBy: invitationSource || undefined, shareInterestTags: true, birthMonth: Number(form.birthMonth), birthYear: Number(form.birthYear) }) });
      const result = await response.json() as { error?: string; field?: string };
      if (!response.ok && result.field === "availability") { requireAvailability(); return; }
      if (!response.ok) throw new Error(result.error || "Try again.");
      try { sessionStorage.setItem("interaction.joined", "1"); } catch { /* Submission already succeeded. */ }
      setSubmitted(true); play("celebrate");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Try again.");
    } finally { submitting.current = false; setIsSubmitting(false); }
  }

  if (submitted) return <main className="ic-home ic-survey-page"><ClubNavigation/><section className="ic-join-success"><div className="ic-confetti ic-big-confetti" aria-hidden="true">{Array.from({ length: 120 }, (_, i) => <i key={i} style={{ "--i": i, "--x": `${i * 37 % 101}%`, "--drift": `${i * 43 % 181 - 90}px`, "--delay": `${i % 18 * .075}s`, "--duration": `${2.8 + i % 5 * .2}s`, "--spin": `${i % 2 ? 710 : -630}deg` } as CSSProperties}/>)}</div><div className="ic-success-card"><CircleMark/><h1 ref={successHeading} tabIndex={-1}>You’re on our radar!</h1><p>Thanks, {form.fullName.split(" ")[0]}. Your profile is in the matching pool. Joining doesn’t guarantee a dinner.</p>{invitationSource === "mox" && <p>{MOX_PILOT_BOUNDARY}</p>}<div className="ic-next-note"><b>Keep an eye on your inbox.</b><p>If we have a spot that fits, we’ll send a dinner invitation with the time, place, and cost. If we’re at capacity, we’ll let you know you’re on the waitlist.</p></div><Link href="/#top" className="ic-cta">Back to the club <span>↗</span></Link><details className="ic-success-data"><summary>Your data receipt</summary><p>We stored your matching profile and email to form a group and contact you. We do not sell your information or use it to change your price.</p></details></div></section><ClubFooter/></main>;

  const back = () => { setError(""); setStep((current) => stages[Math.max(0, stages.indexOf(current) - 1)]); };

  return <main className="ic-home ic-survey-page">
    <ClubNavigation/>
    <header className="ic-survey-intro"><div><h1>Let us get<br/><em>to know you.</em></h1><p>{invitedBy ? `Invited by ${invitedBy.name}. Let’s get to know you.` : "A quick hello. Then let’s make a plan."}</p><p className="helper">{sideQuestFocus ? "Tell us about you, then share your Side Quest ideas and availability. Actual outing invitations come later." : path === "quiz" ? "Four sections, including an optional personality section. Your dinner invitation comes separately." : "Three sections: a hello, your plan, and the final check. Your dinner invitation comes separately."}</p></div><div className="ic-survey-stamp" aria-hidden="true"><CircleMark/><span>GOOD COMPANY.<br/>YOUR NAME.</span></div></header>
    {invitationSource === "mox" && <section className="join ic-mox-registration-boundary" aria-label="About this proposed pilot"><p>Free to join as an individual. Organizational delivery is a separate paid service to be agreed with Mox. No Mox-specific dinner is scheduled or guaranteed.</p><p>{MOX_PILOT_BOUNDARY}</p><p>If you opt into the wider club, you can still receive general Interaction Club invitations that fit your location and preferences.</p></section>}
    <section className="join ic-signup-choice" aria-label="Choose your signup"><h2>How do you want to say hello?</h2><p>Same club. Same matching pool. Switching keeps every answer.</p><div className="options"><button type="button" aria-pressed={path === "quick"} className={path === "quick" ? "selected" : ""} onClick={() => { setPath("quick"); if (step === 3) setStep(1); setError(""); }}><b>Quick signup</b><br/><span>3 sections · the essentials + optional interests</span></button><button type="button" aria-pressed={path === "quiz"} className={path === "quiz" ? "selected" : ""} onClick={() => { setPath("quiz"); setError(""); }}><b>The little personality quiz</b><br/><span>4 sections · extended edition. More lore.</span></button></div></section>
    {path &&     <section className="join" aria-labelledby="join-title"><div className="join-heading"><div><p className="ic-eyebrow">STEP {position + 1} OF {stages.length}</p><h2 id="join-title" ref={stepHeading} tabIndex={-1}>{stepNames[step]}</h2>{step === 2 && <p className="ic-step-description">Food notes and extra details are optional. Please accept the participation terms and choose Yes or No for the photo release below.</p>}</div><CircleMark/></div>
      <p className="helper">Free to join. Food or activity costs are shared before you accept a plan.</p><div className="ic-form-progress" role="progressbar" aria-label="Signup progress" aria-valuemin={1} aria-valuemax={stages.length} aria-valuenow={position + 1}><i style={{ width: `${(position + 1) / stages.length * 100}%` }}/></div><div className="stepper">{labels.map((label, index) => <span key={label} aria-current={position === index ? "step" : undefined} className={`${position === index ? "active" : ""} ${position > index ? "complete" : ""}`}><b>{position > index ? "✓" : index + 1}</b>{label}</span>)}</div>
      <form onSubmit={submit}>
        {step === 0 && <section className="step-content"><div className="field-grid"><label>Your full name<input autoComplete="name" value={form.fullName} maxLength={80} onChange={(e) => set("fullName", e.target.value)} placeholder="First and last name" /><small>For your invitation.</small></label><label>Your email<input autoComplete="email" value={form.email} type="email" onChange={(e) => set("email", e.target.value)} placeholder="For your match only" /></label><label>Where are you based right now?<select value={form.baseArea} onChange={(e) => set("baseArea", e.target.value)}><option value="">Choose a broad area</option>{baseAreas.map(area => <option key={area}>{area}</option>)}</select><small>{invitationSource === "mox" ? "A broad area helps us plan nearby. No Mox dinner is scheduled yet; no address needed." : "We’re piloting Berkeley for now. No address needed."}</small></label><label>Month + year of birth<div className="split"><select aria-label="Birth month" value={form.birthMonth} onChange={(e) => set("birthMonth", e.target.value)}><option value="">Month</option>{Array.from({ length: 12 }, (_, index) => <option value={index + 1} key={index}>{new Date(2000, index).toLocaleString("en", { month: "long" })}</option>)}</select><select aria-label="Birth year" value={form.birthYear} onChange={(e) => set("birthYear", e.target.value)}><option value="">Year</option>{Array.from({ length: 60 }, (_, index) => <option value={new Date().getFullYear() - index} key={index}>{new Date().getFullYear() - index}</option>)}</select></div><small>For age groups. Not shown on your profile.</small></label></div>{form.baseArea && form.baseArea !== "Berkeley" && <label className="check"><input type="checkbox" checked={form.willingToTravelToBerkeley} onChange={e => set("willingToTravelToBerkeley", e.target.checked)}/><span>I could travel to Berkeley for a plan. I’ll decide when I see the invitation.</span></label>}<label className="check"><input type="checkbox" checked={form.ageConfirmed} onChange={(e) => set("ageConfirmed", e.target.checked)} /> <span>I confirm that I am 18 or older.</span></label><details className="ic-form-details"><summary>Why we ask</summary><p>Your name is for the invitation. Your area and age help us form a group; your email is how we reach you. No address needed.</p></details><label className="compact">Pronouns <span>optional</span><input maxLength={100} value={form.pronouns} onChange={e => set("pronouns", e.target.value)} placeholder="e.g. she/her, he/him, they/them, or your own words"/><small>For how we address you, and possibly future dinner place cards if we make them. Place cards aren’t guaranteed. Not used for gender matching.</small></label><InterestPicker value={form.interests} onChange={tags => set("interests", tags)} /><div className="field-grid"><label className="about-you-field" htmlFor="about-you">What are you into / what would you enjoy talking about? <small id="about-you-hint">Optional. A sentence or two is plenty.</small><textarea ref={blurbInput} id="about-you" className="about-you-blurb" aria-describedby="about-you-hint about-you-count" rows={2} maxLength={1000} value={form.discipline} onChange={e => set("discipline", e.target.value)} placeholder="Tell us a little about you…" /><small id="about-you-count">{form.discipline.length}/1,000 characters</small></label></div></section>}
        {step === 3 && <div className="ic-quiz-extras"><p className="helper">All of this is optional. Skip anything—it’s conversation context, not a personality diagnosis.</p><section className="step-content"><SchoolWorkFields schoolStage={form.schoolStage} major={form.major} industry={form.industry} jobTitle={form.jobTitle} onChange={(key, value) => set(key, value)} /><PersonalityQuestions dinnerSideQuest={form.dinnerSideQuest} currentRabbitHole={form.currentRabbitHole} tenMinuteTopic={form.tenMinuteTopic} meetAgainSpark={form.meetAgainSpark} yapper={form.yapper} yapperContext={form.yapperContext} onChange={(key, value) => set(key, value)} /><fieldset><legend>Dress code <span>optional</span><span className="selection-hint">please select all</span></legend><div className="options">{dressCodeOptions.map(item => <button type="button" key={item} aria-pressed={form.dressCodes.includes(item)} className={form.dressCodes.includes(item) ? "selected" : ""} onClick={() => toggle("dressCodes", item, dressCodeOptions.length)}>{item}</button>)}</div></fieldset></section></div>}
        {step === 1 && <section className="step-content"><fieldset><legend>What sounds like a good evening?</legend><div className="options">{["Builder / founder", "Chill / social", "Open to either"].map(item => <button type="button" key={item} aria-pressed={form.intent === item} className={form.intent === item ? "selected" : ""} onClick={() => set("intent", item)}>{item === "Builder / founder" ? "Talk ideas & projects" : item === "Chill / social" ? "Just hang out" : "Either sounds good"}</button>)}</div><p className="helper">Good conversation, a few new faces, and no need to impress anyone.</p></fieldset><fieldset><legend>What do you want to do? <span className="selection-hint">please select all</span></legend><div className="options">{activities.map((item) => <button key={item} aria-pressed={form.activities.includes(item)} className={form.activities.includes(item) ? "selected" : ""} type="button" onClick={() => toggle("activities", item, 4)}>{item}</button>)}</div></fieldset><fieldset><legend>What is your comfortable spend?</legend><p className="helper">For food or activities. We can match below your budget, never above it.</p><div className="budget-options">{[["Free plans only", "public hangouts · bring your own snack"], ["Under $15", "coffee · matcha · boba"], ["$15–30", "ramen · tacos · burgers"], ["$30–50", "dinner · shared plates"], ["$100+", "LARP tier"]].map(([tier, label]) => <button aria-pressed={form.budget === tier} className={form.budget === tier ? "selected" : ""} type="button" key={tier} onClick={() => set("budget", tier)}><b>{tier}</b><span>{label}</span></button>)}</div></fieldset>{form.budget === "$100+" && <label className="compact">Your maximum total spend ($)<input type="number" min="100" max="10000" value={form.maxSpend} onChange={e => set("maxSpend", e.target.value)} /></label>}<fieldset ref={availabilitySection} tabIndex={-1} aria-describedby={availabilityError && !hasSignupAvailability(form) ? "signup-availability-error" : undefined}><legend>When could you join us? <span className="selection-hint">please select all</span></legend>{invitationSource === "mox" && <p className="helper">No Mox dinner is scheduled yet. Share your usual availability below; your actual invitation will include a date, time, place and cost.</p>}{(invitationSource !== "mox" || form.crossCommunityOptIn) && <><p className="helper">Berkeley · 6–8 p.m. Pacific. Pick either or both. Your seat and venue come with a separate invitation.</p>{PILOT_DINNERS.map(dinner => <label className="check ic-week-check" key={dinner.id}><input type="checkbox" checked={form.pilotDinnerDates.includes(dinner.id)} onChange={() => toggle("pilotDinnerDates", dinner.id, 2)}/><span><b>{dinner.label}</b></span></label>)}</>}<p className="helper">Busy this week? Pick a usual time below instead. Choose at least one option across this week and future plans.</p><AvailabilityCalendar value={form.availability} onToggle={(slot) => toggle("availability", slot, availabilitySlots.length)} />{availabilityError && !hasSignupAvailability(form) && <p id="signup-availability-error" className="form-error" role="alert">{availabilityError}</p>}</fieldset><details className="ic-optional-details" open={sideQuestFocus || undefined}><summary>Down for a daytime side quest? (optional)</summary><p className="helper">Want a group for a random adventure? If you’re down, we’re down. Tell us when you might join; the actual plan comes in a separate invitation.</p><fieldset><legend>Days that could work <span className="selection-hint">please select all</span></legend>{sideQuestDays.map(day => <label className="check" key={day}><input type="checkbox" checked={form.sideQuestDays.includes(day)} onChange={() => toggle("sideQuestDays", day, 3)}/><span>{day}</span></label>)}</fieldset><SideQuestTransport selected={form.sideQuestTransport} other={form.sideQuestTransportOther} maxSpend={form.sideQuestMaxSpend} onToggle={id => toggle("sideQuestTransport", id, 5)} onOther={value => set("sideQuestTransportOther", value)} onMaxSpend={value => set("sideQuestMaxSpend", value)}/><label className="compact">Your random adventure idea <span>optional</span><textarea rows={2} maxLength={240} value={form.sideQuestIdea} onChange={e => set("sideQuestIdea", e.target.value)} placeholder="Bowling? A theme-park day? Something we haven’t thought of?"/></label><label className="check"><input type="checkbox" checked={form.sideQuestInvitations} onChange={e => set("sideQuestInvitations", e.target.checked)}/><span><b>Send me side-quest invitations</b><small>Even when I didn’t select that day. I’ll decide for each plan, and I can ask to stop these invitations.</small></span></label><p className="helper">Time, transport, total cost, and any sponsor will be clear before you RSVP. Daytime doesn’t mean committing your whole day.</p></details><fieldset><legend>Which table types would you be comfortable joining? <span className="selection-hint">please select all</span></legend><p className="helper">We’ll only match you with a type you select. Inclusive welcomes everyone, with no fixed gender ratio. Gendered tables use your self-identification.</p><div className="options">{tableOptions.map((item) => <button aria-pressed={form.tableFormats.includes(item)} className={form.tableFormats.includes(item) ? "selected" : ""} type="button" key={item} onClick={() => toggle("tableFormats", item, 4)}>{item}</button>)}</div><label className="compact" htmlFor="gender">Gender <span>optional</span><select id="gender" aria-describedby="gender-help" value={form.gender} onChange={(e) => { set("gender", e.target.value); setGenderDescription(""); }}><option value="">Select if you’d like</option><option>Woman</option><option>Man</option><option>Nonbinary</option><option>Prefer to self-describe</option><option>Prefer not to say</option></select></label>{form.gender === "Prefer to self-describe" && <label className="compact" htmlFor="gender-description">Your gender, in your own words <span>optional</span><input id="gender-description" type="text" maxLength={80} value={genderDescription} onChange={(e) => { setError(""); setGenderDescription(e.target.value); }} /></label>}<p className="helper gender-help" id="gender-help">Used to help match table preferences.</p></fieldset><label className="check"><input type="checkbox" checked={form.spontaneous} onChange={(e) => set("spontaneous", e.target.checked)} /><span><b>Open to spontaneous plans</b><small>Get notified if a spot opens 1–3 days before a plan. You choose whether to join.</small></span></label></section>}
        {step === 2 && <section className="step-content"><details className="ic-form-details"><summary>A dining-hall plot twist? (optional)</summary><label>How would you feel about a dining-hall plan?<select value={form.diningHallPreference} onChange={e => set("diningHallPreference", e.target.value)}><option value="">No preference to share</option><option>I’d be down for Crossroads</option><option>Please, anywhere but a dining hall</option></select></label>{form.diningHallPreference === "I’d be down for Crossroads" && <p className="helper">Crossroads cinematic universe.</p>}<label>Anything we should know? <span>optional</span><input maxLength={240} value={form.diningHallContext} onChange={e => set("diningHallContext", e.target.value)} placeholder="Access questions, meal-swipe availability, or your take…"/></label><p className="helper">Just an idea, not a confirmed Crossroads event. We’ll check access, full cost and a clear meeting point before an invitation. No meal or guest swipe is promised.</p></details><details className="ic-form-details"><summary>Food likes and dislikes (optional)</summary><fieldset><legend>Food preferences <span>optional</span></legend><div className="food-tag-groups"><div><b>Would love</b><div className="options">{foodLikeTags.map((item) => <button aria-pressed={form.foodLikeTags.includes(item)} className={form.foodLikeTags.includes(item) ? "selected" : ""} type="button" key={item} onClick={() => toggle("foodLikeTags", item, 7)}>{item}</button>)}</div></div><div><b>Would rather skip</b><div className="options">{foodDislikeTags.map((item) => <button aria-pressed={form.foodDislikeTags.includes(item)} className={form.foodDislikeTags.includes(item) ? "selected" : ""} type="button" key={item} onClick={() => toggle("foodDislikeTags", item, 6)}>{item}</button>)}</div></div></div><div className="field-grid"><label>Anything else you like<textarea value={form.foodLikes} maxLength={240} onChange={(e) => set("foodLikes", e.target.value)} placeholder="e.g. Korean food, desserts" /></label><label>Anything else you dislike<textarea value={form.foodDislikes} maxLength={240} onChange={(e) => set("foodDislikes", e.target.value)} placeholder="e.g. seafood, loud places" /></label></div></fieldset></details><fieldset><legend>Dietary needs and allergies <span>optional</span></legend><div className="options">{dietaryOptions.map((item) => <button aria-pressed={form.dietaryNeeds.includes(item)} className={form.dietaryNeeds.includes(item) ? "selected" : ""} type="button" key={item} onClick={() => toggle("dietaryNeeds", item, 9)}>{item}</button>)}</div><div className="field-grid food-notes"><label>Other dietary need<textarea value={form.dietaryOther} maxLength={240} onChange={(e) => set("dietaryOther", e.target.value)} placeholder="Optional" /></label><label>Accessibility notes<textarea value={form.accessibilityNotes} maxLength={240} onChange={(e) => set("accessibilityNotes", e.target.value)} placeholder="Optional" /></label></div><p className="helper">Needs guide venue choices, not who you meet. Accommodations aren’t guaranteed. If you have allergies, please remind the restaurant before ordering and confirm ingredients and cross-contact risks directly. For shared or family-style food, tell your host and table too. Ask for a separate, clean serving utensil for each dish; don’t share eating utensils or move serving utensils between dishes. Keep your meal separate if safety can’t be confirmed.</p></fieldset></section>}
        {step === 2 && <section className="step-content"><label htmlFor="join-comments">Anything else you’d like us to know? <span>optional</span><p className="helper" id="join-comments-help">Side quests you’d love, a fun idea, or something we didn’t ask—tell us here.</p><textarea id="join-comments" aria-describedby="join-comments-help" rows={4} maxLength={2000} value={form.comments} onChange={event => set("comments", event.target.value)} placeholder="I’ve always wanted to…"/></label><p className="helper">Questions? Email <a href="mailto:join@interaction.club">join@interaction.club</a>.</p></section>}
        {step === 2 && <section className="step-content"><fieldset className="agreement"><legend>Before you join</legend><p>Joining doesn’t reserve a dinner seat. We keep groups small; when hosting capacity fills up, we’ll let you know you’re on the waitlist.</p><label className="check"><input type="checkbox" checked={form.agreement} onChange={(e) => set("agreement", e.target.checked)} /><span><b>I accept the <Link href="/terms" target="_blank" rel="noreferrer">participation terms</Link>, and when I accept an invite, I’ll show up—or cancel as early as I can.</b><small>I meet strangers at my own discretion, in public, and handle my own bill or split it directly with the group. Interaction does not verify, background-check, or endorse participants. I&apos;ll act responsibly and leave if something feels wrong.</small></span></label><p className="helper">By joining, you also agree to the <Link href="/terms">Terms of Use</Link>, <Link href="/privacy">Privacy Notice</Link>, and <Link href="/safety">Safety Guidelines</Link>.</p></fieldset></section>}
        {step === 0 && <CommunityFields open={invitationSource === "mox"} affiliations={form.affiliations} other={form.communityOther} crossCommunityOptIn={form.crossCommunityOptIn} onAffiliations={value => set("affiliations", value)} onOther={value => set("communityOther", value)} onCrossCommunity={value => set("crossCommunityOptIn", value)}/>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {step === 2 && <section className="step-content"><PhotoPermissions value={photoChoices} onChange={setPhotoChoices} disabled={isSubmitting}/></section>}
        <footer className="form-footer"><p>One upcoming plan at a time.</p><div className="form-actions">{step > 0 && <button type="button" className="secondary" onClick={back}>back</button>}{step !== 2 ? <button key="continue" type="button" className="primary" onClick={event => { event.preventDefault(); next(); }}>continue <span>→</span></button> : <button key="submit" className="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "joining..." : "join Interaction"} <span>→</span></button>}</div></footer>
      </form>
    </section>}
    <ClubFooter/>
  </main>;
}
