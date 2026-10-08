const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3107';
function load(file, deps = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('exports', 'require', code)(exports, name => { if (!(name in deps)) throw new Error(`Unexpected dependency ${name}`); return deps[name]; });
  return exports;
}
const surveyModule = load('lib/event-surveys.ts');

async function testApi() {
  const records = new Map();
  let failWrites = false;
  const table = { id: 'table-a', status: 'invited', activity: 'Dinner', venueName: 'Test venue', startsAt: '2020-01-01T18:00:00Z', endsAt: '2020-01-01T20:00:00Z', members: [{ applicationId: 'guest-a', token: 'test-a' }, { applicationId: 'guest-b', token: 'test-b' }] };
  const store = {
    findTableByToken: async token => { const memberIndex = table.members.findIndex(member => member.token === token); return memberIndex < 0 ? null : { table, memberIndex }; },
    writeRecord: async (path, value) => { if (failWrites) throw new Error('offline'); records.set(path, value); },
    readJson: async path => records.get(path) || null,
    readPrefix: async () => [...records.values()],
    requireAdmin: request => request.headers.get('x-interaction-admin-key') === 'test-only',
  };
  const api = load('app/api/table/[token]/survey/route.ts', { '@/lib/concierge': store, '@/lib/event-surveys': surveyModule });
  const admin = load('app/api/admin/surveys/route.ts', { '@/lib/concierge': store });
  const ctx = token => ({ params: Promise.resolve({ token }) });
  const post = (body, token = 'test-a') => api.POST(new Request('https://example.test', { method: 'POST', body: JSON.stringify(body) }), ctx(token));
  const get = token => api.GET(new Request('https://example.test'), ctx(token));
  assert.equal((await get('invalid')).status, 404);
  assert.equal((await post({ kind: 'after' })).status, 400);
  assert.equal((await post({ kind: 'after', experience: 'Loved it', meetAgain: 'wat' })).status, 400);
  assert.equal((await post({ kind: 'after', experience: 'Loved it', note: 'x'.repeat(2001) })).status, 400);
  assert.equal((await post({ kind: 'after', experience: 'Loved it', followUp: 'yes' })).status, 400);
  assert.equal((await post({ kind: 'after', experience: 'Loved it', questionAnswers: { groupFit: 'Made up' } })).status, 400);
  assert.equal((await post({ kind: 'after', experience: 'Loved it', questionAnswers: [] })).status, 400);
  assert.equal((await post({ kind: 'after', experience: 'Loved it', questionAnswers: { groupConfidence: 'Confident' } })).status, 400, 'Before-only answers do not leak into after records');
  assert.equal((await post({ kind: 'after', experience: 'I didn’t attend', questionAnswers: { groupFit: 'Good fit' } })).status, 400, 'Non-attendees do not rate the group');
  assert.equal((await api.POST(new Request('https://example.test', { method: 'POST', body: '{bad' }), ctx('test-a'))).status, 400);
  assert.equal((await post({ kind: 'before', hopes: ['Meet new friends'] })).status, 409);
  assert.equal((await post({ kind: 'after', experience: 'Loved it', applicationId: 'guest-b', tableId: 'another-table' })).status, 200);
  assert.equal(records.get('surveys/table-a/guest-a/after.json').experience, 'Loved it');
  await Promise.all([post({ kind: 'after', experience: 'It was okay' }), post({ kind: 'after', experience: 'Not for me' }, 'test-b')]);
  assert.equal(records.get('surveys/table-a/guest-a/after.json').experience, 'It was okay');
  assert.equal(records.get('surveys/table-a/guest-b/after.json').experience, 'Not for me');
  await post({ kind: 'after', experience: 'Not for me', questionAnswers: { feeling: 'Mixed feelings', groupFit: 'Partly', conversation: 'Took a little time', planAccuracy: 'Mostly' } }, 'test-b');
  assert.equal((await (await get('test-b')).json()).after.questionAnswers.feeling, 'Mixed feelings');
  await post({ kind: 'after', experience: 'I didn’t attend', meetAgain: 'Yes', connection: 'We met again independently' });
  assert.equal(records.get('surveys/table-a/guest-a/after.json').meetAgain, undefined);
  assert.equal(records.get('surveys/table-a/guest-a/after.json').connection, undefined);
  assert.equal((await post({ kind: 'concern', note: ' ' })).status, 400);
  await post({ kind: 'concern', note: 'Private report one' });
  await post({ kind: 'concern', note: 'Private report two', followUp: true });
  assert.equal([...records.values()].filter(value => value.kind === 'concern').length, 2, 'Reports never overwrite each other');
  const own = await get('test-b');
  assert.equal(own.headers.get('Cache-Control'), 'private, no-store');
  const ownBody = await own.text();
  assert(!ownBody.includes('guest-a') && !ownBody.includes('Private report') && !ownBody.includes('I didn’t attend'));
  assert(ownBody.includes('Not for me'));
  assert.equal((await admin.GET(new Request('https://example.test'))).status, 401);
  const inbox = await admin.GET(new Request('https://example.test', { headers: { 'x-interaction-admin-key': 'test-only' } }));
  assert.equal((await inbox.json()).surveys.length, 4);
  table.startsAt = '2090-01-01T18:00:00Z'; table.endsAt = '2090-01-01T20:00:00Z';
  assert.equal((await post({ kind: 'after', experience: 'Loved it' })).status, 409);
  assert.equal((await post({ kind: 'before', hopes: [], note: '' })).status, 400);
  assert.equal((await post({ kind: 'before', hopes: ['Made up'] })).status, 400);
  assert.equal((await post({ kind: 'before', hopes: ['Meet new friends'], note: '' })).status, 200);
  const beforeAnswers = { feeling: 'Excited and nervous', planFit: 'Not enough information yet', groupConfidence: 'I haven’t been told enough about the group', clarity: 'Something is unclear' };
  assert.equal((await post({ kind: 'before', questionAnswers: beforeAnswers })).status, 200, 'Specific answers alone are enough; hopes and notes optional');
  assert.deepEqual((await (await get('test-a')).json()).before.questionAnswers, beforeAnswers);
  await post({ kind: 'concern', note: 'A specific account', questionAnswers: { concernArea: 'Venue or accessibility' } });
  assert([...records.values()].some(record => record.questionAnswers?.concernArea === 'Venue or accessibility'));
  table.status = 'cancelled';
  assert.equal((await post({ kind: 'before', hopes: ['Meet new friends'] })).status, 409);
  assert.equal((await post({ kind: 'concern', note: 'Still able to report', followUp: false })).status, 200);
  failWrites = true;
  assert.equal((await post({ kind: 'concern', note: 'Not saved' })).status, 503);
  assert.equal(surveyModule.surveyWindow({ status: 'invited', startsAt: '2026-01-01T18:00:00Z' }, Date.parse('2026-01-01T20:59:00Z')).after, false);
  assert.equal(surveyModule.surveyWindow({ status: 'invited', startsAt: '2026-01-01T18:00:00Z' }, Date.parse('2026-01-01T21:00:00Z')).after, true);
  console.log('PASS API: validation, timing, guest isolation, per-person writes, immutable reports, private cache, organizer auth, storage failure. All storage mocked.');
}

