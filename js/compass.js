/* global Vue */
globalThis.SmallToolsCompass = {
  template: '#compass-template',
  props: { t: { type: Function, required: true } },
  setup() {
    const { computed, ref, onMounted, onBeforeUnmount } = Vue;
    const heading = ref(null);
    const state = ref('idle');
    const running = computed(() => ['requesting', 'waiting', 'active', 'tilted', 'calibration'].includes(state.value));
    const degrees = computed(() => heading.value === null ? null : Math.round(heading.value) % 360);
    const direction = computed(() => heading.value === null ? null : ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'][Math.round(heading.value / 45) % 8]);
    let generation = 0;
    let timeout;
    let rawHeading = null;
    let listening = false;
    const normalize = value => ((value % 360) + 360) % 360;

    function updateScreenHeading() {
      if (rawHeading === null) return;
      const angle = Number.isFinite(screen.orientation?.angle) ? screen.orientation.angle :
        (Number.isFinite(window.orientation) ? window.orientation : 0);
      heading.value = normalize(rawHeading + angle);
    }

    function stop() {
      generation++;
      clearTimeout(timeout);
      listening = false;
      window.removeEventListener('deviceorientationabsolute', onOrientation);
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('orientationchange', updateScreenHeading);
      screen.orientation?.removeEventListener('change', updateScreenHeading);
      heading.value = null;
      rawHeading = null;
      state.value = 'idle';
    }

    function onOrientation(event) {
      if (!listening) return;
      let value;
      if (Number.isFinite(event.webkitCompassHeading) && event.webkitCompassHeading >= 0 && event.webkitCompassHeading < 360) {
        if (Number.isFinite(event.webkitCompassAccuracy) && (event.webkitCompassAccuracy < 0 || event.webkitCompassAccuracy > 50)) {
          heading.value = rawHeading = null;
          state.value = 'calibration';
          return;
        }
        value = event.webkitCompassHeading;
      } else if (event.absolute === true && Number.isFinite(event.alpha)) {
        value = normalize(360 - event.alpha);
      } else {
        // Relative gyroscope angles cannot determine geographic north.
        return;
      }
      if ((Number.isFinite(event.beta) && Math.abs(event.beta) > 45) ||
          (Number.isFinite(event.gamma) && Math.abs(event.gamma) > 45)) {
        heading.value = rawHeading = null;
        state.value = 'tilted';
        return;
      }
      clearTimeout(timeout);
      rawHeading = value;
      updateScreenHeading();
      state.value = 'active';
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
    return { heading, degrees, direction, state, running, start, stop };
  },
};
