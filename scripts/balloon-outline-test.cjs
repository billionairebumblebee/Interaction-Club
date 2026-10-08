const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
const before = process.env.OUTLINE_BEFORE === '1';

(async () => {
  fs.mkdirSync('.review-artifacts/outlines', { recursive: true });
  for (const engine of before ? [chromium] : [chromium, webkit]) {
    const browser = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
    try {
      for (const [width, dpr] of before ? [[1920, 1]] : [[390, 3], [1440, 1], [1920, 1], [1920, 2]]) {
        for (const theme of before ? ['dark'] : ['light', 'dark']) {
          const context = await browser.newContext({ viewport: { width, height: 1200 }, deviceScaleFactor: dpr, reducedMotion: 'reduce' });
          await context.addInitScript(theme => {
            localStorage.setItem('interaction.appearance', theme);
            sessionStorage.setItem('interaction.invitation.visited', '1');
            sessionStorage.setItem('interaction.invitation.engaged', '1');
          }, theme);
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          assert.equal((await page.goto(base)).status(), 200);
          await page.waitForLoadState('networkidle');
          await page.evaluate(() => document.fonts.ready);
          for (const selector of ['.ic-foil-heading img', '.ic-nav .ic-balloon-wordmark img']) {
            await page.locator(selector).evaluate(image => image.decode());
            assert((await page.locator(selector).evaluate(image => getComputedStyle(image).filter)).includes('cutout'));
          }
          if (!before) for (const id of ['ic-balloon-cutout', 'ic-wordmark-cutout']) {
            assert.equal(await page.locator(`#${id} feMorphology`).count(), 0, 'No square dilation kernel');
            assert.equal(await page.locator(`#${id} feFuncA[type="discrete"]`).count(), 0, 'No binary alpha edge');
            assert.equal(await page.locator(`#${id} feGaussianBlur`).count(), 1);
            assert.equal(await page.locator(`#${id} feMergeNode`).last().getAttribute('in'), 'SourceGraphic', 'Original artwork stays sharp');
          }
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
          assert.deepEqual(errors, []);
          const name = `${before ? 'before' : 'after'}-${engine === chromium ? 'chrome' : 'webkit'}-${width}-${dpr}x-${theme}`;
          await page.screenshot({ path: `.review-artifacts/outlines/${name}.png` });
          await page.locator('.ic-foil-heading').screenshot({ path: `.review-artifacts/outlines/${name}-headline.png` });
          await context.close();
        }
      }
    } finally { await browser.close(); }
  }
  console.log('PASS: smooth cutout filters, original artwork preserved, Chrome/WebKit desktop/mobile at 1x/2x/3x, both themes, no overflow or runtime errors.');
})().catch(error => { console.error(error); process.exit(1); });
