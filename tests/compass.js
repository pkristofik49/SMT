/* Sensor fixtures verify heading and lifecycle behavior without physical hardware. */
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
    throw new Error('Timed out waiting for compass state');
  }
  try {
    await until(() => frame.contentDocument?.querySelectorAll('.tool-card').length === 10);
    const win = frame.contentWindow;
    const doc = frame.contentDocument;
    for (const registration of await win.navigator.serviceWorker.getRegistrations()) await registration.unregister();
    const text = key => win.SmallToolsTranslations.cs['compass.' + key];
    const status = () => doc.querySelector('.compass-status').textContent;
    const reading = () => doc.querySelector('.compass-degrees').textContent;
    const emit = (fields, type = 'deviceorientation') => {
      const event = new win.Event(type);
      Object.assign(event, { absolute: false, alpha: null, beta: 0, gamma: 0 }, fields);
      win.dispatchEvent(event);
    };
    const feedUntil = async (fields, expected, type = 'deviceorientation') => {
      for (let attempt = 0; attempt < 80; attempt++) {
        emit(fields, type);
        await pause();
        if (reading() === expected) return;
      }
      throw new Error('Heading did not converge to ' + expected + ': ' + reading());
    };
    doc.querySelector('a[href="#/compass"]').click();
    await until(() => doc.querySelector('.compass-page'));
    check(reading() === '—°' && status() === text('state.idle'), 'The compass does not invent a heading before starting');
    check(doc.title === text('pageTitle'), 'Direct tool navigation updates page metadata');
    delete win.DeviceOrientationEvent;
    doc.querySelector('.compass-start').click();
    await until(() => status() === text('state.unsupported'));
    check(reading() === '—°', 'Unsupported devices display no heading');
    let permission = 'denied';
    let requests = 0;
    win.DeviceOrientationEvent = class {
      static requestPermission(absolute) {
        requests++;
        check(absolute === true, 'Permission requests absolute orientation from a user click');
        return typeof permission === 'function' ? permission() : Promise.resolve(permission);
      }
    };
    check(requests === 0, 'No sensor permission is requested automatically');
    doc.querySelector('.compass-start').click();
    await until(() => status() === text('state.denied'));
    check(reading() === '—°', 'Denied permission provides feedback without a heading');
    permission = 'granted';
    doc.querySelector('.compass-start').click();
    await until(() => status() === text('state.waiting'));
    emit({ alpha: 30, absolute: false });
    await pause();
    check(reading() === '—°', 'Relative gyroscope data is never treated as north');
    for (const [alpha, degrees, direction] of [[0, 0, 'n'], [270, 90, 'e'], [180, 180, 's'], [90, 270, 'w'], [0.2, 0, 'n']]) {
      await feedUntil({ alpha, absolute: true }, degrees + '°', 'deviceorientationabsolute');
      check(reading() === degrees + '°' && doc.querySelector('.compass-direction').textContent === text('direction.' + direction), 'Absolute angles resolve the expected cardinal heading: ' + alpha);
    }
    check(doc.querySelector('.compass-source').textContent === text('source.absoluteEvent') && doc.querySelector('.compass-accuracy').textContent === text('accuracyUnknown'), 'Android reports the actual source and does not invent an accuracy estimate');
    await feedUntil({ alpha: 1, absolute: true }, '359°', 'deviceorientationabsolute');
    emit({ alpha: 359, absolute: true }, 'deviceorientationabsolute');
    await pause();
    check(['359°', '0°', '1°'].includes(reading()), 'Circular smoothing crosses north without rotating through south');
    await feedUntil({ alpha: 359, absolute: true }, '1°', 'deviceorientationabsolute');
    emit({ alpha: 180, absolute: true });
    emit({ webkitCompassHeading: 180, webkitCompassAccuracy: 8 });
    await pause();
    check(reading() === '1°', 'A running measurement cannot jump between event sources');
    doc.querySelector('.compass-stop').click();
    await pause();
    doc.querySelector('.compass-start').click();
    await until(() => status() === text('state.waiting'));
    emit({ webkitCompassHeading: 223.4, webkitCompassAccuracy: 8 });
    await pause();
    check(reading() === '—°' && status() === text('state.settling'), 'A fresh sensor reading waits before displaying a direction');
    await feedUntil({ webkitCompassHeading: 223.4, webkitCompassAccuracy: 8 }, '223°');
    check(reading() === '223°' && doc.querySelector('.compass-direction').textContent === text('direction.sw'), 'Safari compass headings are supported directly');
    check(doc.querySelector('.compass-accuracy').textContent === '±8°', 'Reported sensor accuracy is displayed in degrees');
    emit({ webkitCompassHeading: 100, webkitCompassAccuracy: 30 });
    await pause();
    check(reading() === '—°' && status() === text('state.calibration'), 'Low reported accuracy requests calibration instead of showing a direction');
    emit({ webkitCompassHeading: 100, webkitCompassAccuracy: -1 });
    await pause();
    check(reading() === '—°' && status() === text('state.calibration'), 'Invalid sensor accuracy requests calibration without showing a false heading');
    emit({ webkitCompassHeading: 0, webkitCompassAccuracy: 8, beta: 65 });
    await pause();
    check(reading() === '—°' && status() === text('state.tilted'), 'A tilted phone receives a horizontal-position instruction');
    await feedUntil({ webkitCompassHeading: 0, webkitCompassAccuracy: 8 }, '0°');
    Object.defineProperty(win.screen.orientation, 'angle', { configurable: true, value: 90 });
    win.screen.orientation.dispatchEvent(new win.Event('change'));
    await pause();
    check(reading() === '90°', 'Screen rotation adjusts the displayed upper-edge heading');
    doc.querySelector('.compass-calibration-toggle').click();
    await pause();
    check(doc.querySelector('#compass-calibration ol').children.length === 3, 'Calibration guidance explains physical sensor calibration');
    doc.querySelector('.compass-align').click();
    await pause();
    check(reading() === '0°' && doc.querySelector('.compass-correction'), 'Known-north alignment applies a visible manual correction');
    await feedUntil({ webkitCompassHeading: 10, webkitCompassAccuracy: 8 }, '10°');
    doc.querySelector('.compass-reset-correction').click();
    await pause();
    check(['99°', '100°'].includes(reading()) && !doc.querySelector('.compass-correction'), 'Manual correction can be removed without changing sensor data');
    doc.querySelector('.compass-align').click();
    await pause();
    Object.defineProperty(win.screen.orientation, 'angle', { configurable: true, value: 0 });
    doc.querySelector('.compass-stop').click();
    emit({ alpha: 180, absolute: true });
    await pause();
    check(reading() === '—°' && status() === text('state.idle') && !doc.querySelector('.compass-correction'), 'Stopping removes listeners, readings, and the session-only manual correction');
    let resolvePermission;
    permission = () => new Promise(resolve => { resolvePermission = resolve; });
    doc.querySelector('.compass-start').click();
    await until(() => resolvePermission);
    doc.querySelector('.compass-stop').click();
    resolvePermission('granted');
    await pause();
    emit({ alpha: 90, absolute: true });
    await pause();
    check(reading() === '—°' && status() === text('state.idle'), 'A late permission response cannot restart a cancelled compass');
    permission = 'granted';
    doc.querySelector('.compass-start').click();
    await until(() => status() === text('state.waiting'));
    win.dispatchEvent(new win.Event('pagehide'));
    await pause();
    check(status() === text('state.paused'), 'Leaving the active page pauses sensor access');
    doc.querySelector('.compass-start').click();
    await until(() => status() === text('state.waiting'));
    emit({ alpha: 25, absolute: false });
    emit({ alpha: null, absolute: true });
    await until(() => status() === text('state.unavailable'));
    check(reading() === '—°' && doc.querySelector('.compass-start'), 'Missing absolute sensor data times out with a retry option');
    for (const width of [320, 960]) {
      frame.width = width;
      await pause();
      check(doc.documentElement.scrollWidth <= win.innerWidth, 'The compass fits at ' + width + 'px');
    }
    doc.querySelector('.compass-start').click();
    await until(() => status() === text('state.waiting'));
    doc.querySelector('.back-link').click();
    await until(() => doc.querySelectorAll('.tool-card').length === 10);
    emit({ alpha: 0, absolute: true });
    win.location.hash = '#/compass';
    await until(() => doc.querySelector('.compass-page'));
    check(reading() === '—°' && status() === text('state.idle'), 'Reopening the compass starts fresh after navigation cleanup');
    lines.push('\nALL TESTS PASSED');
  } catch (error) {
    lines.push('FAIL ' + error.stack);
  } finally {
    frame.src = 'about:blank';
    document.getElementById('results').textContent = lines.join('\n');
  }
})();
