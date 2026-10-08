import assert from "node:assert/strict";
import { cleanHostContactEmail, hostContactHref } from "../lib/host-contact.ts";

for (const value of [undefined, null, "", "not an email", "test@example.com\nBcc:someone@example.com", "mailto:test@example.com", "test@example.com?bcc=other@example.com", "a@-example.com", "a@example-.com"]) {
  assert.equal(cleanHostContactEmail(value), null);
  assert.equal(hostContactHref(value), null);
}
assert.equal(cleanHostContactEmail("  host+pilot@example.com  "), "host+pilot@example.com");
assert.equal(hostContactHref("host+pilot@example.com"), "mailto:host%2Bpilot%40example.com?subject=Question%20about%20my%20Interaction%20invitation");
console.log("Host contact validation and link tests passed.");
