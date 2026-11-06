/* global Vue */
globalThis.SmallToolsQrReader = {
  template: '#qr-reader-template',
  props: { t: { type: Function, required: true } },
  setup() {
    const { ref, onMounted, onBeforeUnmount } = Vue;
    const video = ref(null);
    const capability = ref('checking');
    const state = ref('idle');
    const result = ref(null);
    const errorKey = ref('');
    let detector;
    let stream;
    let timer;
    let generation = 0;
    let disposed = false;

    function stopCamera() {
      generation++;
      clearTimeout(timer);
      if (stream) {
        for (const track of stream.getTracks()) {
          track.onended = null;
          track.stop();
        }
        stream = null;
      }
      if (video.value) video.value.srcObject = null;
      state.value = result.value === null ? 'idle' : 'result';
    }

    function fail(key) {
      stopCamera();
      errorKey.value = key;
      state.value = 'error';
    }

    async function scan(session) {
      if (disposed || session !== generation) return;
      try {
        if (video.value?.readyState >= 2 && video.value.videoWidth > 0) {
          const codes = await detector.detect(video.value);
          if (disposed || session !== generation) return;
          const code = codes.find(item => typeof item.rawValue === 'string');
          if (code) {
            result.value = code.rawValue;
            stopCamera();
            return;
          }
        }
      } catch (error) {
        if (disposed || session !== generation) return;
        if (error.name !== 'InvalidStateError') {
          fail('qr.error.detection');
          return;
        }
      }
      if (session === generation) timer = setTimeout(() => scan(session), 200);
    }

    async function startCamera() {
      if (disposed || capability.value !== 'ready' || ['starting', 'scanning'].includes(state.value)) return;
      stopCamera();
      const session = generation;
      result.value = null;
      errorKey.value = '';
      state.value = 'starting';
      try {
        const acquired = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (disposed || session !== generation) {
          acquired.getTracks().forEach(track => track.stop());
          return;
        }
        stream = acquired;
        for (const track of stream.getTracks()) {
          track.onended = () => {
            if (session === generation) fail('qr.error.interrupted');
          };
        }
        video.value.srcObject = stream;
        await video.value.play();
        if (disposed || session !== generation) return;
        state.value = 'scanning';
        scan(session);
      } catch (error) {
        if (disposed || session !== generation) return;
        const errors = {
          NotAllowedError: 'qr.error.permission',
          SecurityError: 'qr.error.permission',
          NotFoundError: 'qr.error.noCamera',
          NotReadableError: 'qr.error.busy',
          OverconstrainedError: 'qr.error.noCamera',
        };
        fail(errors[error.name] || 'qr.error.camera');
      }
    }

    const onVisibilityChange = () => { if (document.hidden) stopCamera(); };
    onMounted(async () => {
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('pagehide', stopCamera);
      if (!window.isSecureContext || !['https:', 'http:'].includes(location.protocol)) {
        capability.value = 'insecure';
        return;
      }
      if (typeof globalThis.BarcodeDetector !== 'function') {
        capability.value = 'unsupported';
        return;
      }
      try {
        const formats = await BarcodeDetector.getSupportedFormats();
        if (disposed) return;
        if (!formats.includes('qr_code')) {
          capability.value = 'unsupported';
          return;
        }
        detector = new BarcodeDetector({ formats: ['qr_code'] });
        capability.value = navigator.mediaDevices?.getUserMedia ? 'ready' : 'noCamera';
      } catch {
        if (!disposed) capability.value = 'unsupported';
      }
    });
    onBeforeUnmount(() => {
      disposed = true;
      stopCamera();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', stopCamera);
    });

    return { video, capability, state, result, errorKey, startCamera, stopCamera };
  },
};
