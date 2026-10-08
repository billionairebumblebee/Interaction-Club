// Count only first-party application requests, not analytics, assets or Next
// prefetches. Preserve request arguments, responses, errors and abort behavior.
export function trackWebsiteFetch(original: typeof fetch, onPending: (count: number) => void, baseUrl: string): typeof fetch {
  let pending = 0;
  return async (input, init) => {
    let tracked = false;
    try {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, baseUrl);
      tracked = url.origin === new URL(baseUrl).origin && url.pathname.startsWith("/api/");
    } catch { /* Let native fetch report invalid input normally. */ }
    if (!tracked) return original(input, init);
    onPending(++pending);
    try { return await original(input, init); }
    finally { onPending(--pending); }
  };
}
