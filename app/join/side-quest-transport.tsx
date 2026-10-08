import { sideQuestTransportOptions } from "../../lib/side-quests";

type Props = {
  selected: string[];
  other: string;
  maxSpend: string;
  onToggle: (id: string) => void;
  onOther: (value: string) => void;
  onMaxSpend: (value: string) => void;
};

export default function SideQuestTransport(props: Props) {
  return <details className="ic-optional-details">
    <summary>A bigger day out? (optional)</summary>
    <fieldset><legend>How would you get there? <span className="selection-hint">please select all you’d consider</span></legend>
      <p className="helper">A theme-park day is one possibility. Examples cover admission + return transport; food is extra. These are rough estimates. Exact prices and plans come with your invitation.</p>
      {sideQuestTransportOptions.map(option => <label className="check" key={option.id}>
        <input type="checkbox" checked={props.selected.includes(option.id)} onChange={() => props.onToggle(option.id)}/>
        <span><b>{option.label}</b><small>{option.detail}</small></span>
      </label>)}
    </fieldset>
    {props.selected.includes("other") && <label className="compact">Your transport idea <span>optional</span><input maxLength={160} value={props.other} onChange={event => props.onOther(event.target.value)} placeholder="What would work for you?"/></label>}
    <label className="compact">Your maximum total outing budget ($) <span>optional</span>
      <input type="number" min="0" max="10000" step="1" value={props.maxSpend} onChange={event => props.onMaxSpend(event.target.value)} placeholder="Your limit"/>
    </label>
    <p className="helper">Include admission, transport, fees, and what you’d spend on food. $0 is welcome. This is separate from your dinner budget.</p>
  </details>;
}
