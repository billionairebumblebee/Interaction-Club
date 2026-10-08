import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const outbox = new Map();
let env = {}, mode = "ok", deliveries = 0, deliveredBody;
const job = { id: "test-id", kind: "response", record: { id: "test-id" } };
const photo = {};
new Function('exports', ts.transpileModule(readFileSync('lib/photo-consent.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(photo);
const mocks = {
  './photo-consent': photo,
  './invitation-agreement': { invitationAgreementComplete: () => false },
  "@vercel/blob": {
    get: async path => ({ stream: new Response(JSON.stringify(outbox.get(path))).body }),
    list: async () => ({ blobs: [...outbox.keys()].map(pathname => ({ pathname })), hasMore: false }),
    del: async path => outbox.delete(path),
  },
  "./concierge": { writeRecord: async (path, value) => outbox.set(path, value) },
};
const source = ts.transpileModule(readFileSync("lib/sheets.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const sheet = {};
new Function("exports", "require", "process", "fetch", "Response", "AbortSignal", "console", source)(sheet, name => mocks[name], { get env() { return env; } }, async (_url, options) => {
  deliveredBody = JSON.parse(options.body);
  assert.ok(outbox.has("sheet-outbox/response/test-id.json"), "durable outbox precedes delivery");
  deliveries++;
  if (mode === "offline") throw Error("offline");
  return Response.json({ ok: mode !== "rejected", id: mode === "wrong-id" ? "other-id" : job.id });
}, Response, AbortSignal, { error() {} });

assert.equal(await sheet.queueSheetRecord(job), "pending");
assert.equal(deliveries, 0);
env = { GOOGLE_SHEETS_WEBHOOK_URL: "https://example.test/webhook", GOOGLE_SHEETS_WEBHOOK_SECRET: "test-only" };
for (mode of ["offline", "rejected", "wrong-id"]) {
  assert.equal(await sheet.queueSheetRecord(job), "pending");
  assert.equal(outbox.size, 1, "unacknowledged jobs stay recoverable");
}
mode = "ok";
assert.equal((await sheet.retrySheetJobs()).synced, 1);
assert.equal(outbox.size, 0);
const datedJob = {...job, record:{...job.record, availability:['Mon dinner'], pilotWeekAvailability:{dinnerDates:['2026-10-08','2026-10-09']}}};
assert.equal(await sheet.queueSheetRecord(datedJob), 'synced');
assert.deepEqual(deliveredBody.record.availability,['Mon dinner','This week: 2026-10-08, 6–8 p.m. Pacific','This week: 2026-10-09, 6–8 p.m. Pacific']);
assert.deepEqual(datedJob.record.availability,['Mon dinner'],'Sheet rendering never mutates private availability');
const questJob = {...job,record:{...job.record,availability:[],discipline:'Builder',sideQuestDays:['Thursday daytime'],sideQuestInvitations:true,sideQuestIdea:'Bowling'}};
assert.equal(await sheet.queueSheetRecord(questJob),'synced');
assert.deepEqual(deliveredBody.record.availability,['Side quest: Thursday daytime','Side-quest invitations: opted in, even outside usual availability']);
assert.equal(deliveredBody.record.discipline,['Builder','Side quest idea: Bowling',photo.photoConsentSummary(undefined)].join('\n'));
assert.equal(questJob.record.discipline,'Builder');
const hackathonJob = {...job,record:{...job.record,discipline:'Builder',hackathonGroupOptIn:true}};
assert.equal(await sheet.queueSheetRecord(hackathonJob),'synced');
assert.match(deliveredBody.record.discipline,/Innovation Intelligence Hackathon: wants to meet/);
assert.equal(hackathonJob.record.discipline,'Builder');
assert.equal(await sheet.queueSheetRecord({...hackathonJob,record:{...hackathonJob.record,hackathonGroupOptIn:false}}),'synced');
assert.equal(deliveredBody.record.discipline,['Builder',photo.photoConsentSummary(undefined)].join('\n'),'Unchecked does not imply attendance or refusal');
const communityJob = {...job,record:{...job.record,discipline:'An unchanged blurb',affiliations:['Mox'],communityOther:'',crossCommunityOptIn:true,referralSource:'mox'}};
assert.equal(await sheet.queueSheetRecord(communityJob),'synced');
assert.deepEqual(deliveredBody.record.affiliations,['Mox']);
assert.equal(deliveredBody.record.crossCommunityOptIn,true);
assert.equal(deliveredBody.record.referralSource,'mox');
assert.equal(deliveredBody.record.discipline,['An unchanged blurb',photo.photoConsentSummary(undefined)].join('\n'),'Structured community context stays out of the blurb');

const rows = [['ID','Submitted','Full name','Email','Based in','Birth month','Birth year','Age confirmed','Gender','Table formats','Activities','Budget tier','Max spend','Availability','Evening intent','Discipline','Interests','Dress preference','Food likes','Food dislikes','Dietary tags','Other dietary needs','Accessibility','Spontaneous opt-in','Agreement','Organizer notes'], ["other", ...Array(24).fill(""), "keep organizer note"]];
let writes = 0, locked = false;
const fakeSheet = {
  getLastRow: () => rows.length,
  getLastColumn: () => rows[0].length,
  getRange: (row, column, height, width) => ({
    getValues: () => [rows[row - 1].slice(column - 1, column - 1 + width)],
    createTextFinder: id => ({ matchEntireCell: () => ({ findNext: () => {
      const i = rows.findIndex((r, index) => index > 0 && r[0] === id);
      return i < 0 ? null : { getRow: () => i + 1 };
    } }) }),
    setValues: values => { assert.ok(locked); writes++; rows[row - 1] ??= []; values[0].forEach((v,i) => { rows[row - 1][column - 1 + i] = v; }); assert.equal(values[0].length, width); },
  }),
};
const context = {
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => "test-only" }) },
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: name => name === "RESPONSES" ? fakeSheet : null }) },
  LockService: { getScriptLock: () => ({ waitLock: () => { locked = true; }, releaseLock: () => { locked = false; } }) },
  ContentService: { MimeType: { JSON: "json" }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) },
};
vm.createContext(context);
vm.runInContext(readFileSync("scripts/google-sheets-inbox.gs", "utf8"), context);
const post = secret => context.doPost({ postData: { contents: JSON.stringify({ secret, id: "other", kind: "response", record: { id: "other", fullName: "=not a formula", email: "test@example.test" } }) } });
assert.equal(post("wrong").ok, false);
assert.equal(writes, 0);
assert.equal(post("test-only").ok, true);
assert.equal(post("test-only").ok, true);
assert.equal(rows.length, 2, "replay upserts by ID rather than duplicating");
assert.equal(rows[1][2], "'=not a formula");
assert.equal(rows[1][25], "keep organizer note");
assert.equal(locked, false);
console.log("PASS: durable queuing, failed delivery recovery, matching acknowledgments, webhook authentication, idempotent replay, formula escaping, and organizer-column preservation.");
