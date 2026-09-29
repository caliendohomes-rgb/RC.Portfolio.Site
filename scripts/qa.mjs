import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = path.join(root, "dist");
const output = path.join(root, "qa-results");
await mkdir(output, { recursive: true });
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".png": "image/png",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const file = path.resolve(
      publicRoot,
      "." +
        decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname),
    );
    if (!file.startsWith(publicRoot + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    const data = await readFile(file);
    res
      .writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
      })
      .end(data);
  } catch {
    res.writeHead(404).end("Not found");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = process.env.QA_URL || `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_CHANNEL
    ? { channel: process.env.BROWSER_CHANNEL }
    : {}),
});
const report = { url: base, viewports: [], checks: [] };
const failures = [];
const check = (condition, description) => {
  report.checks.push({ description, pass: Boolean(condition) });
  if (!condition) failures.push(description);
};

try {
  const source = await readFile(path.join(publicRoot, "index.html"), "utf8");
  check(
    !/32M|majority.?ARR|120M|6\.4M|3\.2M|1\.2M|23%|20%|\u2014/i.test(source),
    "Public HTML preserves confidential-figure exclusions",
  );
  const viewportSizes = [
    [320, 812],
    [375, 812],
    [430, 932],
    [768, 1024],
    [1024, 768],
    [1280, 900],
    [1440, 900],
    [1728, 1117],
    [2560, 1440],
  ];
  for (const [width, height] of viewportSizes) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400 && response.url().startsWith(base))
        errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => {
      const visible = (el) =>
        el.checkVisibility({ checkVisibilityCSS: true }) &&
        !el.closest("details:not([open]) > :not(summary)");
      const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
      const smallText = [];
      const textNodes = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );
      while (textNodes.nextNode()) {
        const value = textNodes.currentNode.textContent.trim();
        const element = textNodes.currentNode.parentElement;
        if (
          value.length >= 3 &&
          visible(element) &&
          parseFloat(getComputedStyle(element).fontSize) < 12
        )
          smallText.push(value.slice(0, 50));
      }
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        overflowingElements: [...document.querySelectorAll("main *")]
          .filter(visible)
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.right > innerWidth + 1 || r.left < -1;
          })
          .map((el) => el.tagName + "." + el.className),
        brokenAnchors: [...document.querySelectorAll('a[href^="#"]')]
          .filter((el) => !document.getElementById(el.hash.slice(1)))
          .map((el) => el.hash),
        duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
        shortTargets: [...document.querySelectorAll("a, button, summary")]
          .filter(visible)
          .filter((el) => el.getBoundingClientRect().height < 43.5)
          .map((el) => el.textContent.trim()),
        heroBottom: document.querySelector(".hero").getBoundingClientRect()
          .bottom,
        h1s: document.querySelectorAll("h1").length,
        hasMotion: [...document.querySelectorAll("*")].some(
          (el) => getComputedStyle(el).animationName !== "none",
        ),
        smallText,
        readingSizes: [
          ".hero-description",
          ".proof-metrics p",
          ".heading-row > p",
          ".case-lead",
          ".case-facts dd",
          ".detail-grid p",
          ".operating-flow p",
          ".onboarding-copy p",
          ".career-role.current > p:not(.former-title)",
          ".capability-matrix dd",
          ".resume-copy > p:not(.eyebrow)",
          ".contact-layout p:not(.contact-location)",
        ].map((selector) => ({
          selector,
          size: parseFloat(
            getComputedStyle(document.querySelector(selector)).fontSize,
          ),
        })),
      };
    });
    check(
      !layout.overflow && !layout.overflowingElements.length,
      `${width}px: no horizontal overflow`,
    );
    check(
      !layout.shortTargets.length,
      `${width}px: visible interactive targets at least 44px high`,
    );
    check(
      !layout.brokenAnchors.length &&
        !layout.duplicateIds.length &&
        layout.h1s === 1,
      `${width}px: valid anchors, unique IDs and one h1`,
    );
    check(!layout.hasMotion, `${width}px: reduced motion disables animations`);
    check(
      layout.heroBottom < height,
      `${width}px: next section visible in first viewport`,
    );
    check(
      layout.readingSizes.every(({ size }) => size >= 14),
      `${width}px: primary reading text is at least 14px`,
    );
    check(
      !layout.smallText.length,
      `${width}px: visible supporting text is at least 12px`,
    );
    await page.screenshot({ path: path.join(output, `${width}-overview.png`) });
    // Bring lazy images and every region into view before the full-page capture.
    await page.locator("#contact").scrollIntoViewIfNeeded();
    await page.locator(".resume-preview").scrollIntoViewIfNeeded();
    await page.waitForFunction(() =>
      [...document.images].every((el) => el.complete && el.naturalWidth > 0),
    );
    check(
      await page.evaluate(() =>
        [...document.images].every((el) => el.naturalWidth > 0),
      ),
      `${width}px: image assets loaded`,
    );
    await page.screenshot({
      path: path.join(output, `${width}-full.png`),
      fullPage: true,
    });
    if ([375, 768, 1440].includes(width)) {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      check(
        results.violations.length === 0,
        `${width}px: axe WCAG A/AA checks`,
      );
      layout.accessibilityViolations = results.violations.map(
        ({ id, impact, nodes }) => ({
          id,
          impact,
          nodes: nodes.map((node) => ({
            target: node.target,
            summary: node.failureSummary,
          })),
        }),
      );
    }
    check(!errors.length, `${width}px: no browser or HTTP errors`);
    report.viewports.push({ width, height, ...layout, errors });
    await context.close();
  }

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(base);
  check(
    (await page.locator(".onboarding-bridge h3").textContent()).includes(
      "Help new practices take hold",
    ) &&
      (await page.locator(".onboarding-bridge").textContent())
        .replace(/\s+/g, " ")
        .includes("1,500+ engineers and product leaders") &&
      (await page.locator(".onboarding-bridge").textContent()).includes(
        "automated Jira workflow",
      ),
    "Engineering onboarding context and Jira workflow are present",
  );
  check(
    (await page.locator("#ai .case-details").textContent()).includes(
      "no established velocity baseline",
    ) &&
      (await page.locator("#ai .case-details").textContent()).includes(
        "Rovo",
      ),
    "AI case study explains the measurement approach",
  );
  check(
    (await page.locator(".capability-matrix").textContent()).includes(
      "Onboarding systems",
    ),
    "Onboarding systems appears as a supporting capability",
  );
  await page.keyboard.press("Tab");
  check(
    await page
      .locator(".skip-link")
      .evaluate((el) => el === document.activeElement),
    "Keyboard starts at skip link",
  );
  await page.keyboard.press("Enter");
  check(
    await page.locator("#main").evaluate((el) => el === document.activeElement),
    "Skip link moves focus to content",
  );
  const toggle = page.locator(".nav-toggle");
  await toggle.click();
  check(
    (await toggle.getAttribute("aria-expanded")) === "true",
    "Mobile menu opens",
  );
  await page.keyboard.press("Escape");
  check(
    (await toggle.getAttribute("aria-expanded")) === "false" &&
      (await toggle.evaluate((el) => el === document.activeElement)),
    "Escape closes menu and restores focus",
  );
  await toggle.click();
  await page.locator('.site-nav a[href="#work"]').click();
  check(
    (await toggle.getAttribute("aria-expanded")) === "false" &&
      (await page
        .locator("#work")
        .evaluate((el) => el === document.activeElement)),
    "Mobile anchor navigation closes menu and moves focus",
  );
  await page.waitForFunction(() =>
    document
      .querySelector('.site-nav a[href="#work"]')
      .hasAttribute("aria-current"),
  );
  await toggle.click();
  await page.setViewportSize({ width: 1024, height: 768 });
  check(
    (await toggle.getAttribute("aria-expanded")) === "false",
    "Menu state resets on desktop resize",
  );
  await page.setViewportSize({ width: 375, height: 812 });
  check(
    !(await page.locator(".site-nav").isVisible()),
    "Desktop-to-mobile resize keeps menu closed",
  );
  await page.setViewportSize({ width: 768, height: 900 });
  await toggle.click();
  check(
    (await toggle.getAttribute("aria-expanded")) === "true" &&
      (await page.locator(".site-nav a:visible").count()) === 7 &&
      (await page.locator(".nav-icon-close").isVisible()) &&
      (await page.locator(".nav-icon-close").evaluate((el) => el.naturalWidth > 0)),
    "Tablet menu exposes all sections and a visible close icon",
  );
  await page.locator('.site-nav a[href="#tools"]').click();
  check(
    (await toggle.getAttribute("aria-expanded")) === "false" &&
      (await page.locator("#tools").evaluate((el) => el === document.activeElement)),
    "Tablet capabilities link closes menu and moves focus",
  );
  await page.setViewportSize({ width: 375, height: 812 });
  const summary = page.locator("#portfolio summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  check(
    (await page.locator("#portfolio details").getAttribute("open")) !== null,
    "Case study opens by keyboard",
  );
  await page.keyboard.press("Space");
  check(
    (await page.locator("#portfolio details").getAttribute("open")) === null,
    "Case study closes by keyboard",
  );
  await page.evaluate(() =>
    document.querySelectorAll("details:not(.resume-embed)").forEach((el) => {
      el.open = true;
    }),
  );
  const expanded = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  check(
    expanded.violations.length === 0,
    "Expanded content passes axe WCAG A/AA checks",
  );
  check(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Expanded mobile details do not overflow",
  );
  report.expandedViolations = expanded.violations;
  await page.locator("#portfolio").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(output, "375-expanded-case.png") });
  await page.goto(base + "#consulting");
  check(
    (await page.locator(".background-details").getAttribute("open")) !== null,
    "Legacy deep link opens its containing disclosure",
  );
  const download = page.waitForEvent("download");
  await page.locator("a[download]").click();
  check(
    (await download).suggestedFilename() === "Richard_Caliendo_Resume.pdf",
    "Resume download works",
  );
  const pdf = await page.request.get(
    new URL("Richard_Caliendo_Resume.pdf", base).href,
  );
  check(
    pdf.ok() && (await pdf.body()).subarray(0, 5).toString() === "%PDF-",
    "Resume URL returns an actual PDF",
  );
  await page.locator(".resume-embed summary").click();
  check(
    await page.locator(".resume-embed object").isVisible(),
    "Inline PDF preview expands",
  );
  await page.close();

  const noJs = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 375, height: 812 },
  });
  await noJs.goto(base);
  check(
    await noJs.locator(".site-nav").isVisible(),
    "Navigation remains available without JavaScript",
  );
  check(
    await noJs.locator("#portfolio-title").isVisible(),
    "Content remains readable without JavaScript",
  );
  await noJs.locator("#portfolio summary").click();
  check(
    (await noJs.locator("#portfolio details").getAttribute("open")) !== null,
    "Progressive details work without JavaScript",
  );
  await noJs.close();
  const normal = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  await normal.goto(base);
  await normal.locator("#work").scrollIntoViewIfNeeded();
  await normal.waitForFunction(
    () => document.querySelectorAll(".reveal.is-visible").length > 0,
  );
  check(
    (await normal.locator(".reveal.is-visible").count()) > 0,
    "Normal-motion entrances run when content enters view",
  );
  await normal.emulateMedia({ reducedMotion: "reduce" });
  check(
    await normal
      .locator(".reveal")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName === "none"),
    "Changing reduced-motion preference disables active animation",
  );
  await normal.close();
} catch (error) {
  failures.push(error.stack);
} finally {
  report.failures = failures;
  await writeFile(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
console.log(
  `${report.checks.filter((item) => item.pass).length}/${report.checks.length} checks passed. ${report.viewports.length} viewport sizes. See qa-results/report.json.`,
);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
