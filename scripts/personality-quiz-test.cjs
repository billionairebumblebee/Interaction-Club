const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, requireModule = () => { throw Error('Unexpected import'); }) {
  const result = {};
  new Function('exports', 'require', 'process', ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(result, requireModule, { env: { BLOB_READ_WRITE_TOKEN: 'mock-only' } });
  return result;
}
let saved, queued;
const api = load('app/api/applications/route.ts', name => {
  if (name === '@vercel/blob') return { put: async (_, value) => { saved = JSON.parse(value); } };
  if (name === '@/lib/sheets') return { queueSheetRecord: async job => { queued = job.record; } };
  if (name === '@/lib/matching') return { eveningIntents: ['Chill / social'] };
  if (name === '@/lib/interest-catalog') return { publishInterestTags: async () => {} };
  if (name === '@/lib/referrals') return { resolveInviter: async slug => slug === 'vivian' ? {slug, name: 'Vivian'} : null };
  if (name.startsWith('@/lib/')) return load(`lib/${name.slice(6)}.ts`);
  throw Error(`Unexpected dependency ${name}`);
});
const payload = { fullName: 'Test Guest', email: 'test@example.test', birthMonth: 1, birthYear: 2000, baseArea: 'Berkeley', activities: ['Dinner'], budget: 'Under $15', availability: ['Sat dinner'], tableFormats: ['Inclusive / everyone'], intent: 'Chill / social', ageConfirmed: true, agreement: true };
(async () => {
  for (const pilotDinnerDates of [[], ['2026-10-08'], ['2026-10-09'], ['2026-10-08','2026-10-09']]) {
    const response = await api.POST(new Request('http://test/api/applications', {method:'POST',body:JSON.stringify({...payload,availability:[],pilotDinnerDates})}));
    assert.equal(response.status,201);
    assert.deepEqual(saved.pilotWeekAvailability.dinnerDates,pilotDinnerDates);
    assert.deepEqual(saved.availability,[],'Exact dates do not become recurring availability');
    assert.deepEqual(queued.pilotWeekAvailability,saved.pilotWeekAvailability);
  }
  for (const availablePilotWeek of [true, false]) {
    const response = await api.POST(new Request('http://test/api/applications', {method:'POST',body:JSON.stringify({...payload,availablePilotWeek})}));
    assert.equal(response.status,201);
    assert.deepEqual(saved.pilotWeekAvailability,{startsOn:'2026-10-06',endsOn:'2026-10-10',available:availablePilotWeek});
    assert.deepEqual(queued.pilotWeekAvailability,saved.pilotWeekAvailability);
  }
  const referred = await api.POST(new Request('http://test/api/applications', {method: 'POST', body: JSON.stringify({...payload, invitedBy: 'vivian'})}));
  assert.equal(referred.status, 201);
  assert.equal(saved.invitedBy, 'vivian');
  assert.equal(queued.invitedBy, 'vivian');
  const quest = await api.POST(new Request('http://test/api/applications',{method:'POST',body:JSON.stringify({...payload,sideQuestDays:['Thursday daytime','Saturday daytime','invalid','Thursday daytime'],sideQuestInvitations:true,sideQuestIdea:'  Theme park!  '})}));
  assert.equal(quest.status,201);
  assert.deepEqual(saved.sideQuestDays,['Thursday daytime','Saturday daytime']);
  assert.equal(saved.sideQuestInvitations,true);
  assert.equal(saved.sideQuestIdea,'Theme park!');
  assert.deepEqual(queued.sideQuestDays,saved.sideQuestDays);
  for (const answers of [{}, { conversationStyle: 'Start chatting', conversationTopic: 'Ridiculous hypotheticals', mbti: 'ENFP' }, { conversationStyle: 'unknown', conversationTopic: 12, mbti: 'bad' }]) {
    const response = await api.POST(new Request('http://test/api/applications', { method: 'POST', body: JSON.stringify({ ...payload, ...answers }) }));
    assert.equal(response.status, 201, await response.text());
    for (const key of ['conversationStyle', 'conversationTopic', 'mbti']) {
      const expected = answers.mbti === 'ENFP' ? answers[key] : null;
      assert.equal(saved[key], expected);
      assert.equal(queued[key], expected);
    }
  }
  const source = fs.readFileSync('app/join/page.tsx', 'utf8');
  for (const baseArea of ['Berkeley', 'San Francisco', 'Oakland', 'San Jose', 'Elsewhere in the Bay']) {
    const response = await api.POST(new Request('http://test/api/applications', {method: 'POST', body: JSON.stringify({...payload, baseArea})}));
    assert.equal(response.status, 201, `Accept the enabled area ${baseArea}`);
    assert.equal(saved.baseArea, baseArea);
    assert.equal(queued.baseArea, baseArea);
  }
  assert(source.includes('We’re piloting Berkeley for now. No address needed.'));
  assert(source.includes('baseAreas.map(area => <option key={area}>{area}</option>)'));
  const schoolResponse = await api.POST(new Request('http://test/api/applications', {method: 'POST', body: JSON.stringify({...payload, schoolStage: 'College: first year', major: ' Mechanical engineering ', industry: 'Tech', jobTitle: 'Intern'})}));
  assert.equal(schoolResponse.status, 201);
  assert.equal(saved.schoolStage, 'College: first year');
  assert.equal(saved.major, 'Mechanical engineering');
  assert.equal(queued.industry, 'Tech');
  assert.equal(queued.jobTitle, 'Intern');
  const underage = await api.POST(new Request('http://test/api/applications', {method: 'POST', body: JSON.stringify({...payload, birthYear: new Date().getFullYear() - 16, schoolStage: 'High school'})}));
  assert.equal(underage.status, 400, 'School/work answers never override the adult requirement');
  assert(source.includes('if (step === 1 && (!form.intent'), 'Plan validation follows its second step');
  assert(source.includes('STEP {step + 1} OF 3'), 'Only three signup steps');
  assert(source.includes('A little more about you (optional)'), 'Personality extras are optional and collapsed');
  assert(source.includes('conversationStyle: "", conversationTopic: "", mbti: ""'), 'No personality defaults');
  console.log('PASS: optional quiz answers, sanitization, saved and queued data, new step order and plan validation. No external writes.');
})().catch(error => { console.error(error); process.exit(1); });
