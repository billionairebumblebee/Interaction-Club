import { schoolStages } from "../../lib/school-work";

type Key = "schoolStage" | "major" | "industry" | "jobTitle";
type Props = Record<Key, string> & { onChange: (key: Key, value: string) => void };

export default function SchoolWorkFields({ schoolStage, major, industry, jobTitle, onChange }: Props) {
  return <fieldset><legend>A little about your day-to-day <span>optional</span></legend><div className="field-grid">
    <label>School stage / college year<select value={schoolStage} onChange={event => onChange("schoolStage", event.target.value)}><option value="">Choose if you’d like</option>{schoolStages.map(stage => <option key={stage}>{stage}</option>)}</select>{schoolStage === "High school" && <small>Interaction Club is 18+. School stage does not replace the age requirement.</small>}</label>
    <label>What’s your major?<input value={major} maxLength={100} onChange={event => onChange("major", event.target.value)} placeholder="e.g. Mechanical engineering, undeclared" /></label>
    <label>What industry do you work in?<input value={industry} maxLength={100} onChange={event => onChange("industry", event.target.value)} placeholder="e.g. Education, tech, hospitality" /></label>
    <label>Job title / what you do<input value={jobTitle} maxLength={100} onChange={event => onChange("jobTitle", event.target.value)} placeholder="e.g. Designer, researcher, between roles" /></label>
  </div></fieldset>;
}
