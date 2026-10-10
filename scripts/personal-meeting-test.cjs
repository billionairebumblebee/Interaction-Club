const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, deps = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', 'process', code)(exports, name => deps[name] || require(name), { env: { BLOB_READ_WRITE_TOKEN: 'synthetic-test-only' } });
  return exports;
}
const logic = load('lib/personal-meeting.ts');
const records = new Map();
const api = load('app/api/personal-meetings/route.ts', {
  '@/lib/personal-meeting': logic,
  '@/lib/concierge': { writeRecord: async (path, value) => records.set(path, value), readJson: async path => records.get(path) || null },
});
const payload = { name: 'Synthetic Guest', email: 'qa@example.invalid', topic: 'Continue our research conversation', mode: 'call', duration: 30, timezone: 'America/Los_Angeles', slots: [new Date(Date.now() + 86400000).toISOString()] };
const request = (method, body, origin = 'https://example.invalid') => new Request('https://example.invalid/api/personal-meetings', { method, headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
(async () => {
  assert.throws(() => logic.validateMeeting({ ...payload, slots: [] }));
  assert.throws(() => logic.validateMeeting({ ...payload, timezone: 'invalid' }));
  assert.throws(() => logic.validateMeeting({ ...payload, mode: 'in-person' }));
  assert.throws(() => logic.validateMeeting({ ...payload, slots: ['2020-01-01T00:00:00Z'] }));
  assert.equal((await api.POST(request('POST', payload, 'https://other.invalid'))).status, 403);
  assert.equal(records.size, 0);
  const response = await api.POST(request('POST', payload));
  assert.equal(response.status, 201);
  const receipt = await response.json();
  assert.equal(receipt.status, 'pending');
  const saved = [...records.values()][0];
  assert.equal(saved.status, 'pending');
  assert.equal(saved.token, undefined, 'Store only token hash');
  assert.equal(saved.calendarEventId, undefined, 'No fake calendar commitment');
  assert.equal((await api.PATCH(request('PATCH', { ...receipt, token: 'a'.repeat(64) }))).status, 400);
  assert.equal((await api.PATCH(request('PATCH', receipt))).status, 200);
  assert.equal([...records.values()][0].status, 'withdrawn');
  console.log('PASS: future-time validation, origin boundary, private pending request, hashed token and authorized withdrawal; synthetic storage only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
