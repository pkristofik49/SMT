# SMT

Small tools — everyday utilities

[Czech version](README_CZ.md) · [Live application](https://pkristofik49.github.io/SMT/)

A Vue SPA with a two-column tool menu (one column on mobile). The first working tool is a camera QR reader; six placeholder cards cover text, JSON, unit conversions, colours, dates, and passwords. Search matches names, categories, and descriptions regardless of case and Czech diacritics, and offers a reset when nothing matches.

## QR reader

Open the first tile or `#/qr-reader`, then select **Start camera** and allow camera access. The app requests the rear-facing camera without microphone access. After decoding the first QR code, it stops the camera and displays the exact decoded text, including line breaks. The result is rendered as text; HTML is not executed and links are not opened automatically. Start another scan with the same button. No image or result is uploaded or saved to browser storage.

The implementation uses only native `BarcodeDetector` with the `qr_code` format and `getUserMedia`. Availability is checked before requesting the camera. Supported browsers include Chrome on Android; Safari on iPhone is currently unsupported and receives an explanatory message. Camera access requires HTTPS or localhost; direct file previews show a notice. Permission denial, missing or busy cameras, and interrupted streams have localized messages. Stopping, returning to the menu, hiding the page, or leaving it releases the camera, including a camera granted after cancellation. Browser Back and direct hash links are supported.

The reader is included in the PWA cache and opens offline after the initial complete online load. Actual camera and decoding support still depend on the browser and device. No QR-decoding library has been added.

## Running

Open `index.html` in a current browser or serve the project directory with an existing static HTTP server, such as IIS. Classic deferred scripts and relative paths support both local files and `/SMT/` on GitHub Pages. No package manager, build step, Node.js, router, or UI library is needed.

The only external library is **Vue 3.5.45**, stored locally in `vendor/vue.global.prod.js`, with its MIT licence in `vendor/VUE-LICENSE`. All application assets are local: there are no CDN or font requests. After downloading, the application runs from disk without internet. The website also supports installation as a PWA and offline startup after its first complete online load.

## Web and PWA

Use the ordinary website or open [Small Tools](https://pkristofik49.github.io/SMT/) in Edge or Chrome and select the browser's install-app command. Supported devices can launch it in a standalone window. On iPhone or iPad, use Safari's Share → Add to Home Screen. Installation controls depend on the browser and device. No extra library, app store, or APK is required.

`manifest.webmanifest` defines a relative app ID, start URL, and scope, working both under `/SMT/` and at a local HTTP server root. Local PNG icons include 192 and 512 px application icons, a maskable 512 px icon, and a 180 px Apple touch icon. `scripts/generate-icons.ps1` reproduces them from the existing grid mark using Windows System.Drawing without additional dependencies.

`js/pwa.js` registers `sw.js` after page load. Service workers require HTTPS in production or localhost for development. Direct file previews still work as ordinary web pages but cannot register a worker or install offline support. After the worker finishes its first complete installation, the menu, search, QR reader, translations, styles, and icons work offline, including after closing and reopening the app. The other tools remain placeholders. PWA installation is optional for caching. Clearing browser site data or browser storage eviction can remove cached files; open the website online again to restore them.

Every release precaches the whole application shell. An incomplete download fails installation and preserves the running release. A complete update waits until all browser tabs and app windows using the previous worker close, then activates on reopening. There is no forced reload or `skipWaiting()`. Returning to a visible app or reconnecting checks for updates. Cache cleanup affects only this application's old releases within its scope. Keep new runtime assets in `SHELL` and keep the worker's `RELEASE` identical to the application version.

## Structure

```text
index.html                   Vue template and script entry points
styles.css                   Responsive styling
js/app.js                    State, tool catalogue, search, and icons
js/qr-reader.js              Native camera and QR-reader component
js/translations.js           Localized application text (Czech)
js/version.js                Application version
js/pwa.js                    Service-worker registration and update checks
manifest.webmanifest         Installation metadata
sw.js                        Versioned offline application shell
vendor/                      Local Vue distribution and licence
icons/                       Application icon
.githooks/pre-commit          Tracked versioning hook
scripts/update-version.ps1   Version update script
scripts/generate-icons.ps1   Reproducible installation icons
tests/ui.html                Browser integration tests
tests/qr.html                QR-reader lifecycle integration tests
tests/versioning.ps1         Isolated version-hook tests
tests/pwa.html               Offline and update integration tests
tests/serve-pwa.ps1          Local PWA test server
tests/run-pwa.ps1            Isolated headless Edge test runner
.github/workflows/deploy.yml GitHub Pages deployment
AGENTS.md                    Maintenance rules
```

Add tool metadata in `js/app.js` and its name, category, and description in `js/translations.js`. All interface text, including page metadata and accessible labels, belongs in the translations file. The bilingual `noscript` fallback stays in HTML because scripts cannot load when JavaScript is disabled.

## Versioning

The footer uses the format **SMT · 1.000** (example). The first commit containing `js/version.js` starts at `1.000`; every subsequent commit adds `0.001` (`1.999` becomes `2.000`). Earlier commits are not renumbered.

Enable the tracked hook after cloning:

```sh
git config core.hooksPath .githooks
```

The hook uses Windows PowerShell and derives the next version from committed HEAD. Stage version-file and service-worker edits first; unstaged edits stop the hook. A failed commit can be retried without consuming a version. The hook stages only `js/version.js` and `sw.js`, keeping `RELEASE` identical. Do not skip the hook. Without Windows PowerShell, including GitHub's web editor, apply the same increment manually.

## Verification

Open `tests/ui.html` through the same static server as the application. Tests cover rendering, search, reset, translations, the version footer, and layouts at 320 and 960 pixels. Automated Edge file tests require a separate browser profile and `--allow-file-access-from-files`.

On Windows, run from the project root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tests/versioning.ps1
```

Version tests use an isolated ignored `.test-version-*` repository. They check initialization, increments, unstaged-edit protection, rejected-commit retries, rollover, and optional service-worker synchronization. Tests require no extra libraries.

For PWA integration tests, start `powershell -NoProfile -ExecutionPolicy Bypass -File tests/serve-pwa.ps1` in one terminal and run `powershell -NoProfile -ExecutionPolicy Bypass -File tests/run-pwa.ps1` in another. They use `http://localhost:8766/SMT/` and a fresh isolated headless Edge profile. Stop the server with Ctrl+C afterwards. Passing `-BasePath /` to both scripts tests a local server root. The server's offline and release control endpoints are test fixtures only.

PWA tests cover the manifest, actual icon dimensions, full shell precaching, offline startup and search while the server returns 503, waiting complete updates, failed incomplete updates, and preservation of unrelated caches. Actual installation through browser or phone UI requires a manual device check.

With the same test server running, execute `powershell -NoProfile -ExecutionPolicy Bypass -File tests/run-pwa.ps1 -TestPage qr.html` to test QR-reader behavior using simulated camera streams and a simulated detector. Tests cover unsupported browsers, permission denial, plain-text results, empty results, cancellation, navigation, and late asynchronous results. They do not verify optical decoding through a physical mobile camera; test that manually on a supported phone.

## GitHub Pages

The live URL is https://pkristofik49.github.io/SMT/. On every push to `main`, the workflow copies only `index.html`, `styles.css`, `manifest.webmanifest`, `sw.js`, `js/`, `vendor/`, and `icons/` into `_site/` and deploys that artifact. No dependencies are installed and nothing is built. Tests, hooks, and documentation are excluded. Manual deployment is available through Actions → Deploy to GitHub Pages → Run workflow. Settings → Pages → Source must be **GitHub Actions**.

## Maintenance

Keep identifiers, comments, and test descriptions in English. Keep `README.md` in English and `README_CZ.md` in Czech, updating corresponding content in both in the same change. Minimize dependencies: explain the need and the alternative before adding any library or development dependency, and wait for explicit user approval. Full rules are in `AGENTS.md`.
