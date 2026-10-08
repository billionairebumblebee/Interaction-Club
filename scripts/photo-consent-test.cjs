const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, deps = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', 'process', code)(exports, name => deps[name] || require(name), { env: { BLOB_READ_WRITE_TOKEN: 'synthetic-test-only', GOOGLE_SHEETS_WEBHOOK_URL: 'https://example.invalid', GOOGLE_SHEETS_WEBHOOK_SECRET: 'synthetic-test-only' } });
  return exports;
}
const photo = load('lib/photo-consent.ts');
const time = '2026-10-07T12:00:00.000Z';
assert.equal(photo.cleanPhotoConsent(undefined, time), null);
assert.equal(photo.cleanPhotoConsent({version:'old',capture:true}, time), null);
assert.equal(photo.cleanPhotoConsent({version:photo.PHOTO_CONSENT_VERSION,capture:'true',hackathon:true,publicPosting:true},time), null);
assert.equal(photo.cleanPhotoConsent({version:photo.PHOTO_CONSENT_VERSION,capture:false,hackathon:true,publicPosting:true},time), null);
assert.equal(photo.cleanPhotoConsent({version:'2026-10-07-v1',capture:true,hackathon:true,publicPosting:false},time).hackathon,true,'Preserve older valid photo grants');
const deps = Object.fromEntries(['dress-code','interest-tags','availability','arrival-style','personality-quiz','school-work','locations','pilot-week','side-quests','participation-terms'].map(name => ['@/lib/'+name,load('lib/'+name+'.ts')]));
const records = [], jobs = [];
const api = load('app/api/applications/route.ts', {...deps,'@/lib/photo-consent':photo,'@/lib/matching':{eveningIntents:['Chill / social']},'@vercel/blob':{put:async(_path,body)=>records.push(JSON.parse(body))},'@/lib/sheets':{queueSheetRecord:async job=>jobs.push(job)},'@/lib/referrals':{resolveInviter:async()=>null},'@/lib/interest-catalog':{publishInterestTags:async()=>{}}});
const basic={fullName:'Synthetic QA',email:'qa@example.invalid',birthMonth:1,birthYear:2000,ageConfirmed:true,agreement:true,baseArea:'Berkeley',intent:'Chill / social',activities:['Dinner'],budget:'Under $15',tableFormats:['Inclusive / everyone'],pilotDinnerDates:[],participationTermsVersion:deps['@/lib/participation-terms'].PARTICIPATION_TERMS_VERSION};
(async()=>{
  const post=payload=>api.POST(new Request('https://example.invalid/api/applications',{method:'POST',body:JSON.stringify(payload)}));
  assert.equal((await post(basic)).status,400,'Unanswered photo choices rejected');
  assert.equal((await post({...basic,photoConsent:{version:photo.PHOTO_CONSENT_VERSION,capture:true,hackathon:null,publicPosting:false}})).status,400);
  for (const choices of [{version:photo.PHOTO_CONSENT_VERSION,capture:false,hackathon:false,publicPosting:false},{version:photo.PHOTO_CONSENT_VERSION,capture:true,hackathon:true,publicPosting:false}]) {
    const response=await api.POST(new Request('https://example.invalid/api/applications',{method:'POST',body:JSON.stringify({...basic,photoConsent:choices})}));
    assert.equal(response.status,201,'All No and limited Yes answers both permit joining');
  }
  assert.equal(records[0].photoConsent.capture,false);
  assert.equal(records[1].photoConsent.hackathon,true);
  assert.equal(records[1].photoConsent.publicPosting,false);
  assert.match(records[1].photoConsent.recordedAt,/^2026-/);
  assert.deepEqual(jobs[1].record.photoConsent,records[1].photoConsent);
  assert.equal(records[1].termsAcceptance.version,basic.participationTermsVersion);
  assert.equal((await post({...basic,photoConsent:records[0].photoConsent,participationTermsVersion:'old'})).status,400,'Old terms cannot be silently accepted');
  assert.equal((await post({...basic,photoConsent:records[0].photoConsent,agreement:false})).status,400);
  const original=global.fetch; let mirrored;
  global.fetch=async(_url,options)=>{mirrored=JSON.parse(options.body);return Response.json({ok:true,id:mirrored.id});};
  try {
    const sheets=load('lib/sheets.ts',{'@vercel/blob':{},'./concierge':{writeRecord:async()=>{}},'./photo-consent':photo});
    assert(await sheets.deliverSheetJob({id:'synthetic-photo-export',kind:'response',record:{...records[1],discipline:'Original blurb'}}));
    assert.match(mirrored.record.discipline,/Original blurb/);
    assert.match(mirrored.record.discipline,/hackathon presentation YES/);
    assert.match(mirrored.record.discipline,/website\/socials NO/);
    assert.match(mirrored.record.discipline,/No sponsor reuse or paid ads/);
    assert.match(mirrored.record.discipline,/Participation terms accepted/);
  } finally { global.fetch=original; }
  console.log('PASS: required explicit answers; all-No signup; current terms acceptance; preserved older grants; fail-closed invalid choices; server timestamps and mocked Sheet export. No real profiles submitted.');
})().catch(error=>{console.error(error);process.exitCode=1;});
