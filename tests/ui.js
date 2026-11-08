/* Browser integration tests use an isolated application frame. */
(async () => {
  const frame = document.getElementById('application');
  const results = document.getElementById('results');
  const messages = [];
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
    messages.push('PASS ' + message);
    results.textContent = messages.join('\n');
  };
  const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

  try {
    const deadline = Date.now() + 10000;
    while (!frame.contentDocument?.querySelector('.tool-card') || frame.contentDocument.querySelector('[v-cloak]')) {
      if (Date.now() > deadline) throw new Error('Application did not mount. Use HTTP or allow file access.');
      await settle();
    }
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    const cards = () => [...doc.querySelectorAll('.tool-card')];
    const search = doc.getElementById('tool-search');
    const filter = async (value) => {
      search.value = value;
      search.dispatchEvent(new win.Event('input', { bubbles: true }));
      await settle();
    };
    assert(cards().length === 4 && doc.querySelector('a[href="#/qr-reader"]') && doc.querySelector('a[href="#/pdf-viewer"]') && doc.querySelector('a[href="#/compass"]') && doc.querySelector('a[href="#/level"]'), 'Only the four implemented tools render');
    assert(!doc.querySelector('[v-cloak]'), 'Vue mounts the classic-script template');
    assert(doc.title === win.SmallToolsTranslations.cs['page.title'], 'Page metadata uses translations');
    assert(doc.querySelector('.site-footer').textContent.trim() === 'SMT · ' + win.SmallToolsVersion, 'Footer displays the application version');
    await filter('CTECKA');
    assert(cards().length === 1 && cards()[0].getAttribute('aria-labelledby') === 'title-qr', 'Search ignores case and Czech diacritics');
    await filter('  PDF  ');
    assert(cards().length === 1 && cards()[0].getAttribute('aria-labelledby') === 'title-pdf', 'Search trims surrounding whitespace');
    await filter('DOKUMENTY');
    assert(cards().length === 1 && cards()[0].getAttribute('aria-labelledby') === 'title-pdf', 'Search includes tool categories');
    await filter('azimut');
    assert(cards().length === 1 && cards()[0].getAttribute('aria-labelledby') === 'title-compass', 'Search includes descriptions');
    await filter('no-such-tool-12345');
    assert(cards().length === 0 && doc.querySelector('.empty-state'), 'An empty search provides feedback');
    doc.querySelector('.empty-state button').click();
    await settle();
    assert(cards().length === 4 && search.value === '', 'Reset restores the complete menu');
    for (const width of [320, 960]) {
      frame.width = width;
      await settle();
      const columns = win.getComputedStyle(doc.querySelector('.tool-grid')).gridTemplateColumns.split(' ').length;
      assert(columns === (width === 320 ? 1 : 2), 'Grid column count is correct at ' + width + 'px');
      assert(doc.documentElement.scrollWidth <= win.innerWidth, 'No horizontal overflow at ' + width + 'px');
    }
    document.body.dataset.result = 'passed';
    results.textContent = messages.join('\n') + '\nALL TESTS PASSED';
  } catch (error) {
    document.body.dataset.result = 'failed';
    results.textContent = messages.join('\n') + '\nFAIL ' + error.message;
  }
})();
