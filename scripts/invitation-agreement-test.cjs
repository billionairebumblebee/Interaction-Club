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
const arrival = load('lib/dinner-arrival.ts');
const attendance = load('lib/attendance.ts', { './dinner-arrival': arrival });
const payload = { action: 'rsvp', value: 'yes', policyVersion: attendance.ATTENDANCE_POLICY, agreement: true, termsVersion: terms.PARTICIPATION_TERMS_VERSION, photoConsent: { version: photo.PHOTO_CONSENT_VERSION, capture: false, hackathon: false, publicPosting: false, recordedAt: 'forged-client-time' } };
assert.equal(agreement.invitationAgreementComplete({}), false);
assert.equal(terms.PARTICIPATION_TERMS_VERSION, '2026-10-08-v1');
const previousAcceptance = { version:'2026-10-07-v2', acceptedAt:'2026-10-07T12:00:00Z' };
assert.equal(agreement.invitationAgreementComplete({ termsAcceptance:previousAcceptance, photoConsent:{version:photo.PHOTO_CONSENT_VERSION,capture:false,hackathon:false,publicPosting:false,recordedAt:'2026-10-07T12:00:00Z'} }), false, 'Sober-policy update requires renewed acceptance');
assert.throws(() => agreement.acceptInvitationAgreement({ ...payload, termsVersion:'2026-10-07-v2' }, '2026-10-08T12:00:00Z'));
assert.equal(agreement.invitationAgreementComplete({ termsAcceptance: {version:'2026-10-07-v1',acceptedAt:'2026-10-07T12:00:00Z'}, photoConsent:{version:photo.PHOTO_CONSENT_VERSION,capture:false,hackathon:false,publicPosting:false,recordedAt:'2026-10-07T12:00:00Z'} }),false,'Previous terms acceptance is historical, not upgraded automatically');
assert.throws(() => agreement.acceptInvitationAgreement({ ...payload, termsVersion: '2026-10-07-v1' }, '2026-10-07T12:00:00Z'),'New confirmations require updated terms');
assert.throws(() => agreement.acceptInvitationAgreement({ ...payload, agreement: false }, '2026-10-07T12:00:00Z'));
assert.throws(() => agreement.acceptInvitationAgreement({ ...payload, termsVersion: 'old' }, '2026-10-07T12:00:00Z'));
assert.throws(() => agreement.acceptInvitationAgreement({ ...payload, photoConsent: {} }, '2026-10-07T12:00:00Z'));

(async () => {
  let member = { applicationId: 'synthetic', token: 'private-test', rsvp: 'pending', attendance: 'unknown' };
  const table = { id: 'test-table', activity: 'Dinner', status: 'invited', startsAt: new Date(Date.now() + 86400000).toISOString(), venueAddress: 'Test only', cost: 15, sponsorDisclosure: 'No sponsor', members: [member] };
  let saves = 0, exports = [];
  const api = load('app/api/table/[token]/route.ts', { '@/lib/invitation-agreement': agreement, '@/lib/attendance': attendance, '@/lib/dinner-arrival': arrival, '@/lib/arrival-host': { getArrivalPlan: async () => ({hostName:'Synthetic host',landmark:'Pink sign'}) },
    '@/lib/concierge': { findTableByToken: async () => ({ table, memberIndex: 0 }), listTables: async () => [table], updateMember: async (_, id, transform) => { const value = transform(table.members.find(item => item.applicationId === id), table); saves++; member = value; table.members[0] = value; return value; } },
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
  table.members[0] = { ...member, termsAcceptance: { ...previousAcceptance } };
  assert.equal((await patch({action:'rsvp',value:'yes'})).status,400,'Previous version cannot silently renew');
  assert.deepEqual(table.members[0].termsAcceptance, previousAcceptance, 'Rejected renewal leaves historical acceptance unchanged');
  assert.equal((await patch(payload)).status,200,'Explicit renewal accepts the sober-policy version');
  assert.deepEqual(member.termsAcceptanceHistory, [previousAcceptance], 'Exact old version and timestamp retained');
  assert.equal(member.termsAcceptance.version, '2026-10-08-v1');
  assert.equal((await patch({action:'rsvp',value:'no',declineReason:'The time doesn’t work',confirmLateCancellation:true})).status,200);
  const originalCancellation = structuredClone(member.cancellation);
  assert.equal((await patch(payload)).status,400,'Old Yes payload cannot reclaim a canceled seat');
  assert.deepEqual(member.cancellation,originalCancellation,'Replay preserves cancellation history');
  table.members[0] = { applicationId:'legacy',token:'private-test',rsvp:'yes',attendance:'unknown' };
  assert.equal((await patch({action:'check-in'})).status,400,'Legacy Calendar Yes does not substitute for acceptance');
  table.members[0].rsvp = 'pending';
  assert.equal((await patch({action:'rsvp',value:'no',declineReason:'The time doesn’t work'})).status,200,'Guests can decline without signing');
  const blobs = new Map();
  const store = load('lib/concierge.ts', {'./dinner-invitation':{}, '@vercel/blob': { put:async (path,value)=>blobs.set(path,value), get:async()=>null, list:async()=>({blobs:[],hasMore:false}) }});
  const accepted = agreement.acceptInvitationAgreement(payload,new Date().toISOString());
  await store.saveMember('test-table',{applicationId:'synthetic',token:'private',rsvp:'yes',attendance:'unknown',...accepted,termsAcceptanceHistory:[previousAcceptance]});
  const saved = JSON.parse(blobs.get('participation/test-table/synthetic.json'));
  assert.deepEqual(saved.state.photoConsent,accepted.photoConsent);
  assert.deepEqual(saved.state.termsAcceptance,accepted.termsAcceptance);
  assert.deepEqual(saved.state.termsAcceptanceHistory,[previousAcceptance], 'Consent history remains durable');
  console.log('Invitation agreements: rejection, all-No photo choices, server timestamps, persistence, reload and legacy check-in tests passed. No live records changed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
