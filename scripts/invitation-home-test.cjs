const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    for (const width of [320, 390, 820, 1024, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/vivian`);
      await page.getByLabel('Your name here', { exact: true }).waitFor();
      assert.equal(await page.locator('dialog[open]').count(), 0, 'No arrival popup');
      assert.equal((await page.locator('h1').innerText()).replace(/\s+/g, ''), 'You’reinvited.');
      await page.getByLabel('Your name here', { exact: true }).fill('Alex Chen');
      const heightBefore = await page.locator('.ic-hero').evaluate(el => el.getBoundingClientRect().height);
      await page.getByLabel('Your name here', { exact: true }).press('Enter');
      await page.getByRole('button', { name: 'Break the seal and open your invitation' }).click();
      assert.equal(await page.locator('.ic-open-letter .ic-handwriting').innerText(), 'Dear Alex Chen,');
      assert.equal(await page.locator('.ic-confetti i').count(), 84);
      assert.equal(await page.locator('.ic-hero').evaluate(el => el.getBoundingClientRect().height), heightBefore);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
      await page.getByRole('link', { name: 'Let’s make a plan' }).click();
      await page.waitForURL('**/join?from=vivian');
      await page.waitForFunction(() => document.querySelector('input').value === 'Alex Chen');
      assert(await page.getByText('Invited by Vivian. Tell us what works for you.').isVisible());
      await page.goto(base);
      await page.getByLabel('Your name here', { exact: true }).waitFor();
      assert.equal(await page.locator('dialog[open]').count(), 0);
      assert.equal(await page.getByLabel('Your name here', { exact: true }).inputValue(), 'Alex Chen');
      assert.equal(await page.getByRole('img', { name: /An illustrated dinner table/ }).count(), 1);
      await page.getByLabel('Your name here', { exact: true }).fill('');
      await page.getByRole('button', { name: 'Turn me over' }).click();
      await page.getByRole('button', { name: 'Break the seal and open your invitation' }).click();
      assert.equal(await page.locator('.ic-open-letter .ic-handwriting').innerText(), 'Dear you,');
      assert.deepEqual(errors, []);
      await context.close();
    }
    const page = await browser.newPage();
    await page.goto(`${base}/Vivian`);
    await page.waitForURL('**/vivian');
    assert.equal((await page.goto(`${base}/not-a-registered-inviter`)).status(), 404);
    console.log('PASS: responsive personal invitations, no arrival popup, keyboard flip, stable header, confetti, name/referral handoff, optional name, registered routes. No submissions sent.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
