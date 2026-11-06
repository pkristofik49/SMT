/* Integration fixtures must run through serve-pwa.ps1 in an isolated browser profile. */
(async () => {
  'use strict';
  const lines = [];
  let failures = 0;
  const check = (name, passed) => {
    lines.push(`${passed ? 'PASS' : 'FAIL'} ${name}`);
    if (!passed) failures++;
  };
  const pause = () => new Promise(resolve => setTimeout(resolve, 50));
  async function until(condition) {
    for (let step = 0; step < 200; step++) {
      if (await condition()) return;
      await pause();
    }
    throw new Error('Timed out waiting for PWA state');
  }
  const root = new URL('../', location.href);
  const prefix = `small-tools:${root.href}:`;
  const frame = document.getElementById('application');
  const control = action => fetch(`/__pwa-test__/${action}`, { cache: 'no-store' });
  const loadApp = async path => {
    await new Promise(resolve => {
      frame.addEventListener('load', resolve, { once: true });
      frame.src = new URL(path, root).href;
    });
    await until(() => frame.contentDocument.querySelectorAll('.tool-card').length === 7 && !frame.contentDocument.querySelector('[v-cloak]'));
  };
  let registration;
  const unrelated = 'pwa-test-unrelated';
  try {
    await control('online');
    await control('release?version=v1');
    await loadApp('./');
    await until(async () => {
      registration = await navigator.serviceWorker.getRegistration(root.href);
      return registration?.active?.state === 'activated' && frame.contentWindow.navigator.serviceWorker.controller;
    });
    check('The ordinary website renders the tool menu with service-worker support', frame.contentDocument.querySelectorAll('.tool-card').length === 7);
    const manifest = await (await fetch(new URL('manifest.webmanifest', root))).json();
    check('The standalone manifest scopes installation to this project', new URL(manifest.id, root).href === root.href && new URL(manifest.scope, root).href === root.href && new URL(manifest.start_url, root).href === root.href && manifest.display === 'standalone');
    for (const icon of manifest.icons) {
      const image = new Image();
      image.src = new URL(icon.src, root).href;
      await image.decode();
      check('Installation icon has its declared dimensions: ' + icon.src, `${image.naturalWidth}x${image.naturalHeight}` === icon.sizes);
    }
    check('Manifest includes a maskable icon', manifest.icons.some(icon => icon.purpose === 'maskable' && icon.sizes === '512x512'));
    const cache = await caches.open(`${prefix}v1`);
    const resources = await cache.keys();
    check('The complete application shell includes the QR reader', resources.length === 14 && (await cache.match(new URL('js/qr-reader.js', root)))?.ok && (await cache.match(new URL('js/version.js', root)))?.ok);
    await caches.open(unrelated);
    await control('offline');
    check('The application server is unavailable during offline checks', (await fetch(new URL('not-cached.txt', root))).status === 503);
    await loadApp('./?offline=1#/');
    check('A fresh navigation starts offline with query and hash', frame.contentDocument.querySelectorAll('.tool-card').length === 7);
    const search = frame.contentDocument.getElementById('tool-search');
    search.value = 'PREVODNIK';
    search.dispatchEvent(new frame.contentWindow.Event('input', { bubbles: true }));
    await until(() => frame.contentDocument.querySelectorAll('.tool-card').length === 1);
    check('Search remains functional offline', frame.contentDocument.querySelector('.tool-card').getAttribute('aria-labelledby') === 'title-units');
    await loadApp('./index.html?offline=2#/');
    check('Direct index navigation also starts offline', frame.contentDocument.querySelector('.site-footer').textContent.includes(frame.contentWindow.SmallToolsVersion));
    frame.contentDocument.querySelector('a[href="#/qr-reader"]').click();
    await until(() => frame.contentDocument.querySelector('.qr-page'));
    check('The QR reader opens offline without requesting camera access', !!frame.contentDocument.querySelector('.camera-video') && !frame.contentDocument.querySelector('.camera-active'));
    frame.contentDocument.querySelector('.back-link').click();
    await until(() => frame.contentDocument.querySelectorAll('.tool-card').length === 7);
    for (const resource of resources) {
      check('Offline resource: ' + new URL(resource.url).pathname, (await fetch(resource.url)).ok);
    }
    check('Unrelated requests are not replaced with cached application HTML', (await fetch('/outside-project')).status === 503);
    await control('online');
    await control('release?version=v2');
    await registration.update();
    await until(() => registration.waiting?.state === 'installed');
    check('A complete update waits while the existing release remains active', !!registration.active && !!registration.waiting && (await caches.keys()).includes(`${prefix}v1`) && (await caches.keys()).includes(`${prefix}v2`));
    check('The update does not reload the running application', frame.contentWindow.location.search === '?offline=2');
    await control('release?version=v3&fail=true');
    await registration.update();
    await until(() => !registration.installing);
    check('An incomplete update preserves the active release and discards its cache', (await caches.keys()).includes(`${prefix}v1`) && !(await caches.keys()).includes(`${prefix}v3`));
    check('Unrelated cache namespaces are preserved', (await caches.keys()).includes(unrelated));
  } catch (error) {
    failures++;
    lines.push(`FAIL ${error.stack}`);
  } finally {
    await control('online');
    await control('release?version=v1');
    if (registration) await registration.unregister();
    frame.src = 'about:blank';
    for (const name of await caches.keys()) {
      if (name.startsWith(prefix) || name === unrelated) await caches.delete(name);
    }
    lines.push(`\nFailures: ${failures}`);
    document.getElementById('results').textContent = lines.join('\n');
    document.title = failures ? 'FAIL PWA' : 'PASS PWA';
  }
})();
