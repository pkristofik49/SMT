<script setup>
import { computed, ref } from 'vue'

const query = ref('')
const tools = [
  { id: 'text', name: 'Práce s textem', category: 'TEXT', description: 'Počítání znaků, změna velikosti písmen a další drobné úpravy textu.', icon: 'text', color: 'green' },
  { id: 'json', name: 'JSON formátovač', category: 'VÝVOJ', description: 'Přehledné formátování a kontrola JSON dat bez zbytečného hledání.', icon: 'code', color: 'blue' },
  { id: 'units', name: 'Převodník jednotek', category: 'PŘEVODY', description: 'Délka, hmotnost nebo teplota. Jednoduché převody na jednom místě.', icon: 'arrows', color: 'orange' },
  { id: 'colors', name: 'Barvy a palety', category: 'DESIGN', description: 'Převody barevných kódů a prostor pro vaše oblíbené odstíny.', icon: 'palette', color: 'purple' },
  { id: 'time', name: 'Datum a čas', category: 'ČAS', description: 'Rozdíly mezi daty a převody času pro každodenní plánování.', icon: 'clock', color: 'pink' },
  { id: 'password', name: 'Generátor hesel', category: 'GENERÁTORY', description: 'Náhodná hesla s délkou a znaky podle vašich potřeb.', icon: 'key', color: 'cyan' },
]

const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const filteredTools = computed(() => {
  const search = normalize(query.value.trim())
  return tools.filter((tool) => normalize(`${tool.name} ${tool.category} ${tool.description}`).includes(search))
})

const icons = {
  text: ['M4 6h16M12 6v14M8 20h8'],
  code: ['m8 8-4 4 4 4m8-8 4 4-4 4m-3-11-2 14'],
  arrows: ['M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4'],
  palette: ['M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.4-3.4 1.6 1.6 0 0 1 1.1-2.6H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z', 'M7.5 11h.01M10 7.5h.01M15 7.5h.01M17.5 11h.01'],
  clock: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M12 7v5l3 2'],
  key: ['M14 14a6 6 0 1 0-4-4L3 17v4h4v-3h3l4-4Z', 'M16 8h.01'],
}
</script>

<template>
  <div class="page-shell">
    <header class="site-header">
      <a class="brand" href="./" aria-label="Small Tools — úvodní stránka">
        <span class="brand-icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span>small<span class="brand-light">tools</span><span class="brand-dot">.</span></span>
      </a>
      <span class="header-note">Méně klikání. Více hotovo.</span>
    </header>

    <main id="main-content">
      <section class="intro" aria-labelledby="page-title">
        <span class="eyebrow"><span class="status-dot"></span> VAŠE KAŽDODENNÍ VÝBAVA</span>
        <h1 id="page-title">Malé nástroje.<br /><span>Velká pomoc.</span></h1>
        <p>Praktické drobnosti, které usnadní den.<br class="desktop-break" /> Přehledně, jednoduše a na jednom místě.</p>
      </section>

      <section class="tool-section" aria-labelledby="tools-title">
        <div class="section-heading">
          <div class="section-title"><h2 id="tools-title">Nástroje</h2><span class="count">{{ tools.length }}</span></div>
          <div class="search-box">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
            <label class="sr-only" for="tool-search">Hledat nástroj</label>
            <input id="tool-search" v-model="query" type="search" placeholder="Najít nástroj…" autocomplete="off" />
          </div>
        </div>

        <div class="tool-grid">
          <article v-for="tool in filteredTools" :key="tool.id" class="tool-card" :class="tool.color" :aria-labelledby="`title-${tool.id}`">
            <div class="card-top">
              <span class="tool-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path v-for="(path, index) in icons[tool.icon]" :key="index" :d="path" /></svg></span>
              <span class="coming-soon">Připravujeme</span>
            </div>
            <div class="card-copy">
              <span class="category">{{ tool.category }}</span>
              <h3 :id="`title-${tool.id}`">{{ tool.name }}</h3>
              <p>{{ tool.description }}</p>
            </div>
          </article>
        </div>
        <div v-if="filteredTools.length === 0" class="empty-state" role="status">
          <h3>Takový nástroj tu zatím není.</h3>
          <p>Zkuste jiný název nebo kratší výraz.</p>
          <button type="button" @click="query = ''">Zobrazit všechny nástroje</button>
        </div>
        <p class="roadmap-note"><span aria-hidden="true">＋</span> Tohle je teprve začátek. Další nástroje postupně přibudou.</p>
      </section>
    </main>

    <footer class="site-footer"><span>smalltools<span class="brand-dot">.</span></span><span>Malá pomoc pro velké i malé úkoly.</span></footer>
  </div>
</template>
