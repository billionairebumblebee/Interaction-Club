import { CircleMark } from "./club-brand";

export default function LoadingSeal({ route = false }: {route?: boolean}) {
  return <div className={`ic-loading-overlay ${route ? "ic-route-loading" : "ic-network-loading"}`} role="status" aria-live="polite" aria-label="Loading, please wait">
    <div className="ic-loading-card"><span className="ic-loading-seal" aria-hidden="true"><CircleMark/></span><p>One little moment…</p></div>
  </div>;
}
