# RC Portfolio Site

Static source for richardecaliendo.com, hosted on Netlify.

## Local preview

```powershell
python -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Files

- `index.html`: portfolio content, metadata, sections, resume embed, links.
- `styles.css`: responsive dark visual system and reduced-motion behavior.
- `script.js`: scroll progress, subtle reveal behavior, count-ups, and restrained ambient canvas particles.
- `Richard_Caliendo_Resume.pdf`: resume file linked from the site. Replace this file when the new resume PDF is ready.

## Netlify

This site is configured as a static publish through `netlify.toml`.

## QA notes

Before review, run the checks listed in the work request against the committed source and the local preview. The source should not contain restricted revenue figures, restricted productivity figures, confidential portfolio scope language, preloader copy, or disallowed punctuation.
