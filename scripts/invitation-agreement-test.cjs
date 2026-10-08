const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, deps = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', 'process', code)(exports, name => deps[name] || require(name), { env: { BLOB_READ_WRITE_TOKEN: 'mock' } });
  return exports;
}
const photo = load('lib/photo-consent.ts');
const terms = load('lib/participation-terms.ts');
const agreement = load('lib/invitation-agreement.ts', { './photo-consent': photo, './participation-terms': terms });
const attendance = load('lib/attendance.ts');
const payload = { action: 'rsvp', value: 'yes', policyVersion: attendance.ATTENDANCE_POLICY, agreement: true, termsVersion: terms.PARTICIPATION_TERMS_VERSION, photoConsent: { version: photo.PHOTO_CONSENT_VERSION, capture: false, hackathon: false, publicPosting: false, recordedAt: 'forged-client-time' } };
assert.equal(agreement.invitationAgreementComplete({}), false);
assert.equal(agreement.invitationAgreementComplete({ termsAcceptance: {version:'2026-10-07-v1',acceptedAt:'2026-10-07T12:00:00Z'}, photoConsent:{version:photo.PHOTO_CONSENT_VERSION,capture:false,hackathon:false,publicPosting:false,recordedAt:'2026-10-07T12:00:00Z'} }),false,'Previous terms acceptance is historical, not upgraded automatically');
assert.throws(() => agreement.acceptInvitationAgreement({ ...payload, termsVersion: '2026-10-07-v1' }, '2026-10-07T12:00:00Z'),'New confirmations require updated terms');
assert.throws(() => agreement.acceptInvitationAgreement({ ...payload, agreement: false }, '2026-10-07T12:00:00Z'));
assert.throws(() => agreement.acceptInvitationAgreement({ ...payload, termsVersion: 'old' }, '2026-10-07T12:00:00Z'));
assert.throws(() => agreement.acceptInvitationAgreement({ ...payload, photoConsent: {} }, '2026-10-07T12:00:00Z'));

(async () => {
  let member = { applicationId: 'synthetic', token: 'private-test', rsvp: 'pending', attendance: 'unknown' };
  const table = { id: 'test-table', activity: 'Dinner', status: 'invited', startsAt: new Date(Date.now() + 86400000).toISOString(), venueAddress: 'Test only', cost: 15, sponsorDisclosure: 'No sponsor', members: [member] };
  let saves = 0, exports = [];
  const api = load('app/api/table/[token]/route.ts', { '@/lib/invitation-agreement': agreement, '@/lib/attendance': attendance,
    '@/lib/concierge': { findTableByToken: async () => ({ table, memberIndex: 0 }), listTables: async () => [table], saveMember: async (_, value) => { saves++; member = value; table.members[0] = value; } },
    '@/lib/sheets': { queueSheetRecord: async value => exports.push(value) } });
  const ctx = { params: Promise.resolve({ token: 'private-test' }) };
  const patch = body => api.PATCH(new Request('https://example.invalid', { method: 'PATCH', body: JSON.stringify(body) }), ctx);
  for (const invalid of [{action:'rsvp',value:'yes'}, {...payload,agreement:false}, {...payload,photoConsent:{}}, {...payload,photoConsent:{version:photo.PHOTO_CONSENT_VERSION,capture:false,hackathon:true,publicPosting:false}}]) {
    assert.equal((await patch(invalid)).status, 400); assert.equal(saves, 0);
  }
  assert.equal((await patch(payload)).status, 200);
  assert.equal(member.rsvp, 'yes'); assert.equal(member.photoConsent.capture, false);
  assert.notEqual(member.photoConsent.recordedAt, 'forged-client-time');
  assert.equal(agreement.invitationAgreementComplete(member), true);
  assert.equal(exports.length, 1);
  assert.equal((await patch({...payload,agreement:false})).status,400,'Explicitly declining terms blocks Yes even after prior acceptance');
  const read = await (await api.GET(new Request('https://example.invalid'), ctx)).json();
  assert.deepEqual(read.member.photoConsent, member.photoConsent);
  assert.equal(read.member.termsAcceptance.version, terms.PARTICIPATION_TERMS_VERSION);
  assert.equal((await patch({action:'rsvp',value:'yes'})).status,200,'Already accepted agreements are not re-required');
  table.members[0] = { applicationId:'legacy',token:'private-test',rsvp:'yes',attendance:'unknown' };
  assert.equal((await patch({action:'check-in'})).status,400,'Legacy Calendar Yes does not substitute for acceptance');
  table.members[0].rsvp = 'pending';
  assert.equal((await patch({action:'rsvp',value:'no'})).status,200,'Guests can decline without signing');
  const blobs = new Map();
  const store = load('lib/concierge.ts', {'./dinner-invitation':{}, '@vercel/blob': { put:async (path,value)=>blobs.set(path,value), get:async()=>null, list:async()=>({blobs:[],hasMore:false}) }});
  const accepted = agreement.acceptInvitationAgreement(payload,new Date().toISOString());
  await store.saveMember('test-table',{applicationId:'synthetic',token:'private',rsvp:'yes',attendance:'unknown',...accepted});
  const saved = JSON.parse(blobs.get('participation/test-table/synthetic.json'));
  assert.deepEqual(saved.state.photoConsent,accepted.photoConsent);
  assert.deepEqual(saved.state.termsAcceptance,accepted.termsAcceptance);
  console.log('Invitation agreements: rejection, all-No photo choices, server timestamps, persistence, reload and legacy check-in tests passed. No live records changed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
