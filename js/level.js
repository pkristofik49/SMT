/* global Vue */
globalThis.SmallToolsLevel = {
  template: '#level-template',
  props: { t: { type: Function, required: true } },
  setup() {
    const { computed, ref, onMounted, onBeforeUnmount } = Vue;
    const state = ref('idle');
    const sample = ref(null);
    const reference = ref(null);
    const screenAngle = ref(0);
    const running = computed(() => ['requesting', 'waiting', 'active', 'faceDown'].includes(state.value));
    const radians = Math.PI / 180;
    const numberFormat = new Intl.NumberFormat('cs', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    let generation = 0;
    let timeout;
    let listening = false;

    function project(vector) {
      const angle = screenAngle.value * radians;
      const x = vector.x * Math.cos(angle) - vector.y * Math.sin(angle);
      const y = vector.x * Math.sin(angle) + vector.y * Math.cos(angle);
      return { x: Math.atan2(x, vector.z) / radians, y: Math.atan2(y, vector.z) / radians };
    }
    const tilt = computed(() => {
      if (!sample.value) return null;
      const current = project(sample.value);
      const zero = reference.value ? project(reference.value) : { x: 0, y: 0 };
      return { x: current.x - zero.x, y: current.y - zero.y };
    });
    const isLevel = computed(() => tilt.value !== null && Math.abs(tilt.value.x) <= 0.5 && Math.abs(tilt.value.y) <= 0.5);
    const bubbleStyle = computed(() => {
      const x = tilt.value?.x || 0;
      const y = tilt.value?.y || 0;
      const scale = 35 / Math.max(10, Math.hypot(x, y));
      return { left: (50 + x * scale) + '%', top: (50 - y * scale) + '%' };
    });
    const formatAngle = value => {
      if (value === undefined) return '—';
      const rounded = Math.round(value * 10) / 10;
      return numberFormat.format(rounded === 0 ? 0 : rounded);
    };

    function updateScreenAngle() {
      screenAngle.value = Number.isFinite(screen.orientation?.angle) ? screen.orientation.angle :
        (Number.isFinite(window.orientation) ? window.orientation : 0);
    }
    function stop() {
      generation++;
      listening = false;
      clearTimeout(timeout);
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('deviceorientationabsolute', onOrientation);
      window.removeEventListener('orientationchange', updateScreenAngle);
      screen.orientation?.removeEventListener('change', updateScreenAngle);
      sample.value = null;
      state.value = 'idle';
    }
    function onOrientation(event) {
      if (!listening || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma) ||
          Math.abs(event.beta) > 180 || Math.abs(event.gamma) > 90) return;
      clearTimeout(timeout);
      const beta = event.beta * radians;
      const gamma = event.gamma * radians;
      // Earth-up vector in the device frame; north/alpha is not needed for leveling.
      const vector = { x: -Math.cos(beta) * Math.sin(gamma), y: Math.sin(beta), z: Math.cos(beta) * Math.cos(gamma) };
      if (vector.z <= 0.05) {
        sample.value = null;
        state.value = 'faceDown';
        return;
      }
      sample.value = vector;
      state.value = 'active';
    }
    function calibrate() {
      if (sample.value && state.value === 'active') reference.value = { ...sample.value };
    }
    const resetCalibration = () => { reference.value = null; };

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
          const permission = await DeviceOrientationEvent.requestPermission(false);
          if (session !== generation) return;
          if (permission !== 'granted') {
            state.value = 'denied';
            return;
          }
        }
        if (session !== generation) return;
        updateScreenAngle();
        listening = true;
        state.value = 'waiting';
        window.addEventListener('deviceorientation', onOrientation);
        window.addEventListener('deviceorientationabsolute', onOrientation);
        window.addEventListener('orientationchange', updateScreenAngle);
        screen.orientation?.addEventListener('change', updateScreenAngle);
        timeout = setTimeout(() => {
          if (session !== generation) return;
          stop();
          state.value = 'unavailable';
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
    return { state, running, tilt, isLevel, bubbleStyle, reference, formatAngle, start, stop, calibrate, resetCalibration };
  },
};
