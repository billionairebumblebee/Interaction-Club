const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3107';

async function testStorage() {
  let saved, queued;
  const published = [];
  const tagExports = {};
  const availabilityExports = {};
  new Function('exports', ts.transpileModule(fs.readFileSync('lib/availability.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(availabilityExports);
  new Function('exports', ts.transpileModule(fs.readFileSync('lib/interest-tags.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(tagExports);
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('app/api/applications/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mockRequire = name => {
    if (name === '@vercel/blob') return { put: async (_, value) => { saved = JSON.parse(value); } };
    if (name === '@/lib/sheets') return { queueSheetRecord: async job => { queued = job.record; } };
    if (name === '@/lib/matching') return { eveningIntents: ['Builder / founder', 'Chill / social', 'Open to either'] };
    if (name === '@/lib/dress-code') return { dressCodeOptions: ['Come as you are', 'Put together', 'Theme-ready', 'Furries', 'Cosplay', 'LARP', 'Tech bro'] };
    if (name === '@/lib/interest-tags') return tagExports;
    if (name === '@/lib/availability') return availabilityExports;
    if (name === '@/lib/interest-catalog') return { publishInterestTags: async tags => { published.push(tags); } };
    if (name === '@/lib/referrals') return { resolveInviter: async () => null };
    if (name.startsWith('@/lib/')) {
      const dependency = {};
      new Function('exports', ts.transpileModule(fs.readFileSync(`lib/${name.slice(6)}.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(dependency);
      return dependency;
    }
    throw Error(`Unexpected dependency ${name}`);
  };
  new Function('exports', 'require', 'process', code)(exports, mockRequire, { env: { BLOB_READ_WRITE_TOKEN: 'test-stub-only' } });
  const payload = { fullName: 'Test Guest', email: 'test@example.test', birthMonth: 1, birthYear: 2000, baseArea: 'Berkeley', activities: ['Dinner'], budget: 'Under $15', availability: ['Sat evening'], tableFormats: ['Inclusive / everyone'], intent: 'Chill / social', ageConfirmed: true, agreement: true };
  for (const blurb of ['', 'I study engineering and spend weekends cooking with friends.\nI would love to meet people who enjoy art and long conversations.', 'A'.repeat(1100)]) {
    const response = await exports.POST(new Request('http://test/api/applications', { method: 'POST', body: JSON.stringify({ ...payload, discipline: blurb }) }));
    assert.equal(response.status, 201);
    assert.equal(saved.discipline, blurb.slice(0, 1000), 'Save the full blurb up to 1,000 characters');
    assert.equal(queued.discipline, saved.discipline, 'The Sheet receives the same complete blurb');
  }
  for (const gender of ['Genderfluid — my own words, not a preset category', '', 'Nonbinary']) {
    const response = await exports.POST(new Request('http://test/api/applications', { method: 'POST', body: JSON.stringify({ ...payload, gender }) }));
    assert.equal(response.status, 201, await response.text());
    assert.equal(saved.gender, gender || null);
    assert.equal(queued.gender, gender || null);
  }
  for (const dressCase of [
    { input: { dressCodes: ['Come as you are', 'Put together', 'Theme-ready', 'Furries', 'Cosplay', 'LARP', 'Tech bro'] }, expected: ['Come as you are', 'Put together', 'Theme-ready', 'Furries', 'Cosplay', 'LARP', 'Tech bro'] },
    { input: { dressCodes: ['Cosplay', 'Cosplay', 'unknown', 12] }, expected: ['Cosplay'] },
    { input: { dressCodes: [] }, expected: [] },
    { input: { vibe: 'Put together' }, expected: ['Put together'] },
  ]) {
    const response = await exports.POST(new Request('http://test/api/applications', { method: 'POST', body: JSON.stringify({ ...payload, ...dressCase.input }) }));
    assert.equal(response.status, 201, await response.text());
    assert.deepEqual(saved.dressCodes, dressCase.expected);
    assert.equal(saved.vibe, dressCase.expected.join(', ') || null);
    assert.deepEqual(queued.dressCodes, dressCase.expected);
    assert.equal(queued.vibe, saved.vibe);
  }
  for (const gender of ['', 'Woman', 'Man', 'Nonbinary', 'My own description']) {
    for (const tableFormats of [['Men only'], ['Women only'], ['50/50 men + women'], ['Men only', 'Women only', 'Inclusive / everyone']]) {
      const response = await exports.POST(new Request('http://test/api/applications', { method: 'POST', body: JSON.stringify({ ...payload, gender, tableFormats }) }));
      assert.equal(response.status, 201, 'Save preferences without gender-specific signup rejection');
      assert.equal(saved.gender, gender || null, 'Never rewrite a person’s identity');
      assert.deepEqual(saved.tableFormats, tableFormats, 'Preserve selected preferences for organizer review');
      assert.deepEqual(queued.tableFormats, tableFormats);
    }
  }
  const invalid = await exports.POST(new Request('http://test/api/applications', { method: 'POST', body: JSON.stringify({ ...payload, tableFormats: [] }) }));
  for (const input of [availabilityExports.availabilitySlots, ['Mon breakfast'], ['Fri evening', 'Fri dinner', 'invalid']]) {
    const response = await exports.POST(new Request('http://test/api/applications', { method: 'POST', body: JSON.stringify({ ...payload, availability: input }) }));
    assert.equal(response.status, 201);
    assert.deepEqual(saved.availability, availabilityExports.cleanAvailability(input));
    assert.deepEqual(queued.availability, saved.availability);
  }
  for (const availability of [[], ['invalid']]) {
    const response = await exports.POST(new Request('http://test/api/applications', { method: 'POST', body: JSON.stringify({ ...payload, availability }) }));
    assert.equal(response.status, 400);
  }
  assert.equal(invalid.status, 400, 'At least one table preference is still required');
  assert.equal(published.length, 0, 'Legacy forms never publish private interests');
  const withTags = await exports.POST(new Request('http://test/api/applications', { method: 'POST', body: JSON.stringify({ ...payload, shareInterestTags: true, interests: [' ai agents ', 'AI AGENTS', 'Pottery', 'test@example.com'] }) }));
  assert.equal(withTags.status, 201);
  assert.deepEqual(saved.interests, ['AI agents', 'Pottery']);
  assert.deepEqual(queued.interests, saved.interests);
  assert.deepEqual(published, [['AI agents', 'Pottery']], 'Only normalized tag labels reach the catalog after a successful signup');
  const source = fs.readFileSync('app/join/page.tsx', 'utf8');
  assert(!source.includes('genderedTableProblem'), 'No gender-specific signup blocker');
  assert(!source.includes('tables are for people who identify'), 'No gender-specific warning copy');
}

(async () => {
  await testStorage();
  if (process.env.STORAGE_ONLY === '1') {
    console.log('PASS: gender/table preference combinations saved unchanged; required fields preserved. All writes mocked.');
    return;
  }
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const cases = [
      { choice: 'Prefer to self-describe', words: 'Genderfluid — my own words, not a preset category', expected: 'Genderfluid — my own words, not a preset category' },
      { choice: 'Prefer to self-describe', words: '', expected: '' },
      { choice: 'Prefer not to say', expected: '' },
      { choice: '', expected: '' },
      { choice: 'Nonbinary', expected: 'Nonbinary' },
      { choice: 'Woman', expected: 'Woman', format: 'Women only' },
      { choice: 'Man', expected: 'Man', format: 'Men only' },
    ];
    for (const [index, test] of cases.entries()) {
      const width = index % 2 ? 820 : 320;
      const context = await browser.newContext({ viewport: { width, height: 1100 }, colorScheme: index % 2 ? 'dark' : 'light', reducedMotion: 'reduce' });
      const page = await context.newPage();
      let payload;
      // No test submissions ever reach the actual inbox.
      await page.route('**/api/applications', route => {
        payload = route.request().postDataJSON();
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'test-only' }) });
      });
      await page.goto(`${base}/join`);
      await page.evaluate(() => document.fonts.ready);
      assert.deepEqual(await page.locator('.stepper b').allTextContents(), ['1', '2', '3', '4', '5'], 'Step numbers never have leading zeros');
      for (const number of await page.locator('.stepper b').all()) {
        const type = await number.evaluate(el => ({ family: getComputedStyle(el).fontFamily, size: parseFloat(getComputedStyle(el).fontSize) }));
        assert(/dynapuff/i.test(type.family), 'Progress numbers use the rounded club typeface');
        assert(type.size >= 16, 'Progress numbers stay legible');
      }
      await page.getByLabel('Your full name').fill('Test Guest');
      await page.getByLabel('Your email', { exact: true }).fill('test@example.test');
      await page.getByLabel('Where are you based right now?').selectOption('Berkeley');
      await page.getByLabel('Birth month').selectOption('1');
      await page.getByLabel('Birth year').selectOption('2000');
      await page.getByLabel('I confirm that I am 18 or older.').check();
      await page.getByRole('button', { name: 'continue' }).click();
      assert.equal(await page.locator('.selection-hint').count(), 3);
      for (const hint of await page.locator('.selection-hint').all()) {
        assert.equal(await hint.innerText(), 'please select all');
        const css = await hint.evaluate(el => ({ background: getComputedStyle(el).backgroundColor, border: getComputedStyle(el).borderWidth, padding: getComputedStyle(el).padding }));
        assert.equal(css.background, 'rgba(0, 0, 0, 0)');
        assert.equal(css.border, '0px');
        assert.equal(css.padding, '0px');
      }
      await page.getByRole('button', { name: 'Chill / social', exact: true }).click();
      await page.getByRole('button', { name: 'Dinner', exact: true }).click();
      await page.getByRole('button', { name: /Under \$15/ }).click();
      await page.getByRole('button', { name: 'Saturday dinner, 5–9 PM', exact: true }).click();
      for (const amount of await page.locator('.budget-options b').all()) {
        assert(/dynapuff/i.test(await amount.evaluate(el => getComputedStyle(el).fontFamily)), 'Budget numbers use the rounded club typeface');
      }
      if (index < 2) await page.locator('.join').screenshot({ path: `.review-artifacts/rounded-numbers-${width}.png` });
      await page.getByRole('button', { name: test.format || 'Inclusive / everyone', exact: true }).click();
      if (index === 0) {
        await page.getByRole('button', { name: '50/50 men + women', exact: true }).click();
        await page.getByRole('button', { name: 'continue' }).click();
        assert.equal(await page.locator('.form-error').count(), 0, 'No gender-specific signup warning');
        await page.getByRole('button', { name: 'back', exact: true }).click();
        await page.getByRole('button', { name: '50/50 men + women', exact: true }).click();
      }
      await page.locator('#gender').selectOption(test.choice);
      if (test.words !== undefined) await page.locator('#gender-description').fill(test.words);
      else assert.equal(await page.locator('#gender-description').count(), 0);
      if (index < 2) await page.locator('.step-content').screenshot({ path: `.review-artifacts/inclusive-form-${width}.png` });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.getByRole('button', { name: 'continue' }).click();
      await page.getByRole('button', { name: 'back', exact: true }).click();
      assert.equal(await page.locator('#gender').inputValue(), test.choice);
      if (test.words !== undefined) assert.equal(await page.locator('#gender-description').inputValue(), test.words);
      for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'continue' }).click();
      const blurb = page.getByRole('textbox', { name: 'Write a blurb about yourself', exact: true });
      const startingHeight = await blurb.evaluate(el => el.getBoundingClientRect().height);
      assert(startingHeight >= 160, 'Blurb starts as a roomy multiline field');
      const aboutYou = index === 0 ? Array.from({ length: 20 }, (_, i) => `A little about me, line ${i + 1}.`).join('\n') : '';
      await blurb.fill(aboutYou);
      if (aboutYou) {
        const grownHeight = await blurb.evaluate(el => el.getBoundingClientRect().height);
        assert(grownHeight > startingHeight, 'Blurb expands as the person writes');
        await page.getByRole('button', { name: 'back', exact: true }).click();
        await page.getByRole('button', { name: 'continue' }).click();
        assert.equal(await blurb.inputValue(), aboutYou, 'Blurb survives back navigation');
        assert((await blurb.evaluate(el => el.getBoundingClientRect().height)) > startingHeight, 'Restored blurb expands again');
      }
      const dressField = page.getByRole('group', { name: 'Dress code' });
      assert.equal(await dressField.getByRole('button').count(), 7);
      assert.equal(await page.getByRole('button', { name: 'add', exact: true }).evaluate(el => getComputedStyle(el).color), 'rgb(48, 73, 223)', 'Add text is blue in both themes');
      const selectedDressCodes = index === 0 ? ['Furries', 'Cosplay', 'LARP', 'Tech bro'] : [];
      for (const name of selectedDressCodes) await dressField.getByRole('button', { name, exact: true }).click();
      if (index === 0) {
        await dressField.getByRole('button', { name: 'Come as you are', exact: true }).click();
        await dressField.getByRole('button', { name: 'Come as you are', exact: true }).click();
        assert.equal(await dressField.getByRole('button', { name: 'Come as you are', exact: true }).getAttribute('aria-pressed'), 'false');
        await page.getByRole('button', { name: 'back', exact: true }).click();
        await page.getByRole('button', { name: 'continue' }).click();
        for (const name of selectedDressCodes) assert.equal(await dressField.getByRole('button', { name, exact: true }).getAttribute('aria-pressed'), 'true');
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (index < 2) await page.locator('.step-content').screenshot({ path: `.review-artifacts/dress-code-${width}.png` });
      await page.getByRole('button', { name: 'continue' }).click();
      await page.getByLabel('I plan to show up—or cancel as early as I can.').check();
      await page.getByRole('button', { name: 'join Interaction' }).click();
      await page.getByRole('heading', { name: 'You’re in!' }).waitFor();
      assert.equal(payload.gender, test.expected);
      assert.equal(payload.discipline, aboutYou);
      assert.deepEqual(payload.dressCodes, selectedDressCodes);
      assert(!('genderDescription' in payload), 'Do not submit stale hidden answers');
      await context.close();
    }
  } finally { await browser.close(); }
  console.log('PASS: plain selection hints, optional self-description/opt-out, back navigation, matching validation, exact storage and Sheet payload. All writes mocked.');
})().catch(error => { console.error(error); process.exit(1); });
