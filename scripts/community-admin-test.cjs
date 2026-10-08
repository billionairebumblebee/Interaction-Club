const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(file, mocks = {}) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', 'process', code)(exports, name => mocks[name] || (name.startsWith('./') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name)), { env: {} });
  return exports;
}
const now = new Date();
const people = ['A', 'B'].map((id, i) => ({ id, fullName: 'Synthetic ' + id, email: id + '@example.test', baseArea: 'San Francisco', affiliations: ['Mox'], referralSource: 'mox', crossCommunityOptIn: false, birthMonth: 1, birthYear: now.getUTCFullYear() - 24, agreement: true, ageConfirmed: true, gender: i ? 'Man' : 'Woman', intent: 'Chill / social', tableFormats: ['Inclusive / everyone'], activities: ['Dinner'], budget: '$15–30', availability: ['Fri dinner'], interests: ['Art'], submittedAt: now.toISOString() }));
const stored = [], jobs = [];
const concierge = { requireAdmin: request => request.headers.get('x-interaction-admin-key') === 'synthetic', listApplications: async () => people, listTables: async () => [], reserveDinnerId: async () => 'dinner-02', saveTable: async table => stored.push(table) };
const matching = load('lib/matching.ts');
const matchApi = load('app/api/admin/match/route.ts', { '@/lib/concierge': concierge, '@/lib/matching': matching });
const admin = load('app/api/admin/route.ts', { '@/lib/concierge': concierge, '@/lib/matching': matching, '@/lib/dinner-invitation': { scheduledTimesValid: () => true }, '@/lib/sheets': { queueSheetRecord: async job => { jobs.push(job); return 'synced'; } }, '@/lib/host-contact': { cleanHostContactEmail: value => value === 'host@example.test' ? value : '' } });
const body = { photoMode: 'photo-free', activity: 'Dinner', intent: 'Chill / social', format: 'Inclusive / everyone', slot: 'Fri dinner', ageBand: '23–29', size: 2, cost: 20, startsAt: '2027-01-16T02:00:00Z', endsAt: '2027-01-16T03:00:00Z', responseDeadline: '2027-01-15T02:00:00Z', eventScope: 'community-only', community: 'Mox', venueArea: 'San Francisco', hostContactEmail: 'host@example.test', venueName: 'Synthetic venue', venueAddress: 'Synthetic QA only', costDetails: 'Test', sponsorDisclosure: 'None', venueNotes: 'Test-reviewed', venueReviewed: true, hosted: true, hostName: 'QA', hostApproved: true, matchingRationale: 'Synthetic test of consent boundaries', memberIds: ['A', 'B'] };
const request = value => new Request('https://example.invalid/api/admin', { method: 'POST', headers: { 'x-interaction-admin-key': 'synthetic' }, body: JSON.stringify(value) });
(async () => {
  const get = await admin.GET(new Request('https://example.invalid/api/admin', { headers: { 'x-interaction-admin-key': 'synthetic' } }));
  const inbox = await get.json();
  assert.deepEqual(inbox.applications[0].affiliations, ['Mox']);
  assert.equal(inbox.applications[0].referralSource, 'mox');
  for (const unconfirmed of [undefined, false, 'true']) {
    const pending = { ...body, moxPilotAgreementConfirmed: unconfirmed };
    assert.equal((await admin.POST(request(pending))).status, 400);
    const proposal = await matchApi.POST(request(pending));
    assert.equal(proposal.status, 400);
    assert.match((await proposal.json()).error, /Member registration does not activate a Mox pilot/);
  }
  assert.equal(stored.length, 0, 'No Mox invitation is created without organizer confirmation');
  assert.equal(jobs.length, 0, 'No event is queued to Sheets before agreement');
  body.moxPilotAgreementConfirmed = true;
  assert.equal((await admin.POST(request(body))).status, 201);
  assert.equal((await matchApi.POST(request(body))).status, 200);
  assert.equal((await matchApi.POST(request({ ...body, eventScope: undefined }))).status, 400);
  assert.equal((await (await matchApi.POST(request({ ...body, eventScope: 'cross-community' }))).json()).groups.length, 0);
  assert.equal(stored[0].eventScope, 'community-only');
  assert.equal(stored[0].community, 'Mox');
  assert.equal(stored[0].communityPilotAgreement.organization, 'Mox');
  assert.equal(stored[0].communityPilotAgreement.confirmedBy, 'organizer');
  assert(stored[0].communityPilotAgreement.confirmedAt);
  assert.equal(stored[0].venueArea, 'San Francisco');
  assert.equal(jobs[0].record.community, 'Mox');
  assert.equal((await admin.POST(request({ ...body, eventScope: 'cross-community' }))).status, 400);
  assert.equal((await admin.POST(request({ ...body, eventScope: undefined }))).status, 400);
  people.forEach(person => person.crossCommunityOptIn = true);
  assert.equal((await admin.POST(request({ ...body, eventScope: 'cross-community' }))).status, 201);
  assert.equal(stored[1].community, undefined, 'General event does not masquerade as a closed client event');
  assert.equal(stored[1].communityPilotAgreement, undefined, 'Wider-club events do not claim a Mox agreement');
  assert.equal(stored[0].community, 'Mox', 'Existing closed event stays closed');
  console.log('PASS: private admin roundtrip, closed affiliation/location scope, explicit new-event scope, broader consent and structured group export; synthetic mocks only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
