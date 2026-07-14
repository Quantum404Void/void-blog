<script setup lang="ts">
import { xuanweiGroups, xuanweiModuleMap, xuanweiModules } from '~/features/xuanwei/modules'

const props = defineProps<{ module?: string }>()
const drawerOpen = shallowRef(false)
const activeModule = computed(() => props.module ? xuanweiModuleMap.get(props.module) : undefined)
const groupedModules = computed(() => xuanweiGroups.map(group => ({
  group,
  modules: xuanweiModules.filter(module => module.group === group),
})))

watch(() => props.module, () => { drawerOpen.value = false })

</script>

<template>
  <div class="xw-root">
      <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: '玄微', href: '/xuanwei' }, ...(activeModule ? [{ label: activeModule.name }] : [])]" />

      <header class="xw-header">
        <div class="layout-shell layout-wide xw-header-inner">
          <button type="button" class="xw-menu-button" aria-label="打开玄微导航" :aria-expanded="drawerOpen" @click="drawerOpen = true">☰</button>
          <NuxtLink to="/xuanwei" class="xw-brand">
            <span aria-hidden="true">玄</span>
            <span><strong>玄微</strong><small>术数规则引擎</small></span>
          </NuxtLink>
          <p>{{ activeModule?.name ?? '观象以明理，知微而见著' }}</p>
          <NuxtLink to="/lab" class="xw-exit">返回实验室</NuxtLink>
        </div>
      </header>

      <div class="layout-shell layout-wide xw-layout">
        <aside class="xw-sidebar" aria-label="玄微模块导航">
          <NuxtLink to="/xuanwei" class="xw-nav-home" :aria-current="!module ? 'page' : undefined">玄微首页</NuxtLink>
          <section v-for="section in groupedModules" :key="section.group">
            <h2>{{ section.group }}</h2>
            <NuxtLink v-for="item in section.modules" :key="item.id" :to="`/xuanwei/${item.id}`" :aria-current="module === item.id ? 'page' : undefined">
              <span aria-hidden="true">{{ item.glyph }}</span>{{ item.name }}
            </NuxtLink>
          </section>
          <p>规则引擎自动生成<br>仅供文化研究与娱乐参考</p>
        </aside>

        <main class="xw-content">
          <XuanweiHome v-if="!module" />
          <XuanweiViewHost v-else :module="module" />
        </main>
      </div>

      <Teleport to="body">
        <Transition name="xw-drawer">
          <div v-if="drawerOpen" class="xw-drawer-layer">
            <button class="xw-drawer-backdrop" type="button" aria-label="关闭玄微导航" @click="drawerOpen = false" />
            <aside class="xw-drawer" aria-label="玄微移动导航">
              <header><strong>玄微</strong><button type="button" aria-label="关闭导航" @click="drawerOpen = false">×</button></header>
              <NuxtLink to="/xuanwei" :aria-current="!module ? 'page' : undefined">玄微首页</NuxtLink>
              <template v-for="section in groupedModules" :key="section.group">
                <h2>{{ section.group }}</h2>
                <NuxtLink v-for="item in section.modules" :key="item.id" :to="`/xuanwei/${item.id}`" :aria-current="module === item.id ? 'page' : undefined">{{ item.glyph }} {{ item.name }}</NuxtLink>
              </template>
            </aside>
          </div>
        </Transition>
      </Teleport>
  </div>
</template>

