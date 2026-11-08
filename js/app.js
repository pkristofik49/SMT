/* global Vue, SmallToolsTranslations, SmallToolsVersion, SmallToolsQrReader, SmallToolsPdfViewer, SmallToolsCompass */
Vue.createApp({
  components: { QrReader: SmallToolsQrReader, PdfViewer: SmallToolsPdfViewer, CompassTool: SmallToolsCompass },
  setup() {
    const { computed, ref, onBeforeUnmount } = Vue

    const query = ref('')
    const t = (key) => SmallToolsTranslations.cs[key] ?? key
    const routes = { '#/qr-reader': 'qr', '#/pdf-viewer': 'pdf', '#/compass': 'compass' }
    const page = ref(routes[location.hash] || 'menu')
    const tools = [
      { id: 'qr', icon: 'qr', color: 'green', href: '#/qr-reader' },
      { id: 'pdf', icon: 'file', color: 'blue', href: '#/pdf-viewer' },
      { id: 'compass', icon: 'compass', color: 'orange', href: '#/compass' },
      { id: 'text', icon: 'text', color: 'green' },
      { id: 'json', icon: 'code', color: 'blue' },
      { id: 'units', icon: 'arrows', color: 'orange' },
      { id: 'colors', icon: 'palette', color: 'purple' },
      { id: 'time', icon: 'clock', color: 'pink' },
      { id: 'password', icon: 'key', color: 'cyan' },
    ].map((tool) => ({
      ...tool,
      name: t('tool.' + tool.id + '.name'),
      category: t('tool.' + tool.id + '.category'),
      description: t('tool.' + tool.id + '.description'),
    }))

    const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const filteredTools = computed(() => {
      const search = normalize(query.value.trim())
      return tools.filter((tool) => normalize(`${tool.name} ${tool.category} ${tool.description}`).includes(search))
    })

    const icons = {
      compass: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'm16 8-3 5-5 3 3-5Z'],
      file: ['M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z', 'M14 3v6h6M8 13h8M8 17h6'],
      qr: ['M3 3h6v6H3ZM15 3h6v6h-6ZM3 15h6v6H3Z', 'M15 15h3v3h3v3h-6v-3m6-6v3M12 3v3m0 6h3M3 12h3m6 6v3'],
      text: ['M4 6h16M12 6v14M8 20h8'],
      code: ['m8 8-4 4 4 4m8-8 4 4-4 4m-3-11-2 14'],
      arrows: ['M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4'],
      palette: ['M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.4-3.4 1.6 1.6 0 0 1 1.1-2.6H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z', 'M7.5 11h.01M10 7.5h.01M15 7.5h.01M17.5 11h.01'],
      clock: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M12 7v5l3 2'],
      key: ['M14 14a6 6 0 1 0-4-4L3 17v4h4v-3h3l4-4Z', 'M16 8h.01'],
    }

    const updatePage = () => {
      page.value = routes[location.hash] || 'menu'
      document.title = t({ qr: 'qr.pageTitle', pdf: 'pdf.pageTitle', compass: 'compass.pageTitle', menu: 'page.title' }[page.value])
    }
    updatePage()
    window.addEventListener('hashchange', updatePage)
    onBeforeUnmount(() => window.removeEventListener('hashchange', updatePage))
    document.querySelector('meta[name="description"]').content = t('page.description')
    return { page, query, tools, filteredTools, icons, t, version: SmallToolsVersion }
  },
}).mount('#app')
