/* global Vue */
globalThis.SmallToolsLevel = {
  template: '#level-template',
  props: { t: { type: Function, required: true } },
  setup() {
    const { computed, ref, onMounted, onBeforeUnmount } = Vue;
    const state = ref('idle');
    const mode = ref('flat');
    const sample = ref(null);
    const references = ref({ flat: null, edge: null });
    const reference = computed(() => references.value[mode.value]);
    const screenAngle = ref(0);
    const running = computed(() => ['requesting', 'waiting', 'active', 'faceDown', 'edgePosition'].includes(state.value));
    const radians = Math.PI / 180;
    const numberFormat = new Intl.NumberFormat('cs', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    let generation = 0;
    let timeout;
    let listening = false;
    let lastVector = null;
    const edgeHorizontal = computed(() => Math.abs(Math.sin(screenAngle.value * radians)) > 0.5);
    const edgeAngle = vector => Math.asin(Math.max(-1, Math.min(1, vector.y))) / radians;

    function project(vector) {
      const angle = screenAngle.value * radians;
      const x = vector.x * Math.cos(angle) - vector.y * Math.sin(angle);
      const y = vector.x * Math.sin(angle) + vector.y * Math.cos(angle);
      return { x: Math.atan2(x, vector.z) / radians, y: Math.atan2(y, vector.z) / radians };
    }
    const tilt = computed(() => {
      if (!sample.value) return null;
      if (mode.value === 'edge') {
        return { x: 0, y: edgeAngle(sample.value) - (reference.value ? edgeAngle(reference.value) : 0) };
      }
      const current = project(sample.value);
      const zero = reference.value ? project(reference.value) : { x: 0, y: 0 };
      return { x: current.x - zero.x, y: current.y - zero.y };
    });
    const isLevel = computed(() => tilt.value !== null && Math.abs(tilt.value.x) <= 0.5 && Math.abs(tilt.value.y) <= 0.5);
    const bubbleStyle = computed(() => {
      if (mode.value === 'edge') {
        const offset = Math.max(-10, Math.min(10, tilt.value?.y || 0)) * 3.5;
        const angle = screenAngle.value * radians;
        return { left: (50 - offset * Math.sin(angle)) + '%', top: (50 - offset * Math.cos(angle)) + '%' };
      }
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
      lastVector = null;
      state.value = 'idle';
    }
    function acceptVector(vector) {
      const invalid = mode.value === 'flat' ? vector.z <= 0.05 : Math.abs(vector.x) < 0.5;
      if (invalid) {
        sample.value = null;
        state.value = mode.value === 'flat' ? 'faceDown' : 'edgePosition';
        return;
      }
      sample.value = vector;
      state.value = 'active';
    }
    function setMode(next) {
      if (!['flat', 'edge'].includes(next) || mode.value === next) return;
      updateScreenAngle();
      mode.value = next;
      if (listening && lastVector) acceptVector(lastVector);
    }
    function onOrientation(event) {
      if (!listening || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma) ||
          Math.abs(event.beta) > 180 || Math.abs(event.gamma) > 90) return;
      clearTimeout(timeout);
      const beta = event.beta * radians;
      const gamma = event.gamma * radians;
      // Earth-up vector in the device frame; north/alpha is not needed for leveling.
      const vector = { x: -Math.cos(beta) * Math.sin(gamma), y: Math.sin(beta), z: Math.cos(beta) * Math.cos(gamma) };
      lastVector = vector;
      acceptVector(vector);
    }
    function calibrate() {
      if (sample.value && state.value === 'active') references.value[mode.value] = { ...sample.value };
    }
    const resetCalibration = () => { references.value[mode.value] = null; };

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
    return { mode, edgeHorizontal, setMode, state, running, tilt, isLevel, bubbleStyle, reference, formatAngle, start, stop, calibrate, resetCalibration };
  },
};
