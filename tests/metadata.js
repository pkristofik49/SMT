/* Real EXIF/XMP/IPTC parsing fixtures; only cancellation and partial-error paths are simulated. */
(async () => {
  const frame = document.getElementById('application');
  const lines = [];
  const check = (condition, name) => {
    if (!condition) throw new Error(name);
    lines.push('PASS ' + name);
  };
  const pause = () => new Promise(resolve => setTimeout(resolve, 50));
  async function until(condition) {
    for (let attempt = 0; attempt < 200; attempt++) {
      if (await condition()) return;
      await pause();
    }
    throw new Error('Timed out waiting for metadata');
  }
  try {
    await until(() => frame.contentDocument?.querySelectorAll('.tool-card').length === 5);
    const win = frame.contentWindow;
    const doc = frame.contentDocument;
    for (const registration of await win.navigator.serviceWorker.getRegistrations()) await registration.unregister();
    doc.querySelector('a[href="#/photo-metadata"]').click();
    await until(() => doc.querySelector('.metadata-page'));
    check(!doc.querySelector('.metadata-file'), 'The tool starts without accessing a photo');
    const urls = new Set();
    const createUrl = win.URL.createObjectURL.bind(win.URL);
    const revokeUrl = win.URL.revokeObjectURL.bind(win.URL);
    win.URL.createObjectURL = blob => { const url = createUrl(blob); urls.add(url); return url; };
    win.URL.revokeObjectURL = url => { urls.delete(url); revokeUrl(url); };
    const canvas = doc.createElement('canvas');
    canvas.width = 32; canvas.height = 16;
    const jpegBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
    const jpeg = SmallToolsMetadataFixtures.jpeg(new Uint8Array(await jpegBlob.arrayBuffer()));
    const photo = new win.File([jpeg], 'fixture.jpg', { type: 'image/jpeg', lastModified: 1760000000000 });
    const select = file => {
      const input = doc.querySelector('input[type="file"]');
      const transfer = new win.DataTransfer();
      if (file) transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new win.Event('change', { bubbles: true }));
    };
    const report = async () => {
      await win.Vue.nextTick();
      await until(() => doc.querySelector('.metadata-export'));
      return (await win.fetch(doc.querySelector('.metadata-export').href)).json();
    };
    select(photo);
    let data = await report();
    check(data.file.name === 'fixture.jpg' && data.file.byteSize === jpeg.length && data.file.lastModified === new Date(photo.lastModified).toISOString(), 'Native file details are separate from embedded metadata');
    check(data.metadata.ifd0.Make === 'Fixture Camera' && data.metadata.ifd0.Model === 'Fixture Model', 'The real parser extracts camera make and model from EXIF');
    check(data.metadata.exif.DateTimeOriginal === '2026:11:09 10:20:30' && data.metadata.exif.ExposureTime === 0.008, 'Capture time and exposure metadata are preserved');
    check(data.metadata.ifd0.ImageWidth === 640 && data.metadata.ifd1.ImageWidth === 160, 'Main-image and thumbnail tags remain separate');
    check(data.metadata.gps.GPSLatitude.join() === '50,5,30' && data.metadata.gps.GPSLongitudeRef === 'E', 'GPS tags and coordinate components are included');
    check(data.metadata.iptc.ObjectName === 'Fixture title' && data.metadata.iptc.Keywords.join() === 'first,second', 'IPTC captions and repeated keywords are included');
    check(data.metadata.xmpRaw.includes('XMP Camera') && JSON.stringify(data.metadata.dc).includes('Long metadata'), 'Both decoded XMP fields and the original XMP packet are retained');
    check(data.metadata.exif['59999'] === 'Unknown vendor tag', 'Unknown numeric EXIF tags are not discarded');
    check(data.metadata.exif.MakerNote.encoding === 'hex' && data.metadata.exif.MakerNote.data === '010203040506', 'MakerNote binary data is exported without truncation');
    check(data.metadata.exif.UserComment.byteLength > 8 && data.parser.version === '7.1.3', 'User comments and parser provenance are included');
    await until(() => doc.querySelector('.metadata-preview')?.naturalWidth === 32);
    check(!doc.querySelector('.metadata-table img, .metadata-table script'), 'Metadata values render as text without executing embedded markup');
    check(doc.querySelector('.metadata-table details pre')?.textContent.length > 240, 'Long values are available in full through expandable rows');
    const search = doc.getElementById('metadata-search');
    search.value = 'GPSLatitude';
    search.dispatchEvent(new win.Event('input', { bubbles: true }));
    await pause();
    check([...doc.querySelectorAll('.metadata-table tbody tr')].every(row => row.textContent.includes('GPSLatitude')), 'Metadata search filters tag names and values');
    search.value = '';
    search.dispatchEvent(new win.Event('input', { bubbles: true }));
    for (const width of [320, 960]) {
      frame.width = width;
      await pause();
      check(doc.documentElement.scrollWidth <= win.innerWidth, 'Metadata tables fit at ' + width + 'px');
    }
    const firstUrl = doc.querySelector('.metadata-export').href;
    select();
    await pause();
    check(doc.querySelector('.metadata-export').href === firstUrl, 'Cancelling file selection preserves the previous report');
    select(photo);
    await until(() => doc.querySelector('.metadata-export')?.href !== firstUrl && !!doc.querySelector('.metadata-export'));
    check(!urls.has(firstUrl) && urls.size === 2, 'Reselecting the same photo releases old preview and export URLs');
    const png = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    select(new win.File([png], 'plain.png', { type: 'image/png' }));
    data = await report();
    check(!!data.metadata.ihdr && !data.metadata.gps && !data.metadata.exif, 'PNG headers are read without inventing missing camera or GPS metadata');
    select(new win.File([SmallToolsMetadataFixtures.tiff()], 'fixture.tiff', { type: 'image/tiff' }));
    data = await report();
    check(data.metadata.ifd0.Make === 'Fixture Camera', 'TIFF metadata is readable even if the browser cannot preview the image');
    select(new win.File(['not a supported image'], 'broken.jpg', { type: 'image/jpeg' }));
    data = await report();
    check(Object.keys(data.metadata).length === 0 && data.issues.length > 0 && doc.querySelector('.qr-notice'), 'Unreadable input reports a limitation separately from native file attributes');
    const parse = win.exifr.parse;
    win.exifr.parse = async () => ({ ifd0: { Make: 'Partial fixture' }, errors: ['Some tags failed'] });
    select(photo);
    data = await report();
    check(data.metadata.ifd0.Make === 'Partial fixture' && data.issues.includes('Some tags failed'), 'Partial parses retain available fields and expose reading issues');
    let resolveParse;
    win.exifr.parse = () => new Promise(resolve => { resolveParse = resolve; });
    select(photo);
    await until(() => resolveParse);
    doc.querySelector('.metadata-clear').click();
    resolveParse({ ifd0: { Make: 'Late fixture' } });
    await pause();
    check(!doc.querySelector('.metadata-file') && urls.size === 0, 'Closing during parsing discards late results and releases resources');
    win.exifr.parse = parse;
    select(photo);
    await report();
    doc.querySelector('.back-link').click();
    await until(() => doc.querySelectorAll('.tool-card').length === 5);
    check(urls.size === 0, 'Leaving the metadata tool releases all selected-file resources');
    lines.push('\nALL TESTS PASSED');
  } catch (error) {
    lines.push('FAIL ' + error.stack);
  } finally {
    frame.src = 'about:blank';
    document.getElementById('results').textContent = lines.join('\n');
  }
})();
