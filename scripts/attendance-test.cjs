const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3107';
function load(file, deps = {}) { const exports = {}; const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText; new Function('exports', 'require', 'process', code)(exports, name => { if (!(name in deps)) throw new Error(name); return deps[name]; }, { env: { BLOB_READ_WRITE_TOKEN: 'mock', INTERACTION_ADMIN_KEY: 'mock' } }); return exports; }
const attendance = load('lib/attendance.ts');
const { attendanceAction, attendancePriority, canCheckIn, ATTENDANCE_POLICY } = attendance;
const now = Date.parse('2026-10-05T20:00:00Z');
const iso = ms => new Date(ms).toISOString();
const hour = 3600000;
const guest = { applicationId: 'guest-a', token: 'test-a', rsvp: 'yes', attendance: 'unknown' };
const table = { id: 'table-a', status: 'invited', startsAt: iso(now + hour), endsAt: iso(now + 3 * hour), venueName: 'Test venue', venueArea: 'Berkeley', venueAddress: 'Test address', activity: 'Dinner', cost: 12, sponsorDisclosure: 'None', members: [guest] };
function unitTests() {
  const cancel = { action: 'rsvp', value: 'no', confirmLateCancellation: true };
  assert.equal(attendanceAction({ ...table, startsAt: iso(now + 24 * hour) }, guest, cancel, now).cancellation.late, false);
  assert.equal(attendanceAction({ ...table, startsAt: iso(now + 24 * hour - 1) }, guest, cancel, now).cancellation.late, true);
  assert.throws(() => attendanceAction(table, guest, { action: 'rsvp', value: 'no' }, now), /confirm/);
  assert.equal(attendanceAction(table, { ...guest, rsvp: 'pending' }, { action: 'rsvp', value: 'no' }, now).cancellation, undefined);
  const cancelled = attendanceAction(table, guest, cancel, now);
  assert.deepEqual(attendanceAction(table, cancelled, cancel, now + 1000), cancelled, 'Duplicate clicks cannot add another cancellation');
  assert.throws(() => attendanceAction(table, cancelled, { action: 'rsvp', value: 'yes', policyVersion: ATTENDANCE_POLICY }, now), /rejoining/);
  assert.equal(attendanceAction(table, { ...guest, rsvp: 'pending' }, { action: 'rsvp', value: 'yes', policyVersion: ATTENDANCE_POLICY }, now).policyAcceptedAt, iso(now));
  assert.throws(() => attendanceAction(table, { ...guest, rsvp: 'pending' }, { action: 'rsvp', value: 'yes' }, now), /policy/);
  assert.equal(canCheckIn(table, now + hour / 2 - 1), false);
  assert.equal(canCheckIn(table, now + hour / 2), true);
  assert.equal(canCheckIn(table, now + 3 * hour + 1), false);
  assert.throws(() => attendanceAction(table, guest, { action: 'check-in' }, now), /opens/);
  assert.throws(() => attendanceAction(table, { ...guest, rsvp: 'no' }, { action: 'check-in' }, now + hour), /opens/);
  const arrived = attendanceAction(table, guest, { action: 'check-in' }, now + hour);
  assert.equal(arrived.attendance, 'attended'); assert.equal(arrived.checkedInAt, iso(now + hour));
  assert.deepEqual(attendanceAction(table, arrived, { action: 'check-in' }, now + hour + 1000), arrived);
  assert.throws(() => attendanceAction(table, arrived, cancel, now + hour), /already checked/);
  assert.throws(() => attendanceAction(table, { ...guest, attendanceReviewedAt: iso(now) }, { action: 'check-in' }, now + hour), /reviewed/);
  assert.equal(attendanceAction({ ...table, status: 'cancelled' }, guest, { action: 'rsvp', value: 'no' }, now).cancellation.late, false);
  assert.equal(attendanceAction(table, cancelled, { action: 'review-cancellation', note: 'Emergency, please review' }, now).cancellation.review.note, 'Emergency, please review');
  const history = [1, 2].map(n => ({ ...table, id: 'past-' + n, status: 'complete', startsAt: iso(now - n * 24 * hour), members: [{ ...cancelled, cancellation: { ...cancelled.cancellation, at: iso(now - n * 24 * hour) } }] }));
  assert.equal(attendancePriority('guest-a', history, now).deprioritized, true);
  assert.equal(attendancePriority('guest-a', history.slice(0, 1), now).deprioritized, false);
  assert.equal(attendancePriority('guest-a', history, now + 89 * 24 * hour).lateCancellations, 0, 'Exact 90-day cutoff expires');
  assert.equal(attendancePriority('guest-a', history.map(t => ({ ...t, status: 'cancelled' })), now).deprioritized, false);
  assert.equal(attendancePriority('guest-a', history.map(t => ({ ...t, members: [{ ...t.members[0], attendance: 'attended' }] })), now).deprioritized, false);
  assert.equal(attendancePriority('guest-a', history.map(t => ({ ...t, members: [{ ...t.members[0], cancellation: { ...t.members[0].cancellation, excusedAt: iso(now) } }] })), now).deprioritized, false);
  const matching = load('lib/matching.ts', { './attendance': attendance, './availability': load('lib/availability.ts') });
  const plan = { activity: 'Dinner', intent: 'Chill / social', format: 'Inclusive / everyone', slot: 'Fri evening', ageBand: '18–22', cost: 12, size: 2, startsAt: '2026-10-10T01:00:00Z' };
  const people = ['guest-a', 'guest-b', 'guest-c'].map(id => ({ id, fullName: id, email: id + '@example.test', birthMonth: 1, birthYear: 2006, agreement: true, baseArea: 'Berkeley', intent: 'Chill / social', tableFormats: ['Inclusive / everyone'], activities: ['Dinner'], budget: 'Under $15', availability: ['Fri evening'], interests: ['Art'], submittedAt: '2026-01-01' }));
  assert.deepEqual(matching.suggestGroups(people, history, plan, new Date(now)).groups[0].memberIds, ['guest-b', 'guest-c']);
  assert.equal(matching.suggestGroups(people.slice(0, 2), history, plan, new Date(now)).groups.length, 1, 'Lower priority is not exclusion');
  return history;
}
async function storageAndApiTests() {
  const blobs = new Map();
  let fail = false;
  const store = load('lib/concierge.ts', { '@vercel/blob': {
    get: async path => blobs.has(path) ? { stream: new Response(blobs.get(path)).body } : null,
    put: async (path, value) => { if (fail) throw new Error('Offline'); blobs.set(path, value); },
    list: async ({ prefix }) => ({ blobs: [...blobs.keys()].filter(key => key.startsWith(prefix)).map(pathname => ({ pathname })), hasMore: false }),
  } });
  const active = { ...table, startsAt: iso(Date.now() - 1000), endsAt: iso(Date.now() + hour), members: [{ ...guest }, { ...guest, applicationId: 'guest-b', token: 'test-b' }] };
  await store.saveTable(active);
  const api = load('app/api/table/[token]/route.ts', { '@/lib/concierge': store, '@/lib/attendance': attendance, '@/lib/sheets': { queueSheetRecord: async () => {} } });
  const admin = load('app/api/admin/table/route.ts', { '@/lib/concierge': store, '@/lib/attendance': attendance, '@/lib/sheets': { queueSheetRecord: async () => {} } });
  const ctx = token => ({ params: Promise.resolve({ token }) });
  const patch = (token, body) => api.PATCH(new Request('https://example.test', { method: 'PATCH', body: JSON.stringify(body) }), ctx(token));
  const results = await Promise.all([patch('test-a', { action: 'check-in' }), patch('test-b', { action: 'rsvp', value: 'no', confirmLateCancellation: true })]);
  assert(results.every(response => response.status === 200));
  const saved = await store.getTable(active.id);
  assert.equal(saved.members[0].attendance, 'attended'); assert.equal(saved.members[1].rsvp, 'no');
  assert(!blobs.get('participation/table-a/guest-a.json').includes('test-a'), 'No secret invitation token in participation record');
  const own = await api.GET(new Request('https://example.test'), ctx('test-a')); const ownText = await own.text();
  assert(!ownText.includes('guest-b') && !ownText.includes('test-b') && !ownText.includes('members'));
  assert.equal(own.headers.get('Cache-Control'), 'private, no-store');
  assert.equal((await patch('bad', { action: 'check-in' })).status, 404);
  assert.equal((await admin.PATCH(new Request('https://example.test', { method: 'PATCH', body: '{}' }))).status, 401);
  const change = body => admin.PATCH(new Request('https://example.test', { method: 'PATCH', headers: { 'x-interaction-admin-key': 'mock' }, body: JSON.stringify({ tableId: 'table-a', applicationId: 'guest-b', ...body }) }));
  assert.equal((await change({ action: 'attendance', value: 'no-show' })).status, 409);
  assert.equal((await change({ action: 'excuse-cancellation', note: 'Emergency reviewed' })).status, 200);
  assert.equal((await store.getTable('table-a')).members[1].cancellation.excuseNote, 'Emergency reviewed');
  assert.equal((await change({ action: 'attendance', value: 'attended' })).status, 200);
  assert.equal((await store.getTable('table-a')).members[1].attendance, 'attended');
  fail = true; assert.equal((await patch('test-b', { action: 'review-cancellation', note: 'Test' })).status, 503);
  console.log('PASS policy/API/storage: exact boundaries, repeat calls, acceptance notice, declines, check-in windows, private counts, aging, exceptions, real ranking, concurrent guests, host corrections, failed save. All storage mocked.');
}
async function uiTests() {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
    try {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      let member = { ...guest }, currentTable = { ...table, startsAt: iso(Date.now() + 10 * 60000), endsAt: iso(Date.now() + hour) }, calls = [];
      await page.route('**/api/table/attendance-test', async route => {
        if (route.request().method() === 'PATCH') { const body = route.request().postDataJSON(); calls.push(body); member = attendanceAction(currentTable, member, body); }
        await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, table: currentTable, member, priority: { lateCancellations: member.cancellation?.late ? 1 : 0, deprioritized: false, priorityRestoresAt: null } }) });
      });
      await page.goto(base + '/table/attendance-test');
      await page.getByRole('button', { name: 'I’m here — check me in', exact: true }).click();
      await page.getByRole('heading', { name: 'You’re checked in.' }).waitFor();
      assert.equal(calls[0].action, 'check-in');
      await page.reload(); await page.getByRole('heading', { name: 'You’re checked in.' }).waitFor();
      member = { ...guest }; calls = [];
      await page.reload();
      await page.getByRole('button', { name: 'Plans changed? Cancel my RSVP' }).click();
      assert.equal(calls.length, 0, 'Cancellation has a separate confirmation');
      assert(await page.getByText('This will count as a late cancellation', { exact: false }).isVisible());
      await page.getByRole('button', { name: 'Keep my RSVP', exact: true }).click(); assert.equal(calls.length, 0);
      await page.getByRole('button', { name: 'Plans changed? Cancel my RSVP' }).click();
      await page.getByRole('button', { name: 'Confirm cancellation', exact: true }).click();
      await page.getByRole('heading', { name: 'Your RSVP is cancelled.' }).waitFor();
      assert.equal(calls[0].confirmLateCancellation, true);
      await page.locator('summary').filter({ hasText: 'Emergency or mistake?' }).click();
      await page.getByRole('textbox', { name: 'What should the organizer review? No sensitive details needed.' }).fill('Emergency, please review');
      await page.getByRole('button', { name: 'Request review' }).click();
      await page.getByText('Your review request is saved for the organizer.', { exact: false }).waitFor();
      assert.equal(calls[1].action, 'review-cancellation');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `.review-artifacts/attendance-${engine === chromium ? 'chrome' : 'webkit'}.png`, fullPage: true });
      member = { ...guest, rsvp: 'pending' }; calls = [];
      await page.reload();
      await page.getByRole('button', { name: 'Yes, I’ll be there ↗' }).click();
      await page.getByRole('heading', { name: 'See you there.' }).waitFor();
      assert.equal(calls[0].policyVersion, ATTENDANCE_POLICY);
    } finally { await browser.close(); }
  }
  console.log('PASS UI: Chrome/WebKit mobile arrival, reload, warning, keep/cancel, review, policy acceptance, no overflow. All requests intercepted.');
}
(async () => { unitTests(); await storageAndApiTests(); await uiTests(); })().catch(error => { console.error(error); process.exit(1); });
