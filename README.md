# SMT

Small tools — everyday utilities

[Czech version](README_CZ.md) · [Live application](https://pkristofik49.github.io/SMT/)

A Vue SPA with a two-column tool menu (one column on mobile). The menu contains only the five implemented tools: a QR reader, a local PDF viewer, a compass, a spirit level, and a photo metadata reader. Search matches names, categories, and descriptions regardless of case and Czech diacritics, and offers a reset when nothing matches.

## QR reader

Open the first tile or `#/qr-reader`, then select **Start camera** and allow camera access. The app requests the rear-facing camera without microphone access. After decoding the first QR code, it stops the camera and displays the exact decoded text, including line breaks. The result is rendered as text; HTML is not executed and links are not opened automatically. Start another scan with the same button. No image or result is uploaded or saved to browser storage.

If the entire decoded content is a valid absolute HTTP or HTTPS URL, it is clickable and opens in a new browser tab only after a click. Surrounding whitespace is ignored for the destination, while the original content remains visible. Other text and URL schemes remain plain text.

**Choose photo** opens the device's image picker. The selected image is decoded locally with the same native detector, without requesting camera permission. Selecting a photo stops any running camera. The first detected QR code is displayed with the same clickable-URL behavior. Missing QR codes and unreadable or unsupported image formats have localized messages. The same file can be selected again; cancelling the picker leaves the current result unchanged. Loading can be cancelled, and temporary image URLs are released after completion, cancellation, or navigation. Photo scanning is also available when camera access APIs are unavailable, provided the browser supports native QR detection. No library or server upload is used.

The implementation uses only native `BarcodeDetector` with the `qr_code` format and `getUserMedia`. Availability is checked before requesting the camera. Supported browsers include Chrome on Android; Safari on iPhone is currently unsupported and receives an explanatory message. Camera access requires HTTPS or localhost; direct file previews show a notice. Permission denial, missing or busy cameras, and interrupted streams have localized messages. Stopping, returning to the menu, hiding the page, or leaving it releases the camera, including a camera granted after cancellation. Browser Back and direct hash links are supported.

The reader is included in the PWA cache and opens offline after the initial complete online load. Actual camera and decoding support still depend on the browser and device. No QR-decoding library has been added.

## PDF viewer

Open the second tile or `#/pdf-viewer`, then select **Choose PDF**. The document stays on the device and is displayed through the browser's built-in PDF viewer without another library or upload. The filename, an open-in-new-tab link, and a download link are available. If embedded PDF viewing is disabled or unsupported, use these links to open it in the browser or a device PDF app. Page navigation, zoom, password prompts, and rendering depend on the native viewer; a physical-phone check is still required.

The app checks the PDF header in the first 1024 bytes; this identifies the format but does not validate the entire document. Invalid selections show an error and preserve the previous document. The same file can be selected again, cancelling the picker keeps the current document, and closing or leaving the tool releases its temporary URL. Files are not stored in the PWA cache or browser storage and must be selected again after reloading. The tool itself is cached for offline use.

## Compass

Open the third tile or `#/compass` and select **Start compass**. Hold the phone flat with its screen facing upwards. The compass shows the azimuth of the upper edge of the current screen and eight named cardinal/intercardinal directions. The dial rotates towards north, with screen rotation accounted for. The app uses native orientation events without another library or geolocation request; no sensor readings are uploaded or stored.

Sensor access starts only after a click. Browsers exposing `DeviceOrientationEvent.requestPermission` are asked for absolute orientation permission, including magnetometer access where supported. Safari's `webkitCompassHeading` is supported; other browsers must provide absolute orientation angles. Relative gyroscope angles never stand in for a north-referenced heading. HTTPS or localhost and a compatible device with suitable sensors are required. Missing absolute data produces a retry message after eight seconds. Low Safari compass accuracy and tilted phones show calibration or positioning guidance instead of a heading. Sensor listeners are removed on stop, navigation, or when the app becomes hidden; restart explicitly afterwards.

The compass works in the cached offline PWA when device and browser sensor support are available. Accuracy and the north reference (magnetic or true) depend on the device; the app does not calculate magnetic declination. Nearby metals and magnets can interfere. Physical Android and iPhone checks are still required.

The display waits 1.5 seconds after the first usable sample, then applies shortest-arc angular smoothing across the north boundary. Each run keeps a single event source, avoiding jumps between providers. These measures reduce display jitter but do not correct an inaccurate north reference. The phone/OS supplies the compass orientation, generally combining the magnetometer with accelerometer and gyroscope data; the app does not use GPS. A stationary GPS position does not determine where the phone faces.

**Calibration and accuracy** shows the actual event source, the reported heading accuracy when available, and guidance for avoiding magnetic interference and helping the operating system calibrate its sensors. Safari readings with reported uncertainty above 20 degrees or a negative accuracy are withheld; tilts above 20 degrees require repositioning. Android usually exposes no accuracy estimate through these events, which is shown explicitly rather than inferred from a steady heading. Browser JavaScript has no standard command to trigger hardware compass calibration.

For a known north reference, **This direction is north** applies a visible manual angle correction after you point the upper screen edge towards north determined independently. It is an alignment offset, not sensor calibration or automatic north detection. It can be cleared and is always removed when stopping, restarting, pausing, or leaving the tool. **Reload heading** restarts collection and clears that offset. Incorrectly choosing a reference produces an incorrect direction; no correction is persisted across launches.

## Spirit level

Open the fourth tile or `#/level` and select **Start level**. Choose **Flat** to place the phone screen-up on the surface. Native orientation sensors provide two tilt angles in screen coordinates, displayed to one decimal place, and a bubble moving towards the higher edge. A green bubble indicates both axes are within 0.5 degrees of the reference. The bubble reaches its circular travel limit at a combined tilt of 10 degrees; the numeric angles continue to show larger tilts. In flat mode, near-vertical and face-down positions show positioning guidance instead of a misleading level reading.

Choose **On long edge** to rest the phone on its left or right long edge with the display facing you. This mode measures the lengthwise inclination of that edge rather than the screen plane, so a level long edge reads zero even with the screen vertical. A single-axis vial follows screen orientation: vertical in portrait and horizontal in landscape. The bubble moves towards the higher end, with travel limited at 10 degrees while the numeric angle continues. A green bubble indicates at most 0.5 degrees from the reference. Lying flat or resting on a short edge produces repositioning guidance. Either long edge is supported; the phone must remain approximately on its side (at least half the gravity component across its width).

**Set zero** uses the current surface as the reference; calibrate on a known level surface. Each mode has its own calibration, preserved when switching modes or stopping and restarting within the tool, and discarded when leaving it. **Reset calibration** resets only the current mode. Screen rotation transforms flat readings and their reference; edge mode keeps the same lengthwise angle while rotating the vial and its bubble direction. Native orientation permission is requested only after a click, without requesting absolute/magnetometer access. Relative orientation data suffices; heading and geolocation are not needed. Stopping, leaving, or hiding the page removes listeners and clears readings. Missing data times out after eight seconds; unavailable APIs and denied permission have explanatory messages.

The tool works in the cached offline PWA on supported phones over HTTPS or localhost, with no extra library or uploaded data. Device sensors, phone cases, and uneven backs can affect accuracy. Software tests use simulated sensors; physical-device accuracy still needs checking.

## Photo metadata

Open the fifth tile or `#/photo-metadata` and select a photo. The reader lists every field returned by the local **exifr 7.1.3 full UMD** parser, grouped by segment/namespace. It enables EXIF/TIFF image and thumbnail IFDs, GPS, interoperability tags, MakerNote and UserComment bytes, XMP including extended packets, IPTC, ICC, JFIF, and PNG IHDR where the format supports them. Unknown numeric tags and internal pointers are retained. Main-image and thumbnail tags remain separate; the original XMP packet is also included to preserve data that could collide during decoding. Numeric values and stored date strings are not replaced with translated descriptions or revived dates. The parser may add derived fields such as decimal GPS coordinates.

Supported containers are JPEG, TIFF, HEIC/HEIF, AVIF, and PNG, with different metadata coverage for each. This is a list of all **recognized** fields, not a guarantee of all data in a file. Proprietary MakerNotes can remain undecoded binary blocks, and unsupported blocks can be absent. In particular, the library cannot decompress PNG ICC profiles in the browser; HEIF XMP/IPTC coverage is limited. PNG text chunks and arbitrary proprietary formats are not universally supported. Partial errors are shown with the available fields, while an unsupported or unreadable file still shows its native file attributes. No recognized embedded fields does not prove that a file has no metadata. See the [upstream format support](https://github.com/MikeKovarik/exifr).

The separate file-information section contains the browser-provided filename, MIME type, byte size, and last-modified timestamp in UTC; the latter is not the photo's capture time. A native photo preview is optional: metadata can be read even when the browser cannot decode the image for display. Search filters names and values. Long values expand in full; binary blocks use hexadecimal data with their exact byte length. **Download JSON** exports the complete unfiltered report, including file attributes, parsed fields, original XMP, binary values, reading issues, and parser version.

Files are parsed locally, without uploads, CDN requests, or browser-storage persistence. The report describes the actual file passed by the picker; a gallery, editor, or sharing application might already have removed or changed metadata. Selection can be cancelled, the same file can be selected again, and closing or leaving the tool releases preview/export URLs and discards late results. The reader and parser are cached for offline use. The exifr dependency was explicitly approved by the user; no package manager or build step was added. `vendor/EXIFR-NOTICE.txt` records its source and package-integrity verification, and `vendor/EXIFR-LICENSE` contains its MIT licence.

## Running

Open `index.html` in a current browser or serve the project directory with an existing static HTTP server, such as IIS. Classic deferred scripts and relative paths support both local files and `/SMT/` on GitHub Pages. No package manager, build step, Node.js, router, or UI library is needed.

The external libraries are **Vue 3.5.45**, stored locally in `vendor/vue.global.prod.js`, and the user-approved **exifr 7.1.3**, stored in `vendor/exifr-7.1.3.umd.js`. Their MIT licences are in `vendor/VUE-LICENSE` and `vendor/EXIFR-LICENSE`. All application assets are local: there are no CDN or font requests. After downloading, the application runs from disk without internet. The website also supports installation as a PWA and offline startup after its first complete online load.

## Web and PWA

Use the ordinary website or open [Small Tools](https://pkristofik49.github.io/SMT/) in Edge or Chrome and select the browser's install-app command. Supported devices can launch it in a standalone window. On iPhone or iPad, use Safari's Share → Add to Home Screen. Installation controls depend on the browser and device. No extra library, app store, or APK is required.

`manifest.webmanifest` defines a relative app ID, start URL, and scope, working both under `/SMT/` and at a local HTTP server root. Local PNG icons include 192 and 512 px application icons, a maskable 512 px icon, and a 180 px Apple touch icon. `scripts/generate-icons.ps1` reproduces them from the existing grid mark using Windows System.Drawing without additional dependencies.

`js/pwa.js` registers `sw.js` after page load. Service workers require HTTPS in production or localhost for development. Direct file previews still work as ordinary web pages but cannot register a worker or install offline support. After the worker finishes its first complete installation, the menu, search, QR reader, PDF viewer, compass, spirit level, photo metadata, translations, styles, and icons work offline, including after closing and reopening the app. PWA installation is optional for caching. Clearing browser site data or browser storage eviction can remove cached files; open the website online again to restore them.

Every release precaches the whole application shell. An incomplete download fails installation and preserves the running release. A complete update waits until all browser tabs and app windows using the previous worker close, then activates on reopening. There is no forced reload or `skipWaiting()`. Returning to a visible app or reconnecting checks for updates. Cache cleanup affects only this application's old releases within its scope. Keep new runtime assets in `SHELL` and keep the worker's `RELEASE` identical to the application version.

## Structure

```text
index.html                   Vue template and script entry points
styles.css                   Responsive styling
js/app.js                    State, tool catalogue, search, and icons
js/qr-reader.js              Native camera and QR-reader component
js/pdf-viewer.js             Native local PDF-viewer component
js/compass.js                Native sensor compass component
js/level.js                  Two-axis native spirit level and calibration
js/photo-metadata.js         Local photo metadata and JSON export
js/translations.js           Localized application text (Czech)
js/version.js                Application version
js/pwa.js                    Service-worker registration and update checks
manifest.webmanifest         Installation metadata
sw.js                        Versioned offline application shell
vendor/                      Local Vue and exifr distributions and licences
icons/                       Application icon
.githooks/pre-commit          Tracked versioning hook
scripts/update-version.ps1   Version update script
scripts/generate-icons.ps1   Reproducible installation icons
tests/ui.html                Browser integration tests
tests/qr.html                QR-reader lifecycle integration tests
tests/pdf.html               PDF selection and lifecycle tests
tests/compass.html           Compass heading and permission tests
tests/level.html             Spirit level, calibration, and lifecycle tests
tests/metadata.html          Real photo metadata parsing and lifecycle tests
tests/metadata-fixtures.js   Generated EXIF/GPS/XMP/IPTC binary fixtures
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

Use `powershell -NoProfile -ExecutionPolicy Bypass -File tests/run-pwa.ps1 -TestPage pdf.html` to test a generated valid single-page PDF, local file bytes and MIME type, viewer and fallback links, invalid selections, repeated selection, cancellation, responsive layout, and temporary-URL cleanup. Native PDF rendering controls are supplied by the browser.

Use `powershell -NoProfile -ExecutionPolicy Bypass -File tests/run-pwa.ps1 -TestPage compass.html` for simulated orientation-event tests: permission denial, cardinal headings, Safari heading and accuracy, relative-data rejection, screen rotation, tilt, missing data, cancellation, pause, and navigation cleanup. These tests verify software behavior, not physical sensor accuracy.

Use `powershell -NoProfile -ExecutionPolicy Bypass -File tests/run-pwa.ps1 -TestPage level.html` for simulated two-axis readings, bubble direction and limits, calibration and reset, rotation of readings and reference, half-degree tolerance, face-down rejection, permission handling, missing data, and lifecycle cleanup.

Use `powershell -NoProfile -ExecutionPolicy Bypass -File tests/run-pwa.ps1 -TestPage metadata.html` for real generated JPEG EXIF/GPS/XMP/IPTC and TIFF/PNG parsing, thumbnail separation, unknown tags, full MakerNote bytes, original XMP, safe text rendering, search, JSON export, partial failures, cancellation, and URL cleanup. Only partial-error and cancellation paths use simulated parser responses. The PWA suite also parses and exports EXIF/GPS with the server unavailable. HEIC/AVIF device-picker behavior still requires representative real-device checks.

## GitHub Pages

The live URL is https://pkristofik49.github.io/SMT/. On every push to `main`, the workflow copies only `index.html`, `styles.css`, `manifest.webmanifest`, `sw.js`, `js/`, `vendor/`, and `icons/` into `_site/` and deploys that artifact. No dependencies are installed and nothing is built. Tests, hooks, and documentation are excluded. Manual deployment is available through Actions → Deploy to GitHub Pages → Run workflow. Settings → Pages → Source must be **GitHub Actions**.

## Maintenance

Keep identifiers, comments, and test descriptions in English. Keep `README.md` in English and `README_CZ.md` in Czech, updating corresponding content in both in the same change. Minimize dependencies: explain the need and the alternative before adding any library or development dependency, and wait for explicit user approval. Full rules are in `AGENTS.md`.
