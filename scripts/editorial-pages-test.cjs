const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3107';
const pages = [
  { path: '/about', title: 'Good company. An actual plan.', sections: 3, text: ['guest-speaker dinner', 'talking to one person', 'not a list of experiences we already offer'] },
  { path: '/philosophy', title: 'An invitation, not another feed.', sections: 6, text: ['The guest list isn’t the product.', 'accessibility tools', 'planned recruiting, research, or sales purpose', 'instant best friends'] },
  { path: '/how-it-works', title: 'You bring yourself. We start the plan.', sections: 6, text: ['A dinner isn’t guaranteed.', 'demand exceeds our hosting capacity', 'No', 'Two unexcused late cancellations within 90 days'] },
];
(async () => {
  fs.mkdirSync('.review-artifacts/editorial', { recursive: true });
  const links = new Set();
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
    try {
      for (const [width, theme] of [[320, 'light'], [820, 'dark'], [1440, 'light']]) {
        const context = await browser.newContext({ viewport: { width, height: 1100 }, colorScheme: theme, reducedMotion: 'reduce' });
        const page = await context.newPage();
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        for (const item of pages) {
          const response = await page.goto(base + item.path); assert.equal(response.status(), 200);
          await page.waitForLoadState('networkidle');
          await page.evaluate(() => document.fonts.ready);
          assert.equal(await page.locator('h1').innerText(), item.title);
          assert.equal(await page.locator('.ic-editorial-chapter').count(), item.sections);
          assert.equal(await page.locator('.ic-info-card').count(), 0, 'Editorial prose, not slogan cards');
          const text = await page.locator('#club-content').innerText();
          for (const expected of item.text.filter(value => value !== 'No')) assert(text.includes(expected), expected);
          assert((await page.locator('.ic-editorial p').count()) >= item.sections * 2);
          const lowContrast = await page.locator('.ic-editorial h2, .ic-editorial p, .ic-editorial a, .ic-editorial-step, .ic-info-heading h1, .ic-info-lede, .ic-editorial-cta p').evaluateAll(elements => {
            const rgba = color => { const values = color.match(/[\d.]+/g)?.map(Number) || []; return [values[0] || 0, values[1] || 0, values[2] || 0, values[3] ?? 1]; };
            const over = (top, bottom) => [0, 1, 2].map(index => top[index] * top[3] + bottom[index] * (1 - top[3]));
            const luminance = color => color.slice(0, 3).map(channel => channel / 255).map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);
            return elements.flatMap(element => {
              const ancestors = []; for (let current = element; current; current = current.parentElement) ancestors.unshift(current);
              let background = [255, 255, 255];
              for (const ancestor of ancestors) background = over(rgba(getComputedStyle(ancestor).backgroundColor), background);
              const foreground = over(rgba(getComputedStyle(element).color), background);
              const a = luminance(foreground), b = luminance(background);
              const contrast = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
              return contrast < 4.5 ? [{ text: element.textContent.slice(0, 70), contrast }] : [];
            });
          });
          assert.deepEqual(lowContrast, [], `${item.path} ${theme}: reading text needs at least 4.5:1 contrast`);
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow ${item.path} ${width}`);
          assert.equal(await page.getByRole('link', { name: 'Join the Berkeley pilot' }).getAttribute('href'), '/join');
          if (item.path === '/how-it-works') assert.deepEqual(await page.locator('.ic-editorial-step').allTextContents(), ['1', '2', '3', '4', '5', '6']);
          for (const href of await page.locator('a[href^="/"]').evaluateAll(elements => elements.map(element => element.getAttribute('href')))) links.add(href.split('#')[0]);
          await page.screenshot({ path: `.review-artifacts/editorial/${item.path.slice(1)}-${engine === chromium ? 'chrome' : 'webkit'}-${width}-${theme}.png`, fullPage: true });
        }
        assert.deepEqual(errors, []); await context.close();
      }
      for (const path of links) { const response = await browser.newPage(); assert((await response.goto(base + path)).status() < 400, `Working link ${path}`); await response.close(); }
    } finally { await browser.close(); }
  }
  console.log('PASS: three substantive editorial pages, founder story and current pilot facts, six unpadded steps, Chrome/WebKit phone/iPad/desktop light/dark, text contrast >=4.5:1, no overflow or runtime errors, all internal links. Read-only checks; no form submissions.');
})().catch(error => { console.error(error); process.exit(1); });
