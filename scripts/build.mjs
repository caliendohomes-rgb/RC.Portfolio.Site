import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
const files = [
  "styles.css",
  "script.js",
  "Richard_Caliendo_Resume.pdf",
  "robots.txt",
  "sitemap.xml",
  "_headers",
];
await mkdir(output, { recursive: true });
const fragments = await Promise.all(
  ["site_head.html", "site_body.html", "site_js.html"].map((name) =>
    readFile(path.join(root, name), "utf8").then((part) =>
      part.replace(/\r\n/g, "\n"),
    ),
  ),
);
const html = fragments.join("");
const index = path.join(root, "index.html");
if ((await readFile(index, "utf8")).replace(/\r\n/g, "\n") !== html)
  await writeFile(index, html);
await writeFile(path.join(output, "index.html"), html);
for (const entry of await readdir(output)) {
  if (
    entry.startsWith("Richard_Caliendo_Resume") &&
    entry.endsWith(".pdf") &&
    entry !== "Richard_Caliendo_Resume.pdf"
  )
    await rm(path.join(output, entry));
}
for (const file of files)
  await cp(path.join(root, file), path.join(output, file));
await cp(path.join(root, "assets"), path.join(output, "assets"), {
  recursive: true,
});
let bytes = 0;
async function measure(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) await measure(location);
    else bytes += (await stat(location)).size;
  }
}
await measure(output);
console.log(
  `Static build complete: ${(bytes / 1024).toFixed(1)} KB in dist. No client dependencies.`,
);
