/* Camera and BarcodeDetector fixtures exercise lifecycle behavior without physical hardware. */
(async () => {
  const frame = document.getElementById('application');
  const lines = [];
  const tracks = [];
  const check = (passed, message) => {
    if (!passed) throw new Error(message);
    lines.push('PASS ' + message);
  };
  const pause = () => new Promise(resolve => setTimeout(resolve, 40));
  async function until(condition) {
    for (let attempt = 0; attempt < 200; attempt++) {
      if (condition()) return;
      await pause();
    }
    throw new Error('Timed out waiting for reader state');
  }

  try {
    await until(() => frame.contentDocument?.querySelectorAll('.tool-card').length === 7);
    const win = frame.contentWindow;
    const doc = frame.contentDocument;
    // PWA behavior is covered separately; isolate camera/navigation tests from its cache.
    for (const registration of await win.navigator.serviceWorker.getRegistrations()) await registration.unregister();
    let cameraCalls = 0;
    let decode = async () => [];
    let acquire;
    const makeStream = () => {
      const canvas = doc.createElement('canvas');
      canvas.width = canvas.height = 100;
      canvas.getContext('2d').fillRect(0, 0, 100, 100);
      const stream = canvas.captureStream(10);
      tracks.push(...stream.getTracks());
      return stream;
    };
    acquire = async () => makeStream();
    Object.defineProperty(win.navigator, 'mediaDevices', { configurable: true, value: {
      getUserMedia: constraints => {
        cameraCalls++;
        check(constraints.audio === false && constraints.video.facingMode.ideal === 'environment', 'Camera requests the rear lens without microphone access');
        return acquire();
      },
    } });
    const open = async () => {
      win.location.hash = '#/qr-reader';
      await until(() => doc.querySelector('.qr-page'));
      await until(() => !doc.querySelector('.qr-notice')?.textContent.includes(win.SmallToolsTranslations.cs['qr.capability.checking']));
    };
    const close = async () => {
      win.location.hash = '#/';
      await until(() => doc.querySelectorAll('.tool-card').length === 7);
    };
    delete win.BarcodeDetector;
    await open();
    check(doc.querySelector('.primary-button').disabled && cameraCalls === 0, 'Unsupported browsers receive feedback without a camera prompt');
    await close();
    win.BarcodeDetector = class {
      static async getSupportedFormats() { return ['qr_code']; }
      constructor(options) { check(options.formats.join() === 'qr_code', 'Detection is restricted to QR codes'); }
      detect(source) { check(['VIDEO', 'IMG'].includes(source.tagName), 'Detection reads a native video or image source'); return decode(source); }
    };
    await open();
    check(!doc.querySelector('.primary-button').disabled && cameraCalls === 0, 'Camera starts only after an explicit click');
    acquire = async () => { throw new win.DOMException('Denied', 'NotAllowedError'); };
    doc.querySelector('.primary-button').click();
    await until(() => doc.querySelector('.qr-error'));
    check(doc.querySelector('.qr-error').textContent === win.SmallToolsTranslations.cs['qr.error.permission'], 'Permission denial provides a localized retry message');
    acquire = async () => makeStream();
    const payload = '<img src=x onerror=alert(1)>\nhttps://example.com/\nWIFI:T:WPA;S:test;P:secret;;';
    decode = async () => [{ rawValue: payload }];
    doc.querySelector('.primary-button').click();
    await until(() => doc.querySelector('.qr-result-data'));
    check(doc.querySelector('.qr-result-data').textContent === payload && !doc.querySelector('.qr-result img, .qr-result a'), 'Decoded data is displayed exactly as plain text without executing HTML or opening links');
    check(tracks.every(track => track.readyState === 'ended'), 'Successful decoding releases every camera track');
    check(doc.querySelector('.camera-video').srcObject === null, 'Successful decoding detaches the video stream');
    for (const value of ['https://example.com/path?q=1#section', '  http://example.com/  ', 'javascript:alert(1)', 'data:text/html,test', '/relative/path', 'https://[invalid', 'https://example.com/\nadditional text']) {
      decode = async () => [{ rawValue: value }];
      doc.querySelector('.primary-button').click();
      await until(() => doc.querySelector('.qr-result-data')?.textContent === value);
      const link = doc.querySelector('.qr-result-link');
      if (value.trim().startsWith('https://example.com/path') || value.trim() === 'http://example.com/') {
        check(link?.href === new URL(value.trim()).href && link.target === '_blank' && link.rel.includes('noopener') && link.rel.includes('noreferrer'), 'HTTP(S) results provide a link in a separate browser tab');
      } else {
        check(!link, 'Other text, malformed URLs, and non-web schemes remain plain text');
      }
    }
    let resolveAcquisition;
    acquire = () => new Promise(resolve => { resolveAcquisition = resolve; });
    doc.querySelector('.primary-button').click();
    await until(() => resolveAcquisition);
    doc.querySelector('.secondary-button').click();
    const lateStream = makeStream();
    resolveAcquisition(lateStream);
    await pause();
    check(lateStream.getTracks().every(track => track.readyState === 'ended') && !doc.querySelector('.camera-active'), 'Stopping while permission is pending releases a late camera stream');
    acquire = async () => makeStream();
    decode = async () => [];
    doc.querySelector('.primary-button').click();
    await until(() => doc.querySelector('.camera-active'));
    await close();
    check(tracks.every(track => track.readyState === 'ended'), 'Returning to the menu stops the camera');
    await open();
    let resolveDetection;
    decode = () => new Promise(resolve => { resolveDetection = resolve; });
    doc.querySelector('.primary-button').click();
    await until(() => resolveDetection);
    await close();
    resolveDetection([{ rawValue: 'late result' }]);
    await pause();
    await open();
    check(!doc.querySelector('.qr-result'), 'A late result from a closed reader is discarded');
    decode = async () => [{ rawValue: '' }];
    doc.querySelector('.primary-button').click();
    await until(() => doc.querySelector('.qr-result'));
    check(doc.querySelector('.qr-result p').textContent === win.SmallToolsTranslations.cs['qr.emptyResult'], 'Empty decoded text is a valid result');
    const canvas = doc.createElement('canvas');
    canvas.width = canvas.height = 32;
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const photo = new win.File([blob], 'photo.png', { type: 'image/png' });
    const selectPhoto = file => {
      const input = doc.querySelector('input[type="file"]');
      const transfer = new win.DataTransfer();
      if (file) transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new win.Event('change', { bubbles: true }));
    };
    const activeUrls = new Set();
    const createObjectURL = win.URL.createObjectURL.bind(win.URL);
    const revokeObjectURL = win.URL.revokeObjectURL.bind(win.URL);
    win.URL.createObjectURL = value => { const url = createObjectURL(value); activeUrls.add(url); return url; };
    win.URL.revokeObjectURL = url => { activeUrls.delete(url); revokeObjectURL(url); };
    decode = async () => [];
    doc.querySelector('.primary-button').click();
    await until(() => doc.querySelector('.camera-active'));
    const callsBeforePhoto = cameraCalls;
    decode = async source => {
      check(source.tagName === 'IMG' && source.naturalWidth === 32, 'Photo detection receives a decoded local image');
      return [{ rawValue: 'https://example.com/photo' }];
    };
    selectPhoto(photo);
    await until(() => doc.querySelector('.qr-result-link')?.href === 'https://example.com/photo');
    check(cameraCalls === callsBeforePhoto && tracks.every(track => track.readyState === 'ended'), 'Selecting a photo stops the camera without requesting camera access');
    check(activeUrls.size === 0 && doc.querySelector('input[type="file"]').value === '', 'Successful photo decoding releases its URL and resets the picker');
    selectPhoto();
    await pause();
    check(doc.querySelector('.qr-result-link')?.href === 'https://example.com/photo', 'Cancelling file selection preserves the result');
    selectPhoto(photo);
    await until(() => doc.querySelector('.qr-result-link') && activeUrls.size === 0);
    check(activeUrls.size === 0, 'The same photo can be selected again');
    decode = async () => [];
    selectPhoto(photo);
    await until(() => doc.querySelector('.qr-error'));
    check(doc.querySelector('.qr-error').textContent === win.SmallToolsTranslations.cs['qr.error.noCodeInPhoto'] && activeUrls.size === 0, 'Photos without QR codes provide feedback and release resources');
    selectPhoto(new win.File(['not an image'], 'broken.png', { type: 'image/png' }));
    await until(() => doc.querySelector('.qr-error')?.textContent === win.SmallToolsTranslations.cs['qr.error.photo']);
    check(activeUrls.size === 0, 'Unreadable images provide feedback and release resources');
    let resolvePhoto;
    decode = () => new Promise(resolve => { resolvePhoto = resolve; });
    selectPhoto(photo);
    await until(() => resolvePhoto);
    doc.querySelector('.scanner-controls > .secondary-button').click();
    resolvePhoto([{ rawValue: 'cancelled photo' }]);
    await pause();
    check(!doc.querySelector('.qr-result') && activeUrls.size === 0, 'Cancelling photo decoding discards late results and releases resources');
    await close();
    Object.defineProperty(win.navigator, 'mediaDevices', { configurable: true, value: undefined });
    await open();
    check(doc.querySelector('.primary-button').disabled && !doc.querySelector('.photo-button').disabled, 'Photo reading remains available without camera APIs');
    decode = async () => [{ rawValue: 'photo without camera' }];
    selectPhoto(photo);
    await until(() => doc.querySelector('.qr-result-data')?.textContent === 'photo without camera');
    check(doc.documentElement.scrollWidth <= win.innerWidth, 'The reader fits a mobile viewport');
    await close();
    lines.push('\nALL TESTS PASSED');
  } catch (error) {
    lines.push('FAIL ' + error.stack);
  } finally {
    tracks.forEach(track => track.stop());
    document.getElementById('results').textContent = lines.join('\n');
  }
})();
