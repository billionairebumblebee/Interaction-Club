const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3107';
const moduleCode = ts.transpileModule(fs.readFileSync('lib/brand.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
new Function('exports', moduleCode)(exportsObject);
const { MAIN_MOTTO, eventMotto } = exportsObject;
assert.equal(MAIN_MOTTO, 'We want you at our table.');
for (const activity of ['Dinner', 'brunch', 'Group lunch']) assert.equal(eventMotto(activity), MAIN_MOTTO);
for (const activity of ['Party', 'Birthday party', 'after-party']) assert.equal(eventMotto(activity), 'We want you at our party.');
assert.equal(eventMotto('Build together'), 'We want you at our event.');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    for (const theme of ['light', 'dark']) for (const width of [320, 390, 820, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1100 }, reducedMotion: 'reduce' });
      await context.addInitScript(theme => {
        localStorage.setItem('interaction.appearance', theme);
        sessionStorage.setItem('interaction.invitation.visited', '1');
        sessionStorage.setItem('interaction.invitation.engaged', '1');
        sessionStorage.setItem('interaction.invitation.name', 'Vivian');
      }, theme);
      const page = await context.newPage();
      await page.goto(base);
      await page.waitForFunction(() => document.querySelector('.ic-foil-heading img')?.complete);
      assert.equal(await page.locator('h1').innerText(), MAIN_MOTTO);
      assert(!(await page.locator('body').innerText()).includes('Pull up if I pull up.'));
      assert.equal(await page.locator('meta[property="og:description"]').getAttribute('content'), MAIN_MOTTO);
      for (const selector of ['.ic-foil-heading', '.ic-nav .ic-balloon-wordmark', '.ic-footer .ic-balloon-wordmark']) {
        assert.equal(await page.locator(selector).evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)', `${selector}: no rectangular background`);
      }
      assert((await page.locator('.ic-foil-heading img').evaluate(el => getComputedStyle(el).filter)).includes('ic-balloon-cutout'));
      assert.equal(await page.locator('#ic-balloon-cutout feGaussianBlur').count(), 1);
      assert.equal(await page.locator('#ic-balloon-cutout feFuncA[type="discrete"]').count(), 0);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `.review-artifacts/cutout-${theme}-${width}.png` });
      await page.locator('.ic-footer').screenshot({ path: `.review-artifacts/cutout-footer-${theme}-${width}.png` });
      await context.close();
    }
    const page = await browser.newPage();
    // Mock invitations only. No real attendee data or RSVP writes.
    for (const activity of ['Dinner', 'Birthday party', 'Build together']) {
      await page.route('**/api/table/brand-test', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ table: { activity, venueName: 'Test venue', venueArea: 'Berkeley', startsAt: '2030-01-10T18:00:00Z', status: 'draft' }, member: { rsvp: 'pending', attendance: 'unknown' } }) }));
      await page.goto(`${base}/table/brand-test`);
      assert.equal(await page.locator('.envelope-cover b').innerText(), eventMotto(activity));
      await page.locator('.envelope-cover').click();
      assert.equal(await page.locator('.exp-letter h3').innerText(), eventMotto(activity));
      assert.equal(await page.locator('.exp-footer>span').innerText(), eventMotto(activity));
      await page.unroute('**/api/table/brand-test');
    }
    console.log('PASS: alpha-shaped white outlines, no white boxes, light/dark responsive layouts, new motto and share metadata, actual invitation wording follows event activity. No real invitations used.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
