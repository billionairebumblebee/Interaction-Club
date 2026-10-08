import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const headers = ['ID', 'Full name', 'Terms & conditions', 'Show-up agreement', 'Photo release', 'Consent details', 'About you', 'Organizer notes', 'Original show-up agreement', 'Availability window start', 'Availability'];
const rows = [headers, ['one', '', '', '', '', '', '', 'Keep this note']];
let locked = false;
const sheet = {
  getLastRow: () => rows.length, getLastColumn: () => headers.length,
  getRange: (row, col, height, width) => ({
    getValues: () => [rows[row - 1].slice(col - 1, col - 1 + width)],
    createTextFinder: id => ({ matchEntireCell: () => ({ findNext: () => {
      const index = rows.findIndex((r, i) => i > 0 && r[0] === id);
      return index < 0 ? null : { getRow: () => index + 1 };
    } }) }),
    setValues: values => { assert.ok(locked); assert.equal(values[0].length, width); rows[row - 1] ??= []; values[0].forEach((v, i) => rows[row - 1][col - 1 + i] = v); },
  }),
};
const context = {
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'test' }) },
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet }) },
  LockService: { getScriptLock: () => ({ waitLock: () => { locked = true; }, releaseLock: () => { locked = false; } }) },
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) },
};
vm.createContext(context);
vm.runInContext(readFileSync('scripts/google-sheets-inbox.gs', 'utf8'), context);
function post(record, secret = 'test') { return context.doPost({ postData: { contents: JSON.stringify({ secret, id: record.id, kind: 'response', record }) } }); }
const record = { id: 'one', fullName: '=test', discipline: 'Original blurb\nPhoto permissions (2026-10-07-v3; now): capture YES\nParticipation terms accepted: 2026-10-07-v2; now', agreement: true, termsAcceptance: { version: '2026-10-07-v2', acceptedAt: 'now' }, photoConsent: { version: '2026-10-07-v3', recordedAt: 'now', capture: true, hackathon: true, publicPosting: true } };
assert.equal(post(record, 'wrong').ok, false);
assert.equal(post(record).ok, true);
assert.equal(post({ ...record, availability: ['Thu dinner', 'This week: 2026-10-08, 6–8 p.m. Pacific'] }).ok, true);
assert.equal(rows[1][10], 'Thu dinner, This week: 2026-10-08, 6–8 p.m. Pacific', 'Header-based availability column preserves recurring and dated times');
assert.deepEqual(rows[1].slice(2, 5), ['Yes', 'Yes', 'Yes']);
assert.equal(rows[1][6], 'Original blurb');
assert.equal(rows[1][7], 'Keep this note');
assert.equal(rows[1][1], "'=test");
assert.match(rows[1][5], /2026-10-07-v3; now/);
assert.equal(post(record).ok, true);
assert.equal(rows.length, 2);
assert.equal(post({ id: 'legacy', agreement: true }).ok, true);
assert.deepEqual(rows[2].slice(2, 5), ['No answer', 'No answer', 'No answer']);
assert.equal(post({ ...record, photoConsent: { ...record.photoConsent, capture: false, hackathon: false, publicPosting: false } }).ok, true);
assert.equal(rows[1][4], 'No');
assert.equal(post({ ...record, photoConsent: { ...record.photoConsent, hackathon: false } }).ok, true);
assert.equal(rows[1][4], 'Custom choices');
assert.equal(post({ ...record, affiliations: ['Mox', 'Innovation Intelligence Hackathon'], communityOther: '', crossCommunityOptIn: true, referralSource: 'mox' }).ok, true);
assert.equal(rows[1][headers.indexOf('Community affiliations (self-reported)')], 'Mox, Innovation Intelligence Hackathon');
assert.equal(rows[1][headers.indexOf('Wider community opt-in')], 'Yes');
assert.equal(rows[1][headers.indexOf('Referral source')], 'mox');
assert.equal(post({ id: 'legacy', agreement: true }).ok, true);
assert.equal(rows[2][headers.indexOf('Wider community opt-in')], 'Not recorded');
assert.equal(rows[1][6], 'Original blurb', 'Community fields stay separate from the blurb');
console.log('PASS: reordered headers, separate consent, exact blurb, legacy unanswered status, photo declines, partial grants, authentication, idempotency, formula escaping, and organizer notes.');
