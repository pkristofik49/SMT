/* Simulated orientation events test leveling without physical hardware. */
(async () => {
  const frame = document.getElementById('application');
  const lines = [];
  const check = (condition, name) => {
    if (!condition) throw new Error(name);
    lines.push('PASS ' + name);
  };
  const pause = () => new Promise(resolve => setTimeout(resolve, 50));
  async function until(condition) {
    for (let attempt = 0; attempt < 220; attempt++) {
      if (condition()) return;
      await pause();
    }
    throw new Error('Timed out waiting for spirit level state');
  }
  try {
    await until(() => frame.contentDocument?.querySelectorAll('.tool-card').length === 10);
    const win = frame.contentWindow;
    const doc = frame.contentDocument;
    for (const registration of await win.navigator.serviceWorker.getRegistrations()) await registration.unregister();
    const text = key => win.SmallToolsTranslations.cs['level.' + key];
    const status = () => doc.querySelector('.level-status').textContent;
    const x = () => doc.querySelector('.level-x').textContent;
    const y = () => doc.querySelector('.level-y').textContent;
    const emit = (beta, gamma) => {
      const event = new win.Event('deviceorientation');
      Object.assign(event, { beta, gamma, alpha: null, absolute: false });
      win.dispatchEvent(event);
    };
    doc.querySelector('a[href="#/level"]').click();
    await until(() => doc.querySelector('.level-page'));
    check(x() === '—°' && doc.querySelector('.level-calibrate').disabled, 'The idle level shows no fabricated reading or calibration');
    delete win.DeviceOrientationEvent;
    doc.querySelector('.level-start').click();
    await until(() => status() === text('state.unsupported'));
    let permission = 'denied';
    let requests = 0;
    win.DeviceOrientationEvent = class {
      static requestPermission(absolute) {
        requests++;
        check(absolute === false, 'Level permission does not request magnetometer access');
        return typeof permission === 'function' ? permission() : Promise.resolve(permission);
      }
    };
    check(requests === 0, 'Opening the tool does not request sensor permission');
    doc.querySelector('.level-start').click();
    await until(() => status() === text('state.denied'));
    permission = 'granted';
    doc.querySelector('.level-start').click();
    await until(() => status() === text('state.waiting'));
    emit(null, null);
    await pause();
    check(x() === '—°', 'Missing sensor values are not converted to zero');
    emit(0, 0);
    await pause();
    check(x() === '0,0°' && y() === '0,0°' && doc.querySelector('.level-balanced'), 'A face-up flat phone produces a centered level reading');
    emit(0, -5);
    await pause();
    check(x() === '5,0°' && y() === '0,0°' && parseFloat(doc.querySelector('.level-bubble').style.left) > 50, 'A raised right edge moves the bubble right');
    emit(4, 0);
    await pause();
    check(x() === '0,0°' && y() === '4,0°' && parseFloat(doc.querySelector('.level-bubble').style.top) < 50, 'A raised upper edge moves the bubble upwards');
    doc.querySelector('.level-calibrate').click();
    await pause();
    check(x() === '0,0°' && y() === '0,0°' && doc.querySelector('.level-reset'), 'Calibration sets the current surface as zero');
    emit(6, 0);
    await pause();
    check(y() === '2,0°', 'Calibrated readings show the change from the reference');
    Object.defineProperty(win.screen.orientation, 'angle', { configurable: true, value: 90 });
    win.screen.orientation.dispatchEvent(new win.Event('change'));
    await pause();
    check(x() === '-2,0°' && y() === '0,0°', 'Screen rotation transforms both the reading and calibration');
    Object.defineProperty(win.screen.orientation, 'angle', { configurable: true, value: 0 });
    win.screen.orientation.dispatchEvent(new win.Event('change'));
    doc.querySelector('.level-reset').click();
    await pause();
    check(y() === '6,0°' && !doc.querySelector('.level-reset'), 'Resetting calibration restores the device reference');
    emit(0.4, 0.4);
    await pause();
    check(!!doc.querySelector('.level-balanced'), 'The level indicator accepts a half-degree tolerance');
    emit(0.6, 0);
    await pause();
    check(!doc.querySelector('.level-balanced'), 'A tilt beyond the tolerance is not shown as level');
    emit(50, 40);
    await pause();
    const bubble = doc.querySelector('.level-bubble');
    check(Math.hypot(parseFloat(bubble.style.left) - 50, parseFloat(bubble.style.top) - 50) <= 35.01, 'Large diagonal tilt keeps the bubble inside the circular dial');
    emit(180, 0);
    await pause();
    check(x() === '—°' && status() === text('state.faceDown'), 'An upside-down phone is not incorrectly shown as level');
    emit(0, 0);
    await pause();
    doc.querySelector('.level-stop').click();
    emit(10, 5);
    await pause();
    check(x() === '—°' && status() === text('state.idle'), 'Stopping removes listeners and clears measurements');
    let resolvePermission;
    permission = () => new Promise(resolve => { resolvePermission = resolve; });
    doc.querySelector('.level-start').click();
    await until(() => resolvePermission);
    doc.querySelector('.level-stop').click();
    resolvePermission('granted');
    await pause();
    emit(0, 0);
    await pause();
    check(x() === '—°' && status() === text('state.idle'), 'A late permission response cannot restart cancelled measurement');
    permission = 'granted';
    doc.querySelector('.level-start').click();
    await until(() => status() === text('state.waiting'));
    win.dispatchEvent(new win.Event('pagehide'));
    await pause();
    check(status() === text('state.paused'), 'Leaving the page pauses measurement');
    doc.querySelector('.level-start').click();
    await until(() => status() === text('state.waiting'));
    emit(NaN, 0);
    await until(() => status() === text('state.unavailable'));
    check(x() === '—°', 'No usable sensor data produces a timeout and retry option');
    for (const width of [320, 960]) {
      frame.width = width;
      await pause();
      check(doc.documentElement.scrollWidth <= win.innerWidth, 'The level fits at ' + width + 'px');
    }
    doc.querySelector('.level-start').click();
    await until(() => status() === text('state.waiting'));
    emit(3, 0);
    await pause();
    doc.querySelector('.level-calibrate').click();
    doc.querySelector('.back-link').click();
    await until(() => doc.querySelectorAll('.tool-card').length === 10);
    win.location.hash = '#/level';
    await until(() => doc.querySelector('.level-page'));
    emit(0, 0);
    await pause();
    check(x() === '—°' && !doc.querySelector('.level-reset'), 'Reopening starts without old listeners, readings, or calibration');
    lines.push('\nALL TESTS PASSED');
  } catch (error) {
    lines.push('FAIL ' + error.stack);
  } finally {
    frame.src = 'about:blank';
    document.getElementById('results').textContent = lines.join('\n');
  }
})();
