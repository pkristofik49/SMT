# SMT

Small tools — everyday utilities

[Czech version](README_CZ.md) · [Live application](https://pkristofik49.github.io/SMT/)

A Vue SPA with a two-column tool menu (one column on mobile). Six placeholder cards cover text, JSON, unit conversions, colours, dates, and passwords. The tools are not implemented yet. Search matches names, categories, and descriptions regardless of case and Czech diacritics, and offers a reset when nothing matches.

## Running

Open `index.html` in a current browser or serve the project directory with an existing static HTTP server, such as IIS. Classic deferred scripts and relative paths support both local files and `/SMT/` on GitHub Pages. No package manager, build step, Node.js, router, or UI library is needed.

The only external library is **Vue 3.5.45**, stored locally in `vendor/vue.global.prod.js`, with its MIT licence in `vendor/VUE-LICENSE`. All application assets are local: there are no CDN or font requests. After downloading, the application runs from disk without internet. Service-worker caching and PWA installation are not implemented.

## Structure

```text
index.html                   Vue template and script entry points
styles.css                   Responsive styling
js/app.js                    State, tool catalogue, search, and icons
js/translations.js           Localized application text (Czech)
js/version.js                Application version
vendor/                      Local Vue distribution and licence
icons/                       Application icon
.githooks/pre-commit          Tracked versioning hook
scripts/update-version.ps1   Version update script
tests/ui.html                Browser integration tests
tests/versioning.ps1         Isolated version-hook tests
.github/workflows/deploy.yml GitHub Pages deployment
AGENTS.md                    Maintenance rules
```

Add tool metadata in `js/app.js` and its name, category, and description in `js/translations.js`. All interface text, including page metadata and accessible labels, belongs in the translations file. The bilingual `noscript` fallback stays in HTML because scripts cannot load when JavaScript is disabled.

## Versioning

The footer shows **SMT · 1.000**. The first commit containing `js/version.js` starts at `1.000`; every subsequent commit adds `0.001` (`1.999` becomes `2.000`). Earlier commits are not renumbered.

Enable the tracked hook after cloning:

```sh
git config core.hooksPath .githooks
```

The hook uses Windows PowerShell and derives the next version from committed HEAD. Stage version-file edits first; unstaged edits stop the hook. A failed commit can be retried without consuming a version. The hook stages only `js/version.js` and, if later introduced, `sw.js`, keeping its `RELEASE` identical. Do not skip the hook. Without Windows PowerShell, including GitHub's web editor, apply the same increment manually.

## Verification

Open `tests/ui.html` through the same static server as the application. Tests cover rendering, search, reset, translations, the version footer, and layouts at 320 and 960 pixels. Automated Edge file tests require a separate browser profile and `--allow-file-access-from-files`.

On Windows, run from the project root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tests/versioning.ps1
```

Version tests use an isolated ignored `.test-version-*` repository. They check initialization, increments, unstaged-edit protection, rejected-commit retries, rollover, and optional service-worker synchronization. Tests require no extra libraries.

## GitHub Pages

The live URL is https://pkristofik49.github.io/SMT/. On every push to `main`, the workflow copies only `index.html`, `styles.css`, `js/`, `vendor/`, and `icons/` into `_site/` and deploys that artifact. No dependencies are installed and nothing is built. Tests, hooks, and documentation are excluded. Manual deployment is available through Actions → Deploy to GitHub Pages → Run workflow. Settings → Pages → Source must be **GitHub Actions**.

## Maintenance

Keep identifiers, comments, and test descriptions in English. Keep `README.md` in English and `README_CZ.md` in Czech, updating corresponding content in both in the same change. Minimize dependencies: explain the need and the alternative before adding any library or development dependency, and wait for explicit user approval. Full rules are in `AGENTS.md`.
