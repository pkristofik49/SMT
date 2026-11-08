/* global Vue, SmallToolsTranslations, SmallToolsVersion, SmallToolsQrReader, SmallToolsPdfViewer, SmallToolsCompass, SmallToolsLevel */
Vue.createApp({
  components: { QrReader: SmallToolsQrReader, PdfViewer: SmallToolsPdfViewer, CompassTool: SmallToolsCompass, LevelTool: SmallToolsLevel },
  setup() {
    const { computed, ref, onBeforeUnmount } = Vue

    const query = ref('')
    const t = (key) => SmallToolsTranslations.cs[key] ?? key
    const routes = { '#/qr-reader': 'qr', '#/pdf-viewer': 'pdf', '#/compass': 'compass', '#/level': 'level' }
    const page = ref(routes[location.hash] || 'menu')
    const tools = [
      { id: 'qr', icon: 'qr', color: 'green', href: '#/qr-reader' },
      { id: 'pdf', icon: 'file', color: 'blue', href: '#/pdf-viewer' },
      { id: 'compass', icon: 'compass', color: 'orange', href: '#/compass' },
      { id: 'level', icon: 'level', color: 'green', href: '#/level' },
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
      level: ['M3 7h18v10H3Z', 'M9 7v10m6-10v10M12 10v4'],
      compass: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'm16 8-3 5-5 3 3-5Z'],
      file: ['M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z', 'M14 3v6h6M8 13h8M8 17h6'],
      qr: ['M3 3h6v6H3ZM15 3h6v6h-6ZM3 15h6v6H3Z', 'M15 15h3v3h3v3h-6v-3m6-6v3M12 3v3m0 6h3M3 12h3m6 6v3'],
    }

    const updatePage = () => {
      page.value = routes[location.hash] || 'menu'
      document.title = t({ qr: 'qr.pageTitle', pdf: 'pdf.pageTitle', compass: 'compass.pageTitle', level: 'level.pageTitle', menu: 'page.title' }[page.value])
    }
    updatePage()
    window.addEventListener('hashchange', updatePage)
    onBeforeUnmount(() => window.removeEventListener('hashchange', updatePage))
    document.querySelector('meta[name="description"]').content = t('page.description')
    return { page, query, tools, filteredTools, icons, t, version: SmallToolsVersion }
  },
}).mount('#app')
