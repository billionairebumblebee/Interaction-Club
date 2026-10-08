import Image from "next/image";
import "./side-quest-art.css";

export default function SideQuestArt({ priority = false }: { priority?: boolean }) {
  return <div className="ic-adventure-pair" aria-label="Imagine your next side quest">
    <figure className="ic-adventure-card ic-adventure-park">
      <div className="ic-adventure-picture"><Image src="/side-quests-park-v2.png" alt="A sculptural ivory Ferris wheel with six cobalt-blue gondolas and tiny pink details." width={1536} height={1024} sizes="(max-width:700px) 90vw, 550px" priority={priority}/></div>
      <figcaption><span className="ic-adventure-stub">POSSIBLE SIDE QUEST</span><strong>One more ride?</strong><p>Find your roller-coaster people.</p></figcaption>
    </figure>
    <figure className="ic-adventure-card ic-adventure-bus">
      <div className="ic-adventure-picture"><Image src="/side-quests-bus-v2.png" alt="A textured cobalt-blue coach bus with an ivory roof, navy windows, and a pink tail light." width={1536} height={1024} sizes="(max-width:700px) 90vw, 550px" priority={priority}/></div>
      <figcaption><span className="ic-adventure-stub">POSSIBLE SIDE QUEST</span><strong>Window seat?</strong><p>A day out with your next good story.</p></figcaption>
    </figure>
  </div>;
}
