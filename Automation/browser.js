const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR);

(async () => {
  const action = process.argv[2];
  const arg1 = process.argv.slice(3).join(' ');
  const arg2 = process.argv[5] || '';

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    userDataDir: path.join(__dirname, 'chrome-profile'),
    defaultViewport: null,
    args: ['--start-maximized', '--disable-features=TranslateUI']
  });

  const pages = await browser.pages();
  const page = pages[0] || await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(15000);

  async function dismissDialogs() {
    try {
      // Google cookie consent
      const acceptBtn = await page.$('button[id="L2AGLb"], button[aria-label="Accept all"], [data-ved] button');
      if (acceptBtn) await acceptBtn.click();
    } catch {}
  }

  switch (action) {
    case 'goto': {
      const url = process.argv[3];
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await dismissDialogs();
      console.log(`Page loaded: ${await page.title()}`);
      const ssPath = path.join(SCREENSHOTS_DIR, 'page.png');
      await page.screenshot({ path: ssPath });
      console.log(`Screenshot: ${ssPath}`);
      break;
    }

    case 'screenshot': {
      const ssName = process.argv[3] || `screen-${Date.now()}.png`;
      const ssPath = path.join(SCREENSHOTS_DIR, ssName);
      await page.screenshot({ path: ssPath, fullPage: false });
      console.log(`Screenshot saved: ${ssPath}`);
      break;
    }

    case 'search': {
      const query = process.argv.slice(3).join(' ');
      console.log(`Searching Google for: ${query}`);
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' });
      await dismissDialogs();
      await new Promise(r => setTimeout(r, 2000));
      console.log(`Results: ${await page.title()}`);
      const ssPath = path.join(SCREENSHOTS_DIR, 'search-result.png');
      await page.screenshot({ path: ssPath });
      console.log(`Screenshot: ${ssPath}`);
      break;
    }

    case 'scrape': {
      const url = process.argv[3];
      if (url) await page.goto(url, { waitUntil: 'domcontentloaded' });
      await dismissDialogs();
      const text = await page.evaluate(() => document.body.innerText.substring(0, 5000));
      console.log(text);
      await browser.close();
      return;
    }

    default: {
      console.log('Opening Chrome...');
      await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
      await dismissDialogs();
      console.log('Chrome ready. Commands: goto, screenshot, search, scrape');
    }
  }

  console.log('Browser staying open.');
  await new Promise(() => {});
})();
