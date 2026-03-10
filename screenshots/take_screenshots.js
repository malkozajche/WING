const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');

const pages = [
  { file: 'index.html',       out: 'index.png',       zoom: null },
  { file: 'HDB_WNV.html',     out: 'hdb_wnv.png',     zoom: 0.5 },
  { file: 'BAS_WNV.html',     out: 'bas_wnv.png',     zoom: 0.5 },
  { file: 'TOOLING_WNV.html', out: 'tooling_wnv.png', zoom: 0.5 },
  { file: 'UNIFIED_WNV.html', out: 'unified_wnv.png', zoom: 0.5 },
];

const repoRoot = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  for (const { file, out, zoom } of pages) {
    const url = `file://${path.join(repoRoot, file)}`;
    const outPath = path.join(__dirname, out);
    console.log(`Screenshotting ${file} -> screenshots/${out}`);
    const page = await context.newPage();

    if (zoom) {
      // Use a very tall viewport so full page content is not clipped when measuring
      await page.setViewportSize({ width: 1280, height: 8000 });
    }

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (e) {
      // Timeout waiting for domcontentloaded — page may still be usable
      console.warn(`  Warning: ${e.message.split('\n')[0]}`);
    }
    // Give layout a moment to settle
    await page.waitForTimeout(1000);

    if (zoom) {
      await page.evaluate((z) => {
        document.documentElement.style.zoom = String(z);
      }, zoom);
      await page.waitForTimeout(200);
      // With the tall viewport, all elements are in-view so getBoundingClientRect
      // gives true positions (not clipped). scrollHeight is unreliable due to min-height: 100vh.
      const contentHeight = await page.evaluate(() => {
        let maxBottom = 0;
        document.querySelectorAll('body *').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && rect.bottom > maxBottom) {
            maxBottom = rect.bottom;
          }
        });
        return Math.ceil(maxBottom) + 20;
      });
      await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1280, height: contentHeight } });
    } else {
      await page.screenshot({ path: outPath, fullPage: false });
    }
    await page.close();
  }

  await browser.close();
  console.log('Done.');
})();