async function testUi() {
  fs.mkdirSync('.review-artifacts', { recursive: true });
  for (const engine of ['chromium', 'webkit']) {
    const browser = await (engine === 'chromium' ? chromium.launch({ channel: 'chrome' }) : webkit.launch());
    try {
      for (const [width, theme] of [[320, 'light'], [820, 'dark']]) {
        const context = await browser.newContext({ viewport: { width, height: 1100 }, colorScheme: theme, reducedMotion: 'reduce' });
        const page = await context.newPage();
        let available = { before: false, after: true }, storedAfter = null, storedBefore = null, saves = [], fail = false;
        await page.route('**/api/table/survey-test/survey', async route => {
          if (route.request().method() === 'POST') {
            const payload = route.request().postDataJSON();
            if (fail) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Your response wasn’t saved. Please try again.' }) });
            saves.push(payload);
            const record = { ...payload, submittedAt: '2026-10-05T20:00:00Z' };
            if (payload.kind === 'after') storedAfter = record;
            if (payload.kind === 'before') storedBefore = record;
            return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, submittedAt: record.submittedAt }) });
          }
          return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ table: { activity: 'Dinner', venueName: 'Test venue', startsAt: '2026-10-04T20:00:00Z' }, available, before: storedBefore, after: storedAfter }) });
        });
        await page.goto(`${base}/table/survey-test/feedback`);
        await page.getByRole('heading', { name: 'Give us the real version.' }).waitFor();
        assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
        await page.getByRole('button', { name: 'Send my answer', exact: true }).click();
        assert.equal(saves.length, 0, 'Verdict required');
        await page.getByRole('radio', { name: 'Loved it', exact: true }).check();
        await page.getByRole('button', { name: 'Send my answer', exact: true }).click();
        await page.getByRole('heading', { name: 'Thanks for being honest.' }).waitFor();
        assert.equal(saves[0].note, ''); assert.equal(saves[0].followUp, false); assert.equal(saves[0].meetAgain, undefined);
        await page.reload();
        await page.getByRole('button', { name: 'Update my answers', exact: true }).waitFor();
        assert(await page.getByRole('radio', { name: 'Loved it', exact: true }).isChecked());
        await page.locator('summary').filter({ hasText: 'Add a little more' }).click();
        await page.getByRole('button', { name: 'Mixed feelings', exact: true }).click();
        await page.getByRole('button', { name: 'Partly', exact: true }).click();
        await page.getByRole('button', { name: 'Took a little time', exact: true }).click();
        await page.getByRole('button', { name: 'Something important was different', exact: true }).click();
        await page.getByRole('button', { name: 'We met again independently', exact: true }).click();
        await page.getByRole('button', { name: 'Update my answers', exact: true }).click();
        await page.getByRole('heading', { name: 'Thanks for being honest.' }).waitFor();
        assert.equal(saves.at(-1).connection, 'We met again independently');
        assert.equal(saves.at(-1).questionAnswers.groupFit, 'Partly');
        assert.equal(saves.at(-1).questionAnswers.feeling, 'Mixed feelings');
        await page.getByRole('button', { name: 'Edit my answers', exact: true }).click();
        await page.getByRole('radio', { name: 'I didn’t attend', exact: true }).check();
        assert.equal(await page.getByRole('button', { name: 'We met again independently' }).count(), 0);
        await page.locator('summary').filter({ hasText: 'Add a little more' }).click();
        await page.getByRole('button', { name: 'Schedule changed', exact: true }).click();
        assert.equal(await page.getByRole('button', { name: 'Good fit', exact: true }).count(), 0);
        await page.getByRole('button', { name: 'Update my answers', exact: true }).click();
        await page.getByRole('heading', { name: 'Thanks for being honest.' }).waitFor();
        assert.equal(saves.at(-1).connection, undefined);
        assert.deepEqual(saves.at(-1).questionAnswers, { absenceReason: 'Schedule changed' });
        await page.getByRole('button', { name: 'Share a concern', exact: true }).click();
        await page.getByRole('button', { name: 'Send privately', exact: true }).click();
        assert.equal(saves.length, 3, 'Concern needs a note');
        await page.getByRole('textbox', { name: 'What happened?' }).fill('Test-only private concern');
        await page.getByRole('button', { name: 'Privacy or unwanted contact', exact: true }).click();
        fail = true;
        await page.getByRole('button', { name: 'Send privately', exact: true }).click();
        await page.getByRole('alert').waitFor();
        assert.equal(await page.getByRole('heading', { name: 'Your report is saved.' }).count(), 0);
        assert.equal(await page.getByRole('textbox').inputValue(), 'Test-only private concern');
        fail = false;
        await page.getByRole('button', { name: 'Send privately', exact: true }).click();
        await page.getByRole('heading', { name: 'Your report is saved.' }).waitFor();
        assert.equal(saves.at(-1).followUp, false, 'Follow-up is not required');
        assert.equal(saves.at(-1).questionAnswers.concernArea, 'Privacy or unwanted contact');
        available = { before: true, after: false };
        await page.goto(`${base}/table/survey-test/feedback`);
        await page.getByRole('heading', { name: 'Before you go.' }).waitFor();
        assert(await page.getByRole('link', { name: 'Skip this · back to my invitation' }).isVisible());
        await page.getByRole('button', { name: 'Excited and nervous', exact: true }).click();
        await page.getByRole('button', { name: 'Not enough information yet', exact: true }).click();
        await page.getByRole('button', { name: 'I haven’t been told enough about the group', exact: true }).click();
        await page.getByRole('button', { name: 'Something is unclear', exact: true }).click();
        await page.screenshot({ path: `.review-artifacts/survey-before-${engine}-${width}-${theme}.png`, fullPage: true });
        await page.getByRole('button', { name: 'Have a good conversation', exact: true }).click();
        await page.getByRole('button', { name: 'Send my answer', exact: true }).click();
        await page.getByRole('heading', { name: 'Thanks for being honest.' }).waitFor();
        assert.deepEqual(saves.at(-1).hopes, ['Have a good conversation']);
        assert.equal(saves.at(-1).questionAnswers.feeling, 'Excited and nervous');
        await page.reload();
        await page.getByRole('button', { name: 'Update my answers' }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Excited and nervous', exact: true }).getAttribute('aria-pressed'), 'true');
        await page.goto(`${base}/table/survey-test/feedback?view=concern`);
        await page.getByRole('heading', { name: 'We’re listening.' }).waitFor();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.screenshot({ path: `.review-artifacts/survey-${engine}-${width}-${theme}.png`, fullPage: true });
        available = { before: false, after: true }; storedAfter = null;
        await page.goto(`${base}/table/survey-test/feedback`);
        await page.getByRole('heading', { name: 'Give us the real version.' }).waitFor();
        await page.getByRole('radio', { name: 'I had a bad experience', exact: true }).check();
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.screenshot({ path: `.review-artifacts/survey-after-${engine}-${width}-${theme}.png`, fullPage: true });
        await context.close();
      }
      const adminPage = await browser.newPage();
      await adminPage.route('**/api/admin', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ applications: [{ id: 'guest-a', fullName: 'Test Guest' }], tables: [{ id: 'table-a', activity: 'Dinner', venueName: 'Test venue', startsAt: '2020-01-01T20:00:00Z', members: [{ applicationId: 'guest-a', token: 'survey-test', rsvp: 'yes' }] }], sheetsConfigured: true }) }));
      await adminPage.route('**/api/admin/surveys', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ surveys: [{ id: 'after-a', tableId: 'table-a', applicationId: 'guest-a', kind: 'after', experience: 'Loved it', meetAgain: 'Yes', connection: 'Not yet', note: 'Test note', followUp: false, submittedAt: '2026-10-05T20:00:00Z' }, { id: 'concern-a', tableId: 'table-a', applicationId: 'guest-a', kind: 'concern', note: 'Private test concern', followUp: false, submittedAt: '2026-10-05T20:00:00Z' }] }) }));
      await adminPage.goto(`${base}/admin`);
      await adminPage.getByLabel('Organizer key').fill('test-only');
      await adminPage.getByRole('button', { name: 'Open inbox' }).click();
      await adminPage.getByRole('heading', { name: 'Private concerns (1)' }).waitFor();
      assert(await adminPage.getByText('1 of 1 invited people responded after the event.', { exact: false }).isVisible());
      assert((await adminPage.locator('p').filter({ hasText: 'Connection, separately:' }).innerText()).includes('0/1 who answered report an independent second hangout'));
      assert.equal(await adminPage.getByRole('link', { name: 'Private check-in / feedback link ↗' }).getAttribute('href'), '/table/survey-test/feedback');
      await adminPage.locator('summary').filter({ hasText: 'Concern' }).click();
      assert(await adminPage.getByText('Private test concern', { exact: true }).isVisible());
      await adminPage.close();
    } finally { await browser.close(); }
  }
  console.log('PASS UI: Chrome/WebKit, phone/iPad, light/dark, minimum response, optional fields, reload/edit, later hangout, did-not-attend, private report, failure/retry, before/skip, direct link, no overflow. All writes intercepted.');
}
(async () => { await testApi(); await testUi(); })().catch(error => { console.error(error); process.exit(1); });
