/* global Vue */
globalThis.SmallToolsPdfViewer = {
  template: '#pdf-viewer-template',
  props: { t: { type: Function, required: true } },
  setup() {
    const { ref, onBeforeUnmount } = Vue;
    const fileInput = ref(null);
    const fileUrl = ref('');
    const fileName = ref('');
    const loading = ref(false);
    const errorKey = ref('');
    const canEmbed = navigator.pdfViewerEnabled !== false;
    let generation = 0;

    function clearDocument() {
      generation++;
      if (fileUrl.value) URL.revokeObjectURL(fileUrl.value);
      fileUrl.value = '';
      fileName.value = '';
      loading.value = false;
      errorKey.value = '';
    }

    async function selectFile(event) {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      const session = ++generation;
      loading.value = true;
      errorKey.value = '';
      try {
        const header = await file.slice(0, 1024).text();
        if (session !== generation) return;
        if (!/%PDF-\d\.\d/.test(header)) {
          errorKey.value = 'pdf.error.invalid';
          return;
        }
        // Force the PDF MIME type even if the file picker supplies an empty type.
        const nextUrl = URL.createObjectURL(new Blob([file], { type: 'application/pdf' }));
        if (fileUrl.value) URL.revokeObjectURL(fileUrl.value);
        fileUrl.value = nextUrl;
        fileName.value = file.name;
      } catch {
        if (session === generation) errorKey.value = 'pdf.error.read';
      } finally {
        if (session === generation) loading.value = false;
      }
    }

    onBeforeUnmount(clearDocument);
    return { fileInput, fileUrl, fileName, loading, errorKey, canEmbed, selectFile, clearDocument };
  },
};
