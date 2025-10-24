import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture network requests
  const requests = [];
  page.on('request', (req) => {
    requests.push({ url: req.url(), method: req.method() });
  });

  try {
    const url = process.env.TEST_URL || 'http://localhost:3001/settings';
    console.log('Visiting', url);
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for the switch element
    const switchSelector = '[data-slot="switch"]';
    await page.waitForSelector(switchSelector, { timeout: 5000 });

    // Click the switch
    console.log('Clicking the switch...');
    await page.click(switchSelector);

    // wait a moment for any network to fire
    await page.waitForTimeout(1000);

    // Look for PUT /api/branding
    const brandingRequests = requests.filter(r => r.url.includes('/api/branding'));
    console.log('Requests to /api/branding:', brandingRequests.map(r => `${r.method} ${r.url}`));
  } catch (e) {
    console.error('Test failed:', e);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
