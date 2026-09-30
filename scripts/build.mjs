import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
const files = [
  "index.html",
  "styles.css",
  "script.js",
  "Richard_Caliendo_Resume_2026.pdf",
  "robots.txt",
  "sitemap.xml",
  "_headers",
];
await mkdir(output, { recursive: true });
await rm(path.join(output, "Richard_Caliendo_Resume.pdf"), { force: true });
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
