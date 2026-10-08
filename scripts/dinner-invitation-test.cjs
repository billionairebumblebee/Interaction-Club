const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', 'process', code)(exports, name => dependencies[name] || require(name), { env: { BLOB_READ_WRITE_TOKEN: 'synthetic-test-only' } });
  return exports;
}
const helpers = load('lib/dinner-invitation.ts');
const attendance = load('lib/attendance.ts');
const blobs = new Map();
const store = load('lib/concierge.ts', { './dinner-invitation': helpers, '@vercel/blob': {
  get: async path => blobs.has(path) ? { stream: new Response(blobs.get(path)).body } : null,
  put: async (path, value, options) => { if (!options.allowOverwrite && blobs.has(path)) throw Error('Collision'); blobs.set(path, value); },
  list: async ({ prefix }) => ({ blobs: [...blobs.keys()].filter(path => path.startsWith(prefix)).map(pathname => ({ pathname })), hasMore: false }),
} });
const api = load('app/api/table/[token]/route.ts', { '@/lib/concierge': store, '@/lib/attendance': attendance, '@/lib/sheets': { queueSheetRecord: async () => {} } });
const calendar = load('app/api/table/[token]/calendar/route.ts', { '@/lib/concierge': store, '@/lib/dinner-invitation': helpers });
const context = token => ({ params: Promise.resolve({ token }) });
(async () => {
  const ids = await Promise.all([store.reserveDinnerId('synthetic-a'), store.reserveDinnerId('synthetic-b')]);
  assert.deepEqual(ids.sort(), ['dinner-01', 'dinner-02']);
  const token = 'synthetic-private-token-0000001';
  const now = Date.now();
  const table = { id: 'synthetic-a', dinnerId: ids[0], status: 'invited', activity: 'Dinner', intent: 'Chill / social', theme: 'Synthetic chill dinner', venueName: 'Synthetic demonstration venue', venueAddress: 'Example location, not booked', venueArea: 'Berkeley', startsAt: new Date(now + 172800000).toISOString(), endsAt: new Date(now + 180000000).toISOString(), responseDeadline: new Date(now + 86400000).toISOString(), cost: 15, costDetails: 'Synthetic $15 estimate including tax and tip', sponsorDisclosure: 'None', members: [{ applicationId: 'synthetic-guest-a', token, expiresAt: new Date(now + 864000000).toISOString(), rsvp: 'pending', attendance: 'unknown' }, { applicationId: 'synthetic-other-person', token: 'synthetic-private-token-0000002', rsvp: 'pending', attendance: 'unknown' }] };
  await store.saveTable(table);
  assert(await store.getDinnerInvitation(ids[0], token));
  assert.equal(await store.getDinnerInvitation(ids[1], token), null);
  assert.equal(await store.getDinnerInvitation(ids[0], 'wrong-token'), null);
  const get = () => api.GET(new Request('https://example.test'), context(token));
  const patch = value => api.PATCH(new Request('https://example.test', { method: 'PATCH', body: JSON.stringify({ action: 'rsvp', value, policyVersion: attendance.ATTENDANCE_POLICY }) }), context(token));
  assert.equal((await calendar.GET(new Request('https://example.test'), context(token))).status, 409);
  assert.equal((await patch('yes')).status, 200);
  assert.equal((await (await get()).json()).member.rsvp, 'yes');
  const text = await (await get()).text();
  for (const value of ['synthetic-other-person', 'synthetic-private-token-0000002', 'members', 'applicationId']) assert(!text.includes(value));
  const file = await calendar.GET(new Request('https://example.test'), context(token));
  assert.equal(file.status, 200); const ics = await file.text();
  for (const value of ['ATTENDEE', 'ORGANIZER', token, 'synthetic-guest-a', 'synthetic-other-person']) assert(!ics.includes(value));
  assert.equal(file.headers.get('Cache-Control'), 'private, no-store');
  const fixed = { ...table, startsAt: '2026-10-09T18:00:00-07:00', endsAt: '2026-10-09T20:00:00-07:00' };
  assert(helpers.dinnerCalendarIcs(fixed).includes('DTSTART:20261010T010000Z\r\nDTEND:20261010T030000Z'));
  const link = new URL(helpers.googleCalendarLink(fixed));
  assert.equal(link.searchParams.get('ctz'), 'America/Los_Angeles');
  assert.equal(link.searchParams.get('dates'), '20261010T010000Z/20261010T030000Z');
  assert.equal(helpers.scheduledTimesValid('2026-10-09T18:00:00', fixed.endsAt), false);
  assert.equal((await patch('no')).status, 200);
  assert.equal((await (await get()).json()).member.rsvp, 'no');
  assert.equal((await calendar.GET(new Request('https://example.test'), context(token))).status, 409);
  table.members[0].expiresAt = new Date(now - 1).toISOString(); await store.saveTable(table);
  assert.equal(await store.getDinnerInvitation(ids[0], token), null);
  assert.equal((await get()).status, 404);
  assert.equal((await patch('yes')).status, 404);
  assert.equal((await calendar.GET(new Request('https://example.test'), context(token))).status, 404);
  console.log('PASS: synthetic private storage; concurrent number reservations; token mismatch/expiry; accept and decline survive reads; no other guest data; RSVP-gated calendar; Pacific/UTC times; no calendar attendee list.');
})().catch(error => { console.error(error); process.exitCode = 1; });
