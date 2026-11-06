# Project instructions

Adapted from https://github.com/pkristofik49/SMG/blob/main/AGENTS.md for this static Vue project.

- Keep code identifiers, comments, and test descriptions in English. Localized application text belongs in `js/translations.js` and is exempt from this rule. The static bilingual `noscript` fallback is also exempt.
- Use as few external libraries as possible. Prefer native browser APIs, standard language features, and existing project dependencies. Before adding any new external library or dependency, including development and build dependencies, explain why it is needed, describe the alternative without it, and ask the user for approval. Wait for explicit approval before installing it or adding it to the project.
- Keep `README.md` in English and `README_CZ.md` in Czech.
- Whenever either README changes, update the corresponding content in the other README in the same change. Keep features, behavior, commands, examples, links, and technical details consistent between both versions.
- Include both README files in documentation commits when their shared content changes.
- Display the application version from `js/version.js` in the main-menu footer, starting at `1.000` and increasing by `0.001` per commit. Keep `RELEASE` in `sw.js` identical to this version.
- Enable the tracked pre-commit hook with `git config core.hooksPath .githooks`. It must derive the next version from HEAD and stage only the version file and the service worker, when present. Do not skip the hook; stage any service-worker edits before committing. When hooks are unavailable, perform the same version increment manually in the commit.

## Adoption in SMT

Use classic deferred scripts, a local Vue distribution in `vendor/`, and relative asset paths, as in SMG. Do not introduce a package manager, build step, router, or UI library without the user's explicit approval. Preserve the two-column tool menu and single-column mobile layout.

Application versioning starts with the first commit containing `js/version.js`; existing commits are not renumbered. Enable the tracked hook in each checkout.

Support both the ordinary website and an installable PWA. Keep the relative manifest ID, start URL, scope, regular and maskable icons, and Apple touch icon working at `/SMT/` and a local server root. Keep every runtime asset in the service worker's `SHELL`. Precache releases completely, preserve the active release if an update download fails, and clean only this application's caches within its scope. Do not force activation with `skipWaiting()` or reload an open application. Updates activate after all clients of the previous release close. Preserve the ordinary web application when service workers are unavailable, including direct file previews. Verify web rendering, offline startup, and update behavior when changing PWA support.
