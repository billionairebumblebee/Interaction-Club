import { cleanHostContactEmail, hostContactHref } from "@/lib/host-contact";

export default function HostContact({ email }: { email?: string }) {
  const address = cleanHostContactEmail(email);
  const href = hostContactHref(email);
  if (!address || !href) return null;
  return <aside className="host-contact" style={{ marginTop: 32, padding: 24, border: "2px solid #8091df", borderRadius: 24 }}>
    <h2>Questions or running late?</h2>
    <p>Your host is a real person. Reach out about your plan.</p>
    <a className="exp-button dark" href={href}>Contact your host ↗</a>
    <p style={{ overflowWrap: "anywhere" }}>{address}</p>
  </aside>;
}
