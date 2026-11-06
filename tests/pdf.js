/* Integration tests use a generated valid single-page PDF without external libraries. */
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
    throw new Error('Timed out waiting for PDF state');
  }
  const makePdf = () => {
    const content = 'BT /F1 20 Tf 40 150 Td (Small Tools PDF test) Tj ET';
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += 'xref\n0 6\n0000000000 65535 f \n';
    offsets.forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
    return pdf + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  };
  try {
    await until(() => frame.contentDocument?.querySelectorAll('.tool-card').length === 8);
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    for (const registration of await win.navigator.serviceWorker.getRegistrations()) await registration.unregister();
    const urls = new Set();
    const createUrl = win.URL.createObjectURL.bind(win.URL);
    const revokeUrl = win.URL.revokeObjectURL.bind(win.URL);
    win.URL.createObjectURL = blob => { const url = createUrl(blob); urls.add(url); return url; };
    win.URL.revokeObjectURL = url => { urls.delete(url); revokeUrl(url); };
    Object.defineProperty(win.navigator, 'pdfViewerEnabled', { configurable: true, value: true });
    doc.querySelector('a[href="#/pdf-viewer"]').click();
    await until(() => doc.querySelector('.pdf-page'));
    check(doc.querySelector('.pdf-empty') && !doc.querySelector('.pdf-preview'), 'The PDF tool starts without a selected document');
    const select = file => {
      const input = doc.querySelector('input[type="file"]');
      const transfer = new win.DataTransfer();
      if (file) transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new win.Event('change', { bubbles: true }));
    };
    const pdf = makePdf();
    const file = new win.File([pdf], 'example.pdf', { type: '' });
    select(file);
    await until(() => doc.querySelector('.pdf-preview'));
    const firstUrl = doc.querySelector('.pdf-open').href;
    const response = await win.fetch(firstUrl);
    check(response.headers.get('Content-Type') === 'application/pdf' && await response.text() === pdf, 'The original PDF is exposed locally with the correct MIME type');
    check(doc.querySelector('.pdf-preview').src === firstUrl && doc.querySelector('.pdf-name').textContent === 'example.pdf', 'The embedded viewer receives the selected document');
    check(doc.querySelector('.pdf-open').target === '_blank' && doc.querySelector('.pdf-download').download === 'example.pdf', 'Open and download alternatives are available');
    select();
    await pause();
    check(doc.querySelector('.pdf-open').href === firstUrl, 'Cancelling the picker preserves the current PDF');
    select(new win.File(['not a PDF'], 'fake.pdf', { type: 'application/pdf' }));
    await until(() => doc.querySelector('.qr-error'));
    check(doc.querySelector('.pdf-open').href === firstUrl, 'An invalid file is rejected without losing the previous document');
    select(file);
    await until(() => doc.querySelector('.pdf-open').href !== firstUrl);
    check(urls.size === 1 && !urls.has(firstUrl), 'Reselecting the same file replaces and releases the previous URL');
    for (const width of [320, 960]) {
      frame.width = width;
      await pause();
      check(doc.documentElement.scrollWidth <= win.innerWidth, 'The PDF tool fits at ' + width + 'px');
    }
    doc.querySelector('.pdf-clear').click();
    await until(() => doc.querySelector('.pdf-empty'));
    check(urls.size === 0, 'Closing the PDF releases its temporary URL');
    const delayed = new win.File([pdf], 'delayed.pdf');
    let resolveHeader;
    delayed.slice = () => ({ text: () => new Promise(resolve => { resolveHeader = resolve; }) });
    select(delayed);
    await until(() => resolveHeader);
    doc.querySelector('.pdf-clear').click();
    resolveHeader('%PDF-1.4\n');
    await pause();
    check(!doc.querySelector('.pdf-document') && urls.size === 0, 'Closing during loading discards late results');
    select(file);
    await until(() => doc.querySelector('.pdf-preview'));
    doc.querySelector('.back-link').click();
    await until(() => doc.querySelectorAll('.tool-card').length === 8);
    check(urls.size === 0, 'Returning to the menu releases the selected document');
    Object.defineProperty(win.navigator, 'pdfViewerEnabled', { configurable: true, value: false });
    win.location.hash = '#/pdf-viewer';
    await until(() => doc.querySelector('.pdf-page'));
    select(file);
    await until(() => doc.querySelector('.pdf-open'));
    check(!doc.querySelector('.pdf-preview') && !!doc.querySelector('.pdf-download'), 'Browsers without embedded PDF support receive open and download alternatives');
    doc.querySelector('.back-link').click();
    await until(() => doc.querySelectorAll('.tool-card').length === 8);
    check(urls.size === 0, 'Fallback viewing also cleans up temporary URLs');
    lines.push('\nALL TESTS PASSED');
  } catch (error) {
    lines.push('FAIL ' + error.stack);
  } finally {
    document.getElementById('results').textContent = lines.join('\n');
  }
})();
