import assert from "node:assert/strict";

const base = (process.argv[2] || "https://www.interaction.club").replace(/\/$/, "");
const paths = ["/", "/about", "/how-it-works", "/faq", "/join", "/share", "/philosophy", "/sponsors", "/investors", "/privacy", "/terms", "/data", "/safety"];
for (const path of paths) {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonical, `${path}: canonical`);
  assert.equal(new URL(canonical[1]).href, new URL(`https://www.interaction.club${path}`).href, `${path}: canonical URL`);
  assert.ok(html.includes('name="description"'), `${path}: description`);
  assert.ok(html.includes('property="og:image"'), `${path}: share image`);
  const schema = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  assert.ok(schema, `${path}: structured data`);
  assert.equal(JSON.parse(schema[1])["@graph"][0].name, "Interaction Club");
}
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
for (const path of paths) assert.ok(sitemap.includes(`<loc>https://www.interaction.club${path}</loc>`), `sitemap: ${path}`);
assert.ok(!sitemap.includes("/table/"));
const robots = await (await fetch(`${base}/robots.txt`)).text();
assert.ok(robots.includes("Allow: /"));
assert.ok(robots.includes("Disallow: /table/"));
assert.ok(robots.includes("Sitemap: https://www.interaction.club/sitemap.xml"));
const llms = await (await fetch(`${base}/llms.txt`)).text();
assert.ok(llms.includes("https://www.interaction.club/"));
assert.ok(!llms.includes("vercel.app"));
for (const path of ["/admin", "/preview", "/host-preview", "/table/invalid-token"]) {
  const response = await fetch(`${base}${path}`);
  assert.ok(response.headers.get("x-robots-tag")?.includes("noindex"), `${path}: indexing exclusion`);
}
console.log("PASS: 13 public pages, canonical URLs, share metadata, JSON-LD, sitemap, robots, llms.txt, and private-route indexing headers.");
