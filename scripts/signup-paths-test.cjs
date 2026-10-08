const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, deps = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', 'process', code)(exports, name => deps[name] || require(name), { env: { BLOB_READ_WRITE_TOKEN: 'synthetic-test-only', GOOGLE_SHEETS_WEBHOOK_URL: 'https://example.invalid/synthetic', GOOGLE_SHEETS_WEBHOOK_SECRET: 'synthetic-test-only' } });
  return exports;
}
const records = [], jobs = [];
const deps = Object.fromEntries(['communities', 'dress-code', 'interest-tags', 'availability', 'arrival-style', 'personality-quiz', 'school-work', 'locations', 'pilot-week', 'side-quests', 'photo-consent', 'participation-terms'].map(name => ['@/lib/' + name, load('lib/' + name + '.ts')]));
deps['@/lib/signup-availability'] = load('lib/signup-availability.ts', { './availability': deps['@/lib/availability'], './pilot-week': deps['@/lib/pilot-week'] });
const api = load('app/api/applications/route.ts', { ...deps, '@/lib/matching': { eveningIntents: ['Builder / founder', 'Chill / social', 'Open to either'] }, '@vercel/blob': { put: async (_path, body) => records.push(JSON.parse(body)) }, '@/lib/sheets': { queueSheetRecord: async job => jobs.push(job) }, '@/lib/referrals': { resolveInviter: async () => null }, '@/lib/interest-catalog': { publishInterestTags: async () => {} } });
const basic = { photoConsent: { version: deps['@/lib/photo-consent'].PHOTO_CONSENT_VERSION, capture: false, hackathon: false, publicPosting: false }, participationTermsVersion: deps['@/lib/participation-terms'].PARTICIPATION_TERMS_VERSION, fullName: 'Synthetic QA', email: 'qa@example.invalid', birthMonth: 1, birthYear: 2006, ageConfirmed: true, agreement: true, baseArea: 'Oakland', willingToTravelToBerkeley: true, intent: 'Chill / social', activities: ['Dinner'], budget: 'Under $15', tableFormats: ['Inclusive / everyone'], pilotDinnerDates: [], availability: [], interests: ['Art', 'ART'], discipline: 'I enjoy ceramics.' };
const post = value => api.POST(new Request('https://example.invalid/api/applications', { method: 'POST', body: JSON.stringify(value) }));
(async () => {
  for (const empty of [undefined, null, '', '   ', [], [''], [' '], ['not a time']]) {
    const response = await post({ ...basic, availability: empty });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).field, 'availability');
  }
  assert.equal(records.length, 0, 'Invalid availability is rejected before storage');
  assert.equal(jobs.length, 0, 'Invalid availability never reaches Sheets');
  basic.availability = ['Thu dinner'];
  for (const quizPath of ['quick', 'quiz']) {
    const value = { ...basic, invitedBy: 'mox', quizPath, affiliations: ['Mox', 'Innovation Intelligence Hackathon'], crossCommunityOptIn: true, communityOther: '', discipline: 'My unchanged blurb.', moxPilotAgreementConfirmed: true };
    assert.equal((await post(value)).status, 201);
    assert.deepEqual(records.at(-1).affiliations, ['Mox', 'Innovation Intelligence Hackathon']);
    assert.equal(records.at(-1).referralSource, 'mox');
    assert.equal(records.at(-1).invitedBy, null, 'Referral source is not verified membership or a personal referrer');
    assert.equal(records.at(-1).crossCommunityOptIn, true);
    assert.equal(records.at(-1).moxPilotAgreementConfirmed, undefined, 'Member intake cannot confirm the organizational agreement');
    assert.equal(records.at(-1).communityPilotAgreement, undefined);
    assert.equal(jobs.at(-1).kind, 'response', 'Signup saves only a profile, not an invitation or table');
    assert.equal(records.at(-1).discipline, 'My unchanged blurb.');
    assert.equal(records.at(-1).photoConsent.capture, false, 'Both paths retain explicit no-photo choices');
    assert.equal(records.at(-1).photoConsent.publicPosting, false, 'No promotional permission is inferred');
    assert.deepEqual(jobs.at(-1).record.photoConsent, records.at(-1).photoConsent, 'Sheet delivery preserves the actual choice');
    assert.deepEqual(jobs.at(-1).record.affiliations, records.at(-1).affiliations, 'Structured fields are exported to the private Sheet');
  }
  assert.equal((await post({ ...basic, invitedBy: 'mox' })).status, 201);
  assert.equal(records.at(-1).crossCommunityOptIn, null);
  assert.deepEqual(records.at(-1).affiliations, [], 'Mox link must not preselect membership');
  records.length = 0; jobs.length = 0;
  assert.equal((await post(basic)).status, 201);
  assert.equal(records[0].willingToTravelToBerkeley, true);
  assert.deepEqual(records[0].interests, ['Art']);
  assert.equal(records[0].yapper, null);
  assert.equal(records[0].currentRabbitHole, '');
  assert.equal((await post({ ...basic, yapper: 'Depends on…', yapperContext: '', currentRabbitHole: 'Urban birdwatching', dinnerSideQuest: 'Dessert expedition', tenMinuteTopic: 'Local birds', meetAgainSpark: 'We laughed at the same things', dietaryNeeds: ['Peanut allergy'], accessibilityNotes: 'Step-free entrance' })).status, 201);
  assert.equal(records[1].yapper, 'Depends on…'); assert.equal(records[1].yapperContext, '');
  assert.equal(records[1].currentRabbitHole, 'Urban birdwatching');
  assert.deepEqual(records[1].dietaryNeeds, ['Peanut allergy']);
  assert.equal(records[1].accessibilityNotes, 'Step-free entrance');
  assert.equal(jobs[1].record.currentRabbitHole, 'Urban birdwatching');
  assert.equal((await post({ ...basic, yapper: 'No', yapperContext: 'Stored explanation' })).status, 201);
  assert.equal(records[2].yapperContext, 'Stored explanation');
  assert.equal((await post({ ...basic, birthYear: 2010 })).status, 400);
  assert.equal((await post({ ...basic, agreement: false })).status, 400);
  assert.equal((await post({ ...basic, tableFormats: [] })).status, 400);
  assert.equal((await post({ ...basic, budget: '' })).status, 400);
  assert.equal((await post({ ...basic, interests: [], discipline: '' })).status, 201);
  assert.equal((await post({ ...basic, pronouns: 'they/them' })).status, 201);
  assert.equal(records.at(-1).pronouns, 'they/them');
  assert.equal(records.at(-1).gender, null, 'Pronouns never infer gender');
  assert.equal((await post({ ...basic, pronouns: '' })).status, 201);
  assert.equal(records.at(-1).pronouns, null);
  const originalFetch = global.fetch;
  let mirrored;
  global.fetch = async (_url, options) => { mirrored = JSON.parse(options.body); return Response.json({ ok: true, id: mirrored.id }); };
  try {
    const sheets = load('lib/sheets.ts', { './photo-consent': deps['@/lib/photo-consent'], './invitation-agreement': { invitationAgreementComplete: () => false }, '@vercel/blob': {}, './concierge': { writeRecord: async () => {} } });
    assert(await sheets.deliverSheetJob({ id: 'synthetic-export', kind: 'response', record: { ...records[1], yapper: null, yapperContext: 'Even without a choice', diningHallPreference: 'I’d be down for Crossroads', diningHallContext: 'Need to check access' } }));
    assert(mirrored.record.discipline.includes('Even without a choice'));
    assert(mirrored.record.discipline.includes('Urban birdwatching'));
    assert(mirrored.record.discipline.includes('Need to check access'));
    assert(mirrored.record.availability.some(value => value.includes('Willing to travel')));
    assert(mirrored.record.availability.includes('Thu dinner'), 'Selected times survive Sheet delivery');
  } finally { global.fetch = originalFetch; }
  for (const payload of [
    { ...basic, availability: [], pilotDinnerDates: ['2026-10-08'] },
    { ...basic, availability: ['Sun afternoon'], pilotDinnerDates: [] },
    { ...basic, pilotDinnerDates: undefined },
  ]) assert.equal((await post(payload)).status, 201, 'Dated, recurring and legacy valid answers remain accepted');
  for (const payload of [
    { ...basic, availability: [], pilotDinnerDates: ['bogus'] },
    { ...basic, availability: [], pilotDinnerDates: [], spontaneous: true, sideQuestInvitations: true, sideQuestDays: ['Sunday daytime'] },
    { ...basic, availability: [], pilotDinnerDates: undefined, availablePilotWeek: true },
  ]) assert.equal((await post(payload)).status, 400, 'An opt-in or old broad boolean is not a usable time');
  console.log('PASS: availability required before storage; valid dated/recurring/legacy times preserved; optional answers, consent and Sheet export; synthetic mocks only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