<style>
.xw-root {
  --xw-serif: 'Noto Serif SC', 'Source Han Serif SC', STSong, SimSun, serif;
  --xw-accent: #74b8a4;
  --xw-accent-soft: color-mix(in srgb, var(--xw-accent) 13%, transparent);
  --xw-mark: #d98269;
  min-height: 100vh;
  background: var(--color-void);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
}
.xw-root *, .xw-root *::before, .xw-root *::after { box-sizing: border-box; }
.xw-header { position: sticky; top: var(--app-nav-height, 0); z-index: 30; border-bottom: 1px solid var(--color-void-border); background: color-mix(in srgb, var(--color-void) 94%, transparent); backdrop-filter: blur(12px); }
.xw-header-inner { display: flex; min-height: 4rem; align-items: center; gap: 1rem; }
.xw-brand { display: flex; align-items: center; gap: .65rem; color: var(--color-text-primary); text-decoration: none; }
.xw-brand > span:first-child { display: grid; width: 2.1rem; height: 2.1rem; place-items: center; border-radius: .45rem; color: var(--color-void); background: var(--xw-mark); font-family: var(--xw-serif); font-weight: 700; }
.xw-brand > span:last-child { display: flex; flex-direction: column; line-height: 1.1; }
.xw-brand strong { font-family: var(--xw-serif); letter-spacing: .12em; }
.xw-brand small { margin-top: .2rem; color: var(--color-text-muted); font-size: .58rem; letter-spacing: .06em; }
.xw-header-inner > p { margin: 0; color: var(--color-text-muted); font-family: var(--xw-serif); font-size: .75rem; letter-spacing: .06em; }
.xw-exit { margin-left: auto; color: var(--color-text-muted); font-size: .72rem; text-decoration: none; }
.xw-exit:hover { color: var(--xw-accent); }
.xw-menu-button { display: none; width: 2.75rem; height: 2.75rem; border: 0; background: transparent; color: var(--color-text-primary); font-size: 1.1rem; }
.xw-layout { display: grid; min-height: calc(100vh - 8rem); grid-template-columns: 13.5rem minmax(0, 1fr); padding-inline: 0; }
.xw-sidebar { position: sticky; top: 8rem; height: calc(100vh - 8rem); overflow-y: auto; padding: 1.25rem .75rem 4rem; border-right: 1px solid var(--color-void-border); background: var(--color-void-card); }
.xw-sidebar section { margin-top: 1rem; }
.xw-sidebar h2, .xw-drawer h2 { margin: 0 0 .35rem; padding-inline: .7rem; color: var(--color-text-muted); font-size: .65rem; font-weight: 600; letter-spacing: .08em; }
.xw-sidebar a, .xw-drawer a { display: flex; min-height: 2.6rem; align-items: center; gap: .6rem; padding: .55rem .7rem; border-radius: .45rem; color: var(--color-text-secondary); font-size: .8rem; text-decoration: none; }
.xw-sidebar a:hover, .xw-sidebar a[aria-current='page'], .xw-drawer a:hover, .xw-drawer a[aria-current='page'] { color: var(--xw-accent); background: var(--xw-accent-soft); }
.xw-sidebar a span { width: 1.1rem; color: var(--color-text-muted); font-family: var(--xw-serif); text-align: center; }
.xw-sidebar > p { margin: 2rem .7rem 0; color: var(--color-text-muted); font-size: .62rem; line-height: 1.7; }
.xw-content { min-width: 0; padding: 0 clamp(1rem, 3vw, 2rem) 4rem; }
.xw-content > :not(.xw-home) { padding-top: 2rem; }
.xw-content .view-header h2, .xw-content > div > h2, .xw-content .pg > h2 { color: var(--color-text-primary); font-family: var(--xw-serif); letter-spacing: .04em; }
.xw-content .sub, .xw-content .view-subtitle { color: var(--color-text-muted) !important; }
.xw-drawer-layer { position: fixed; inset: 0; z-index: 100; }
.xw-drawer-backdrop { position: absolute; inset: 0; border: 0; background: rgb(0 0 0 / 55%); }
.xw-drawer { position: relative; width: min(19rem, 86vw); height: 100%; overflow-y: auto; padding: 1rem; border-right: 1px solid var(--color-void-border); background: var(--color-void-card); }
.xw-drawer header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; padding: .5rem .7rem; font-family: var(--xw-serif); }
.xw-drawer header button { width: 2.75rem; height: 2.75rem; border: 0; background: transparent; color: var(--color-text-primary); font-size: 1.5rem; }
.xw-drawer h2 { margin-top: 1rem; }
.xw-drawer-enter-active, .xw-drawer-leave-active { transition: opacity 180ms ease; }
.xw-drawer-enter-active .xw-drawer, .xw-drawer-leave-active .xw-drawer { transition: transform 180ms cubic-bezier(.22, 1, .36, 1); }
.xw-drawer-enter-from, .xw-drawer-leave-to { opacity: 0; }
.xw-drawer-enter-from .xw-drawer, .xw-drawer-leave-to .xw-drawer { transform: translateX(-100%); }
@media (max-width: 60rem) { .xw-layout { display: block; padding-inline: clamp(1rem, 4vw, 2rem); } .xw-sidebar { display: none; } .xw-content { padding-inline: 0; } .xw-menu-button { display: block; } .xw-header-inner > p { display: none; } }
@media (max-width: 36rem) { .xw-brand small, .xw-exit { display: none; } .xw-content > :not(.xw-home) { padding-top: 1.25rem; } }
@media (prefers-reduced-motion: reduce) { .xw-root *, .xw-root *::before, .xw-root *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
</style>
