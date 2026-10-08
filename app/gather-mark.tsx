"use client";
import { CSSProperties, useEffect, useState } from "react";
export default function GatherMark() {
  const [progress, setProgress] = useState(0);
  useEffect(() => { const update = () => setProgress(Math.min(1, window.scrollY / 360)); update(); window.addEventListener("scroll", update, { passive: true }); return () => window.removeEventListener("scroll", update); }, []);
  return <div className="exp-art" aria-label="People coming together" style={{ "--progress": progress } as CSSProperties}><div className="exp-orbs">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div><span>Better together.</span></div>;
}
