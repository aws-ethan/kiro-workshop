/**
 * 将 pandoc 生成的 HTML 转为 PDF。
 * 依赖：puppeteer-core + 本地 Chrome
 * 用法：node to-pdf.js
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

// 按平台查找 Chrome 路径
function findChrome() {
  const candidates = [
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

(async () => {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error('❌ 未找到 Chrome，请安装 Google Chrome 后重试');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
  });

  const page = await browser.newPage();
  const htmlPath = path.join(__dirname, '_combined.html');

  if (!fs.existsSync(htmlPath)) {
    console.error('❌ 未找到 _combined.html，请先运行 pandoc 生成 HTML');
    await browser.close();
    process.exit(1);
  }

  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  const pdfPath = path.join(__dirname, '..', 'Kiro_Workshop_手册.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '25mm', bottom: '25mm', left: '20mm', right: '20mm' },
    displayHeaderFooter: true,
    headerTemplate:
      '<div style="font-size:9px;width:100%;text-align:center;color:#999;font-family:sans-serif;">Kiro Workshop 手册</div>',
    footerTemplate:
      '<div style="font-size:9px;width:100%;text-align:center;color:#999;font-family:sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    printBackground: true,
  });

  console.log(`✅ PDF 已生成: ${pdfPath}`);
  await browser.close();
})();
