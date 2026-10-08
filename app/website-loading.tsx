"use client";

import { useEffect, useState } from "react";
import { trackWebsiteFetch } from "@/lib/loading-fetch";
import LoadingSeal from "./loading-seal";

export default function WebsiteLoading() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const original = window.fetch;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    const tracked = trackWebsiteFetch(original.bind(window), pending => {
      if (!active) return;
      if (pending > 0) {
        if (!timer) timer = setTimeout(() => {timer = undefined; if (active) setVisible(true);}, 180);
      } else {
        clearTimeout(timer); timer = undefined; setVisible(false);
      }
    }, window.location.href);
    window.fetch = tracked;
    return () => { active = false; clearTimeout(timer); if (window.fetch === tracked) window.fetch = original; };
  }, []);
  return visible ? <LoadingSeal/> : null;
}
