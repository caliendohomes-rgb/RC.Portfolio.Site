import { createServer } from "node:net";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import lighthouse from "lighthouse";

const output = new URL("../qa-results/", import.meta.url);
await mkdir(output, { recursive: true });
const portServer = createServer();
await new Promise((resolve) => portServer.listen(0, "127.0.0.1", resolve));
const port = portServer.address().port;
await new Promise((resolve) => portServer.close(resolve));
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_CHANNEL
    ? { channel: process.env.BROWSER_CHANNEL }
    : {}),
  args: [`--remote-debugging-port=${port}`],
});
try {
  const result = await lighthouse(
    process.env.QA_URL || "http://127.0.0.1:4173/",
    {
      port,
      output: ["html", "json"],
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      logLevel: "error",
    },
  );
  if (result.lhr.runtimeError) throw new Error(result.lhr.runtimeError.message);
  await writeFile(new URL("lighthouse.report.html", output), result.report[0]);
  await writeFile(new URL("lighthouse.report.json", output), result.report[1]);
  for (const [name, category] of Object.entries(result.lhr.categories))
    console.log(`${name}: ${Math.round(category.score * 100)}`);
  console.log(
    `Report: ${fileURLToPath(new URL("lighthouse.report.html", output))}`,
  );
} finally {
  await browser.close();
}
