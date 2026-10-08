const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3107';

(async () => {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch(engine === chromium ? { channel: 'chrome' } : {});
    try {
      for (const [width, height] of [[390, 844], [768, 1024], [820, 1180], [1180, 820], [1024, 1366], [1366, 1024]]) {
        for (const theme of ['light', 'dark']) {
          const context = await browser.newContext({ viewport: { width, height }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
          await context.addInitScript(theme => {
            localStorage.setItem('interaction.appearance', theme);
            sessionStorage.setItem('interaction.invitation.visited', '1');
            sessionStorage.setItem('interaction.invitation.engaged', '1');
            sessionStorage.setItem('interaction.invitation.name', 'Vivian');
          }, theme);
          const page = await context.newPage();
          await page.goto(base);
          await page.waitForFunction(() => document.querySelector('.ic-plate strong')?.textContent === 'Vivian');
          const label = `${engine.name()} ${width}x${height} ${theme}`;
          for (const selector of ['.ic-plate', '.ic-plate>div']) {
            const size = await page.locator(selector).evaluate(el => {
              const css = getComputedStyle(el);
              return { width: parseFloat(css.width), height: parseFloat(css.height) };
            });
            assert(Math.abs(size.width - size.height) < 1, `${label}: ${selector} must be a circle, ${JSON.stringify(size)}`);
          }
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          const edge = await page.evaluate(() => ({
            footer: document.querySelector('.ic-footer').getBoundingClientRect().bottom + scrollY,
            page: document.documentElement.scrollHeight,
            width: document.documentElement.scrollWidth,
            viewport: innerWidth,
            rootOverscroll: getComputedStyle(document.documentElement).overscrollBehaviorY,
            bodyOverscroll: getComputedStyle(document.body).overscrollBehaviorY,
            nativeOverscroll: CSS.supports('overscroll-behavior-y', 'none'),
          }));
          assert(Math.abs(edge.page - edge.footer) <= 1, `${label}: extra content below footer ${JSON.stringify(edge)}`);
          assert(edge.width <= edge.viewport, `${label}: horizontal overflow`);
          if (edge.nativeOverscroll) {
            assert.equal(edge.rootOverscroll, 'none', `${label}: root bounce disabled`);
            assert.equal(edge.bodyOverscroll, 'none', `${label}: body bounce disabled`);
          } else {
            const gesture = async (from, to, fingers = 1) => page.locator('.ic-footer').evaluate((target, { from, to, fingers }) => {
              const touchEvent = (type, y, count) => {
                const event = new Event(type, { bubbles: true, cancelable: true });
                Object.defineProperty(event, 'touches', { value: Array.from({ length: count }, (_, identifier) => ({ identifier, target, clientX: 40 + identifier * 20, clientY: y })) });
                return event;
              };
              target.dispatchEvent(touchEvent('touchstart', from, fingers));
              const move = touchEvent('touchmove', to, fingers);
              target.dispatchEvent(move);
              target.dispatchEvent(touchEvent('touchend', to, 0));
              return move.defaultPrevented;
            }, { from, to, fingers });
            assert(await gesture(400, 300), `${label}: fallback stops pulling past footer`);
            assert(!(await gesture(300, 400)), `${label}: scrolling back up works`);
            assert(!(await gesture(400, 300, 2)), `${label}: pinch zoom is untouched`);
            await page.evaluate(() => window.scrollTo(0, 500));
            assert(!(await gesture(400, 300)), `${label}: normal page scrolling works`);
            await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          }
          if (width === 820 && engine === webkit) {
            await page.screenshot({ path: `.review-artifacts/ipad-footer-${theme}.png` });
            await page.locator('.ic-place-setting').screenshot({ path: `.review-artifacts/ipad-dish-${theme}.png` });
          }
          await context.close();
        }
      }
    } finally { await browser.close(); }
  }
  console.log('PASS: round dish and inner well, document ends at footer, root overscroll disabled; Chromium/WebKit, six phone/iPad viewports, light/dark. No submissions.');
})().catch(error => { console.error(error); process.exit(1); });
