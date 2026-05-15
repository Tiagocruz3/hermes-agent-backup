const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHAT_ID = '7847610860';
const INTERVAL = 3000;
const CACHE = path.join(process.env.HOME, '.hermes/image_cache/livestream');
fs.mkdirSync(CACHE, { recursive: true });

function getToken() {
  const c = fs.readFileSync(path.join(process.env.HOME, '.hermes/.env'), 'utf8');
  const m = c.match(/TELEGRAM_BOT_TOKEN=(.+)/);
  return m ? m[1].trim().replace(/["']/g, '') : '';
}

function sendToTelegram(fpath, cap) {
  return new Promise(r => {
    const t = getToken();
    exec(`curl -s -X POST "https://api.telegram.org/bot${t}/sendPhoto" -F chat_id=${CHAT_ID} -F photo=@"${fpath}" -F caption="${cap}" --max-time 10`, (e,o) => {
      try { r(JSON.parse(o).ok); } catch { r(false); }
    });
  });
}

(async () => {
  const url = process.argv[2] || 'https://google.com';
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/snap/bin/chromium',
    defaultViewport: { width: 1280, height: 800 },
    args: ['--start-maximized', '--no-sandbox']
  });

  let frame = 0;
  let page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  async function captureAndSend() {
    try { await page.evaluate(() => 1); }
    catch {
      page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    try {
      const shot = path.join(CACHE, `puppet-${String(frame).padStart(4,'0')}.png`);
      await page.screenshot({ path: shot, type: 'png' });
      await sendToTelegram(shot, frame === 0 ? `🖥️ ${url}` : '🖥️');
      if (frame > 5) try { fs.unlinkSync(path.join(CACHE, `puppet-${String(frame-5).padStart(4,'0')}.png`)); } catch {}
      frame++;
    } catch(e) { console.error(e.message); }
  }

  await captureAndSend();
  setInterval(captureAndSend, INTERVAL);
  console.log('✅ Streaming — check Telegram!');
})();