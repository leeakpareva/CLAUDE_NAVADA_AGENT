#!/usr/bin/env node
/**
 * Generate NAVADA Edge BPM PDF from HTML
 */
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const htmlPath = path.join(__dirname, 'IMPORTANT-NAVADA-EDGE-BPM.html');
  const pdfPath = path.join(__dirname, 'IMPORTANT-NAVADA-EDGE-BPM.pdf');

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    timeout: 60000,
  });
  const page = await browser.newPage();

  console.log('Loading HTML...');
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });

  console.log('Generating PDF...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
    displayHeaderFooter: false,
  });

  await browser.close();
  console.log(`PDF saved: ${pdfPath}`);
})();
