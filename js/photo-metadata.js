/* global Vue, exifr */
globalThis.SmallToolsPhotoMetadata = {
  template: '#photo-metadata-template',
  props: { t: { type: Function, required: true } },
  setup() {
    const { ref, computed, onBeforeUnmount } = Vue;
    const fileInput = ref(null);
    const fileInfo = ref(null);
    const metadata = ref({});
    const previewUrl = ref('');
    const previewFailed = ref(false);
    const exportUrl = ref('');
    const loading = ref(false);
    const warning = ref('');
    const issues = ref([]);
    const query = ref('');
    let generation = 0;

    function serializable(value, seen = new WeakSet()) {
      if (value === null || typeof value !== 'object') {
        return typeof value === 'bigint' || (typeof value === 'number' && !Number.isFinite(value)) ? String(value) : value;
      }
      if (value instanceof Date) return Number.isNaN(value.getTime()) ? String(value) : value.toISOString();
      if (value instanceof Uint8Array || value instanceof ArrayBuffer || value instanceof DataView) {
        const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
        return { encoding: 'hex', byteLength: bytes.length, data: Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('') };
      }
      if (ArrayBuffer.isView(value)) return Array.from(value);
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
      const output = Array.isArray(value) ? value.map(item => serializable(item, seen)) :
        Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializable(item, seen)]));
      seen.delete(value);
      return output;
    }
    const rows = computed(() => {
      const output = [];
      function visit(value, path) {
        if (value && typeof value === 'object' && !Array.isArray(value) && value.encoding !== 'hex' && Object.keys(value).length) {
          for (const [key, item] of Object.entries(value)) visit(item, [...path, key]);
        } else {
          output.push({ key: path.join('.'), group: path[0], name: path.slice(1).join('.') || path[0], value: typeof value === 'string' ? value : JSON.stringify(value, null, 2) ?? String(value) });
        }
      }
      for (const [key, value] of Object.entries(metadata.value)) visit(value, [key]);
      return output;
    });
    const filteredRows = computed(() => {
      const search = query.value.trim().toLocaleLowerCase('cs');
      return rows.value.filter(row => `${row.key} ${row.value}`.toLocaleLowerCase('cs').includes(search));
    });
    const onPreviewError = event => { if (event.target.src === previewUrl.value) previewFailed.value = true; };

    function clear() {
      generation++;
      if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
      if (exportUrl.value) URL.revokeObjectURL(exportUrl.value);
      previewUrl.value = exportUrl.value = '';
      previewFailed.value = false;
      fileInfo.value = null;
      metadata.value = {};
      warning.value = '';
      issues.value = [];
      query.value = '';
      loading.value = false;
    }
    async function selectPhoto(event) {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      clear();
      const session = generation;
      loading.value = true;
      const modifiedDate = new Date(file.lastModified);
      fileInfo.value = { name: file.name, type: file.type || null, byteSize: file.size, lastModified: Number.isNaN(modifiedDate.getTime()) ? null : modifiedDate.toISOString() };
      previewUrl.value = URL.createObjectURL(file);
      try {
        const parsed = await exifr.parse(file, {
          tiff: true, ifd0: true, ifd1: true, exif: true, gps: true, interop: true,
          makerNote: true, userComment: true, jfif: true, ihdr: true,
          xmp: { multiSegment: true }, icc: { multiSegment: true }, iptc: true,
          mergeOutput: false, translateKeys: true, translateValues: false,
          reviveValues: false, sanitize: false, skip: [], chunked: true, chunkLimit: Infinity, silentErrors: true,
        });
        if (session !== generation) return;
        const { errors, ...tags } = parsed || {};
        metadata.value = serializable(tags);
        issues.value = (Array.isArray(errors) ? errors : errors ? [errors] : []).map(error => String(error?.message || error));
        // Preserve the original XMP packet as well as decoded fields, avoiding lost namespace collisions.
        try {
          const raw = await exifr.parse(file, {
            tiff: false, ifd0: false, ifd1: false, exif: false, gps: false, interop: false,
            xmp: { parse: false, multiSegment: true }, iptc: false, icc: false, jfif: false, ihdr: false,
            mergeOutput: false, chunked: true, chunkLimit: Infinity, silentErrors: true,
          });
          if (session !== generation) return;
          if (raw?.xmp !== undefined) metadata.value = { ...metadata.value, xmpRaw: serializable(raw.xmp) };
          if (raw?.errors) issues.value.push(...[].concat(raw.errors).map(error => String(error?.message || error)));
        } catch (error) {
          if (session !== generation) return;
          issues.value.push(String(error?.message || error));
        }
        if (issues.value.length) warning.value = 'metadata.partial';
      } catch (error) {
        if (session !== generation) return;
        warning.value = 'metadata.unreadable';
        issues.value = [String(error?.message || error)];
      } finally {
        if (session === generation) {
          loading.value = false;
          const report = { file: fileInfo.value, metadata: metadata.value, issues: issues.value, parser: { name: 'exifr', version: '7.1.3' } };
          exportUrl.value = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
        }
      }
    }
    onBeforeUnmount(clear);
    return { fileInput, fileInfo, previewUrl, previewFailed, onPreviewError, exportUrl, loading, warning, issues, query, rows, filteredRows, selectPhoto, clear };
  },
};
