/* global Vue */
globalThis.SmallToolsCompass = {
  template: '#compass-template',
  props: { t: { type: Function, required: true } },
  setup() {
    const { computed, ref, onMounted, onBeforeUnmount } = Vue;
    const heading = ref(null);
    const source = ref('');
    const accuracy = ref(null);
    const correction = ref(null);
    const calibrationOpen = ref(false);
    const state = ref('idle');
    const running = computed(() => ['requesting', 'waiting', 'settling', 'active', 'tilted', 'calibration'].includes(state.value));
    const degrees = computed(() => heading.value === null ? null : Math.round(heading.value) % 360);
    const direction = computed(() => heading.value === null ? null : ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'][Math.round(heading.value / 45) % 8]);
    let generation = 0;
    let timeout;
    let settleTimer;
    let rawHeading = null;
    let filteredHeading = null;
    let listening = false;
    const normalize = value => ((value % 360) + 360) % 360;

    function updateScreenHeading() {
      if (filteredHeading === null || state.value !== 'active') return;
      const angle = Number.isFinite(screen.orientation?.angle) ? screen.orientation.angle :
        (Number.isFinite(window.orientation) ? window.orientation : 0);
      heading.value = normalize(filteredHeading + angle + (correction.value ?? 0));
    }

    function stop() {
      generation++;
      clearTimeout(timeout);
      clearTimeout(settleTimer);
      listening = false;
      window.removeEventListener('deviceorientationabsolute', onOrientation);
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('orientationchange', updateScreenHeading);
      screen.orientation?.removeEventListener('change', updateScreenHeading);
      heading.value = null;
      rawHeading = null;
      filteredHeading = null;
      source.value = '';
      accuracy.value = null;
      correction.value = null;
      state.value = 'idle';
    }

    function suspendReading(nextState) {
      clearTimeout(settleTimer);
      heading.value = rawHeading = filteredHeading = null;
      state.value = nextState;
    }

    function onOrientation(event) {
      if (!listening) return;
      let value;
      let nextSource;
      if (Number.isFinite(event.webkitCompassHeading) && event.webkitCompassHeading >= 0 && event.webkitCompassHeading < 360) {
        nextSource = 'webkit';
        if (source.value && source.value !== nextSource) return;
        accuracy.value = Number.isFinite(event.webkitCompassAccuracy) ? event.webkitCompassAccuracy : null;
        if (accuracy.value !== null && (accuracy.value < 0 || accuracy.value > 20)) {
          suspendReading('calibration');
          return;
        }
        value = event.webkitCompassHeading;
      } else if (event.absolute === true && Number.isFinite(event.alpha)) {
        nextSource = event.type === 'deviceorientationabsolute' ? 'absoluteEvent' : 'absoluteOrientation';
        if (source.value && source.value !== nextSource) return;
        accuracy.value = null;
        value = normalize(360 - event.alpha);
      } else {
        // Relative gyroscope angles cannot determine geographic north.
        return;
      }
      if ((Number.isFinite(event.beta) && Math.abs(event.beta) > 20) ||
          (Number.isFinite(event.gamma) && Math.abs(event.gamma) > 20)) {
        suspendReading('tilted');
        return;
      }
      clearTimeout(timeout);
      source.value = nextSource;
      rawHeading = normalize(value);
      if (filteredHeading === null) {
        filteredHeading = rawHeading;
        state.value = 'settling';
        settleTimer = setTimeout(() => {
          if (!listening || filteredHeading === null) return;
          state.value = 'active';
          updateScreenHeading();
        }, 1500);
      } else {
        // Follow the shortest arc, including across the 359/0-degree boundary.
        const delta = ((rawHeading - filteredHeading + 540) % 360) - 180;
        filteredHeading = normalize(filteredHeading + delta * 0.25);
        updateScreenHeading();
      }
    }

    function alignNorth() {
      if (state.value !== 'active' || heading.value === null) return;
      correction.value = normalize((correction.value ?? 0) - heading.value);
      updateScreenHeading();
    }
    function resetCorrection() {
      correction.value = null;
      updateScreenHeading();
    }
    function restart() {
      stop();
      start();
    }

    async function start() {
      if (running.value) return;
      stop();
      const session = generation;
      if (!window.isSecureContext || !['https:', 'http:'].includes(location.protocol)) {
        state.value = 'insecure';
        return;
      }
      if (typeof window.DeviceOrientationEvent !== 'function') {
        state.value = 'unsupported';
        return;
      }
      state.value = 'requesting';
      try {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          const permission = await DeviceOrientationEvent.requestPermission(true);
          if (session !== generation) return;
          if (permission !== 'granted') {
            state.value = 'denied';
            return;
          }
        }
        if (session !== generation) return;
        listening = true;
        state.value = 'waiting';
        window.addEventListener('deviceorientationabsolute', onOrientation);
        window.addEventListener('deviceorientation', onOrientation);
        window.addEventListener('orientationchange', updateScreenHeading);
        screen.orientation?.addEventListener('change', updateScreenHeading);
        timeout = setTimeout(() => {
          if (session !== generation) return;
          const previousState = state.value;
          stop();
          state.value = ['tilted', 'calibration'].includes(previousState) ? previousState + 'Retry' : 'unavailable';
        }, 8000);
      } catch {
        if (session === generation) {
          stop();
          state.value = 'denied';
        }
      }
    }

    const pause = () => {
      if (!running.value) return;
      stop();
      state.value = 'paused';
    };
    const onVisibility = () => { if (document.hidden) pause(); };
    onMounted(() => {
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('pagehide', pause);
    });
    onBeforeUnmount(() => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', pause);
    });
    return { heading, degrees, direction, state, running, source, accuracy, correction, calibrationOpen, alignNorth, resetCorrection, restart, start, stop };
  },
};
