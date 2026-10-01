# Richard Caliendo Portfolio

Static source for [richardecaliendo.com](https://richardecaliendo.com), deployed to the existing Netlify project. The browser loads HTML, CSS, a self-hosted font, small visual assets, and vanilla JavaScript. There is no frontend framework, client dependency bundle, database, or tracking service.

## Local preview

Run the build to assemble `index.html` from the three source fragments. For HTTP behavior and audits, use Node 22+ and pnpm:

```powershell
pnpm install --frozen-lockfile
pnpm build
python -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:4173`. Choose another free port if needed.

## Verification

```powershell
pnpm check
pnpm build
# Windows: use installed Edge. Omit this variable for Playwright Chromium.
$env:BROWSER_CHANNEL = 'msedge'
pnpm test
pnpm run audit
```

Run the Lighthouse script with the HTTP preview running. On a machine without Edge, run `pnpm exec playwright install chromium` once.

The test starts and closes its own localhost server serving `dist`. Reports and screenshots go to ignored `qa-results/`. Set `QA_URL` to test a Netlify preview or production URL instead. Viewports: 320, 375, 430, 768, 1024, 1280, 1440, 1728, and 2560 pixels.

Checks cover layout overflow, touch targets, active navigation, keyboard and mobile menu behavior, disclosures, no-JavaScript fallbacks, reduced motion, links, downloads, image assets, browser errors, duplicate IDs, content exclusions, and axe WCAG A/AA rules. Automated checks do not replace assistive-technology or device testing.

## Source map

- `site_head.html`, `site_body.html`, `site_js.html`: source fragments for the document head, page body, and script/footer. `index.html` is assembled from them during the build.
- `index.html`: generated public HTML, committed for direct preview and search indexing.
- `styles.css`: design tokens, graphite/white surfaces, constrained content rails, responsive layouts, focus, print, and reduced-motion styles.
- `script.js`: mobile navigation, active section, reading progress, brief entrance effects, and legacy deep links.
- `assets/`: self-hosted Manrope font, licensed Lucide icons, favicon, social preview, and actual resume thumbnail. Third-party licenses are included.
- `Richard_Caliendo_Resume.pdf`: public-safe two-page copy of Richard's supplied resume.
- `scripts/build.mjs`: assembles the HTML and copies the public-file allowlist to `dist`. It removes superseded resume PDFs from `dist`.
- `scripts/qa.mjs`, `scripts/lighthouse.mjs`: repeatable QA.
- `scripts/create-public-resume.py`: removes previously withheld details from Richard's supplied PDF while retaining its two-page layout. `scripts/fonts/` holds the matching EB Garamond fonts and license.
- `scripts/generate-resume.py`: earlier portfolio resume generator, not used for the current public PDF.
- `scripts/generate-social.mjs`: generates the social-sharing image with Playwright.
- `robots.txt`, `sitemap.xml`: discoverability.
- `_headers`: publish-directory response headers for the public resume and its preview.

## Content integrity

The approved portfolio copy and Richard's explicit corrections govern titles, dates, program scope, and disclosure. Preserve the Staff TPM title and the separate historical Training & Development roles. Revenue remains described as targeted multi-million-dollar impact; confidential figures and precise productivity percentages stay excluded. Portal releases are alpha and early access; the path to GA is described without a target date or internal process details. Cloud and regulated-market readiness are objectives, not completed certifications or personal engineering claims. Hands-on builds are framed as AI-assisted work, not software engineering employment.

Richard supplied a new resume on September 29, 2026 and requested a public-safe copy before publishing. The unredacted source stays outside the repository. Do not publish it or reintroduce its withheld figures and GA process details.

To regenerate the public PDF from Richard's private source, install PyMuPDF and run `python scripts/create-public-resume.py PATH_TO_PRIVATE_SOURCE.pdf`. Validate both pages visually and extract the text before publishing. Regenerate `assets/resume-preview.webp` from page one after any resume change (510 x 660 pixels). The PDF is text-searchable; the website provides the semantic HTML presentation.

When replacing a public resume, update the version query on every PDF and thumbnail URL in `site_body.html`. The `_headers` file requests `no-store`, but the live Netlify site currently returns a one-hour cache header for the PDF path. The version query is necessary to avoid an older browser copy. The thumbnail currently returns `no-store`.

## Netlify

Existing project: `richard-caliendo-portfolio`.
Site ID: `9ed4ac04-91f1-45bf-aab5-56b0a3caee97`.

`netlify.toml` specifies `node scripts/build.mjs` and publishes only `dist` using Node 22. All assets are committed, so production does not need Python or a browser to build. The build does not regenerate the resume or visual assets.

With an authenticated Netlify CLI:

```powershell
pnpm build
netlify deploy --dir=dist
# After validating the preview, for an authorized production release:
netlify deploy --prod --dir=dist
```

The existing Git connection deploys `main`; use a feature branch and pull request for review. Keep a known-good deploy in Netlify's deployment history for rollback.

## Experience design

Overview and proof lead into three transformation narratives, a release record, an operating model, career progression, supporting tools, resume, and recruiting contact. Native disclosures provide depth without hiding the core evidence. The resume is the primary action; consulting sits beneath career details. No automatic counters, continuous particles, fake charts, custom cursors, or heavyweight animation libraries.

The operating model includes a compact engineering onboarding and enablement example. It connects verified global orientation work with first-week Jira-based AI tool provisioning, peer guidance, and engineering adoption while keeping technical program leadership as the primary positioning. The expanded AI case study explains the Rovo/Claude measurement approach without publishing excluded figures. The downloadable PDF remains the general portfolio resume; role-specific application documents are not published on the site.

The readability pass uses larger body and navigation text, a wider desktop content area, tighter section spacing, and a narrower career introduction column. Primary reading copy stays at least 14px across tested widths. Desktop navigation links directly to Work, Approach, Experience, Capabilities, Resume, and Contact; the menu collapses below 900px.
