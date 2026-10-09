export default function HostContact(props: { email?: string }) {
  void props;
  return <aside className="host-contact" style={{ marginTop: 32, padding: 24, border: "2px solid #8091df", borderRadius: 24 }}>
    <h2>Questions? Email Interaction Club.</h2>
    <p>For dinner-day directions, use the arrival actions in your invitation. Email is not monitored live or emergency support.</p>
    <a className="exp-button dark" href="mailto:the@interaction.club">Email us ↗</a>
    <p style={{ overflowWrap: "anywhere" }}>the@interaction.club</p>
  </aside>;
}
