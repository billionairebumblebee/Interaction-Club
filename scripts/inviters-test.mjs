import assert from "node:assert/strict";
import { getInviter } from "../lib/inviters.ts";

assert.deepEqual(getInviter("vivian"), { slug: "vivian", name: "Vivian" });
assert.deepEqual(getInviter("Vivian"), getInviter("vivian"));
for (const value of [undefined, null, "", "someone-else", "admin", "__proto__", "constructor", "<script>", {}]) {
  assert.equal(getInviter(value), null);
}
console.log("PASS: Registered inviter, case normalization, unknown and unsafe slugs.");
