const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');

const pages = [
  { file: 'index.html',       out: 'index.png' },
  { file: 'HDB_WNV.html',     out: 'hdb_wnv.png' },
  { file: 'BAS_WNV.html',     out: 'bas_wnv.png' },
  { file: 'TOOLING_WNV.html', out: 'tooling_wnv.png' },
  { file: 'UNIFIED_WNV.html', out: 'unified_wnv.png' },
];

const repoRoot = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  for (const { file, out } of pages) {
    const url = `file://${path.join(repoRoot, file)}`;
    const outPath = path.join(__dirname, out);
    console.log(`Screenshotting ${file} -> screenshots/${out}`);
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (e) {
      // Timeout waiting for domcontentloaded — page may still be usable
      console.warn(`  Warning: ${e.message.split('\n')[0]}`);
    }
    // Give layout a moment to settle
    await page.waitForTimeout(1000);
    await page.screenshot({ path: outPath, fullPage: false });
    await page.close();
  }

  await browser.close();
  console.log('Done.');
})();
