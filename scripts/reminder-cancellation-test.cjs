const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, deps = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', 'process', code)(exports, name => deps[name] || require(name), { env: { BLOB_READ_WRITE_TOKEN: 'synthetic' } });
  return exports;
}
const blobs = new Map(); let serial = 0;
const blob = {
  get: async path => { const item = blobs.get(path); return item ? { stream: new Response(item.value).body, blob: { etag: item.etag } } : null; },
  put: async (path, value, options) => {
    const current = blobs.get(path);
    if (options.ifMatch && options.ifMatch !== current?.etag || options.allowOverwrite === false && current) {
      const error = new Error('Precondition failed'); error.name = 'BlobPreconditionFailedError'; throw error;
    }
    blobs.set(path, { value, etag: String(++serial) });
  },
  list: async ({ prefix }) => ({ blobs: [...blobs.keys()].filter(path => path.startsWith(prefix)).map(path => ({ pathname: path })), hasMore: false }),
};
const store = load('lib/concierge.ts', { '@vercel/blob': blob, './dinner-invitation': {} });
const attendance = load('lib/attendance.ts');
const reminders = load('lib/dinner-reminders.ts', { './attendance': attendance, './concierge': store });
const now = Date.now(), hour = 3600000, at = new Date(now).toISOString();
const guest = { applicationId: 'synthetic-guest', token: 'synthetic-private', rsvp: 'yes', attendance: 'unknown', policyAcceptedAt: at };
const table = { id: 'synthetic-table', status: 'invited', activity: 'Dinner', startsAt: new Date(now + 23 * hour).toISOString(), endsAt: new Date(now + 24 * hour).toISOString(), responseDeadline: new Date(now - hour).toISOString(), costDetails: 'Each guest pays separately', venueAddress: 'Synthetic only', sponsorDisclosure: 'None', members: [guest] };
const cancel = { action: 'rsvp', value: 'no', declineReason: 'The time doesn’t work', confirmLateCancellation: true };
const yes = { action: 'rsvp', value: 'yes', policyVersion: attendance.ATTENDANCE_POLICY };
const application = { id: guest.applicationId, fullName: 'Synthetic Guest', email: 'qa@example.invalid' };
(async () => {
  await store.writeRecord(`tables/${table.id}.json`, table);
  await store.writeRecord(`applications/${guest.applicationId}.json`, application);
  const results = await Promise.allSettled([
    store.updateMember(table.id, guest.applicationId, member => attendance.attendanceAction(table, member, cancel, now)),
    store.updateMember(table.id, guest.applicationId, member => attendance.attendanceAction(table, member, yes, now)),
  ]);
  assert.equal(results[0].status, 'fulfilled');
  let live = await store.getTable(table.id), cancelled = live.members[0];
  assert.equal(cancelled.rsvp, 'no', 'Concurrent stale Yes cannot reclaim a cancelled seat');
  assert.equal(cancelled.rsvpHistory.length, 1);
  assert.equal(cancelled.cancellation.at, at);
  const replay = await store.updateMember(table.id, guest.applicationId, member => attendance.attendanceAction(table, member, cancel, now + 1000));
  assert.equal(replay.rsvpHistory.length, 1, 'Cancellation replay is idempotent');
  assert.equal(replay.cancellation.at, at);
  await assert.rejects(store.updateMember(table.id, guest.applicationId, member => attendance.attendanceAction(table, member, yes, now)), /rejoining/);
  const legacy = attendance.attendanceAction(table, { ...guest, policyAcceptedAt: undefined }, { ...cancel, confirmLateCancellation: false }, now);
  assert.equal(legacy.cancellation.penaltyApplicable, false, 'No retroactive consequence without disclosure evidence');
  assert.equal(attendance.attendancePriority(guest.applicationId, [{ ...table, members: [legacy] }], now).lateCancellations, 0);
  const pending = attendance.attendanceAction(table, { ...guest, rsvp: 'pending' }, cancel, now);
  assert.equal(pending.cancellation, undefined, 'Decline before acceptance is not a cancellation');
  const earlier = { ...table, startsAt: new Date(now + 47 * hour).toISOString(), responseDeadline: new Date(now + hour).toISOString() };
  assert.equal(reminders.reminderEligible(earlier, { ...guest, rsvp: 'pending', invitationSentAt: at }, 'unanswered-48h', now), true);
  assert.equal(reminders.reminderEligible(earlier, guest, 'unanswered-48h', now), false);
  assert.equal(reminders.reminderEligible(table, guest, 'confirmed-24h', now), true);
  assert.equal(reminders.reminderEligible(table, cancelled, 'confirmed-24h', now), false);
  assert.equal(reminders.reminderEligible(table, guest, 'unanswered-48h', now), false);
  assert(reminders.reminderDraft(table, guest, application, 'confirmed-24h').text.includes(attendance.cancellationPolicy));
  assert(!reminders.reminderDraft(table, { ...guest, policyAcceptedAt: undefined }, application, 'confirmed-24h').text.includes(attendance.cancellationPolicy));
  await assert.rejects(reminders.releaseUnconfirmedSeat(table.id, guest.applicationId, now), /disclosed deadline/);
  const releasedTable = { ...table, id: 'release-test', members: [{ ...guest, rsvp: 'pending', invitationSentAt: at }], deadlineRelease: { approvedAt: at, disclosedAt: at, text: 'Synthetic approved deadline rule' } };
  await store.writeRecord('tables/release-test.json', releasedTable);
  const released = await reminders.releaseUnconfirmedSeat('release-test', guest.applicationId, now);
  assert.equal(released.rsvp, 'pending', 'Release does not rewrite historical decline state');
  assert.throws(() => attendance.attendanceAction(releasedTable, released, yes, now), /rejoining/);
  let deliveries = 0;
  const job = await reminders.queueReminder(table, guest, 'confirmed-24h');
  assert.equal((await reminders.queueReminder(table, guest, 'confirmed-24h')).id, job.id);
  const draft = reminders.reminderDraft(table, guest, application, job.kind);
  await reminders.approveReminder(job.id, draft.digest, application);
  assert.equal((await reminders.dispatchReminder(job.id, application, async () => { deliveries++; })).status, 'suppressed');
  assert.equal(deliveries, 0, 'Cancellation after approval suppresses sending');
  const activeTable = { ...table, id: 'send-test' };
  await store.writeRecord('tables/send-test.json', activeTable);
  const sendJob = await reminders.queueReminder(activeTable, guest, 'confirmed-24h');
  const sendDraft = reminders.reminderDraft(activeTable, guest, application, sendJob.kind);
  await reminders.approveReminder(sendJob.id, sendDraft.digest, application);
  await Promise.allSettled([reminders.dispatchReminder(sendJob.id, application, async (_, key) => { assert.equal(key, sendJob.id); deliveries++; }), reminders.dispatchReminder(sendJob.id, application, async () => { deliveries++; })]);
  assert.equal(deliveries, 1, 'Competing dispatchers send at most once');
  assert.equal((await reminders.getReminder(sendJob.id)).status, 'sent');
  const uncertain = { ...table, id: 'uncertain-test' };
  await store.writeRecord('tables/uncertain-test.json', uncertain);
  const uncertainJob = await reminders.queueReminder(uncertain, guest, 'confirmed-24h');
  await reminders.approveReminder(uncertainJob.id, reminders.reminderDraft(uncertain, guest, application, uncertainJob.kind).digest, application);
  assert.equal((await reminders.dispatchReminder(uncertainJob.id, application, async () => { throw new Error('Synthetic uncertain delivery'); })).status, 'delivery-unknown');
  await assert.rejects(reminders.dispatchReminder(uncertainJob.id, application, async () => { deliveries++; }), /already been attempted/);
  console.log('PASS: atomic cancellation races/replay, no retroactive penalty, terminal seat release, status-targeted reminders, duplicate suppression and uncertain-send quarantine. Synthetic storage/email only.');
})().catch(error => { console.error(error); process.exitCode = 1; });
