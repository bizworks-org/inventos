import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'settings-screenshot.png', fullPage: true });
  await browser.close();
  console.log('Saved settings-screenshot.png');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
