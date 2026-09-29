import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const font = await readFile(
  new URL("../assets/manrope-latin.woff2", import.meta.url),
  "base64",
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_CHANNEL
    ? { channel: process.env.BROWSER_CHANNEL }
    : {}),
});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!doctype html><html><head><style>@font-face{font-family:Manrope;src:url(data:font/woff2;base64,${font})}*{box-sizing:border-box}body{margin:0;background:#171c1b;color:#f6f8f4;font-family:Manrope,sans-serif;padding:54px 66px}header{display:flex;justify-content:space-between;border-bottom:1px solid #38433e;padding-bottom:27px;color:#b0bcb6;font-size:15px}.brand{font-size:32px;color:white}.accent{color:#c1e4c1}h1{font-size:76px;font-weight:500;line-height:1.08;margin:44px 0 18px}p{font-size:28px;margin:0;color:#b0bcb6}.label{color:#c1e4c1;font-size:15px;margin-top:35px}footer{position:absolute;bottom:45px;font-size:16px;color:#b0bcb6}</style></head><body><header><span class="brand">rc<span class="accent">.</span></span><span>TECHNICAL PROGRAM LEADERSHIP</span></header><h1>Richard Caliendo<span class="accent">.</span></h1><p>Complex strategy. Executable systems.</p><div class="label">SaaS transformation / AI enablement / Engineering execution</div><footer>Staff Technical Program Manager, Product &amp; Engineering<br>richardecaliendo.com</footer></body></html>`,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: fileURLToPath(
      new URL("../assets/social-preview.png", import.meta.url),
    ),
  });
} finally {
  await browser.close();
}
