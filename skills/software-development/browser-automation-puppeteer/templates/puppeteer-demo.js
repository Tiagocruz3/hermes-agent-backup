const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,                        // VISIBLE on desktop
    executablePath: '/snap/bin/chromium',   // ARM64 snap Chromium
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  const page = await browser.newPage();
  const url = process.argv[2] || 'https://google.com';
  console.log(`Opening ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // Keep browser open 30s
  await new Promise(r => setTimeout(r, 30000));
  await browser.close();
  console.log('Done');
})();