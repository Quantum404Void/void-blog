<script setup lang="ts">
import { xuanweiGroups, xuanweiModules } from '~/features/xuanwei/modules'

const groupedModules = computed(() => xuanweiGroups.map(group => ({
  group,
  modules: xuanweiModules.filter(module => module.group === group),
})))
</script>

<template>
  <div class="xw-home">
    <section class="xw-hero" aria-labelledby="xuanwei-title">
      <div class="xw-seal" aria-hidden="true">玄</div>
      <div class="xw-hero-copy">
        <p>观象 · 明理 · 知微</p>
        <h1 id="xuanwei-title">玄微</h1>
        <span>十五种术数体系，一座可审阅的古籍目录。</span>
      </div>
      <div class="xw-hero-note">
        <strong>规则，不是预言</strong>
        <p>以传统资料和确定性算法组织结果，清楚呈现输入、推演与解释边界。</p>
      </div>
    </section>

    <section v-for="section in groupedModules" :key="section.group" class="xw-module-section">
      <header>
        <h2>{{ section.group }}</h2>
        <span>{{ section.modules.length }} 项</span>
      </header>
      <div class="xw-module-list">
        <NuxtLink v-for="module in section.modules" :key="module.id" :to="`/xuanwei/${module.id}`" class="xw-module-item">
          <span class="xw-module-glyph" aria-hidden="true">{{ module.glyph }}</span>
          <span class="xw-module-copy">
            <strong>{{ module.name }}</strong>
            <small>{{ module.description }}</small>
          </span>
          <span class="xw-module-arrow" aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </section>

    <p class="xw-disclaimer">本模块仅供文化研究与娱乐参考，不具备科学预测能力，请勿作为重要决策依据。</p>
  </div>
</template>

<style scoped>
.xw-home { width: min(100%, 68rem); margin-inline: auto; padding-bottom: 3rem; }
.xw-hero { display: grid; grid-template-columns: auto minmax(0, 1fr) minmax(15rem, 20rem); align-items: center; gap: 1.5rem; padding: 2.25rem 0 2.5rem; border-bottom: 1px solid var(--color-void-border); }
.xw-seal { display: grid; width: 4.5rem; height: 4.5rem; place-items: center; border: 1px solid color-mix(in srgb, var(--xw-mark) 70%, transparent); border-radius: .75rem; color: var(--xw-mark); background: color-mix(in srgb, var(--xw-mark) 9%, transparent); font-family: var(--xw-serif); font-size: 2rem; font-weight: 700; }
.xw-hero-copy p { margin: 0 0 .25rem; color: var(--xw-accent); font-family: var(--xw-serif); font-size: .75rem; letter-spacing: .18em; }
.xw-hero-copy h1 { margin: 0; color: var(--color-text-primary); font-family: var(--xw-serif); font-size: clamp(2rem, 5vw, 2.8rem); letter-spacing: .12em; line-height: 1.25; }
.xw-hero-copy span { display: block; margin-top: .35rem; color: var(--color-text-secondary); font-size: .9rem; }
.xw-hero-note { padding-left: 1.25rem; border-left: 1px solid var(--color-void-border); }
.xw-hero-note strong { color: var(--color-text-primary); font-size: .8rem; }
.xw-hero-note p { margin: .35rem 0 0; color: var(--color-text-muted); font-size: .75rem; line-height: 1.7; }
.xw-module-section { padding-top: 2rem; }
.xw-module-section > header { display: flex; align-items: baseline; justify-content: space-between; padding: 0 .5rem .75rem; }
.xw-module-section h2 { margin: 0; color: var(--color-text-primary); font-family: var(--xw-serif); font-size: 1.15rem; letter-spacing: .05em; }
.xw-module-section header span { color: var(--color-text-muted); font-size: .7rem; }
.xw-module-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-block: 1px solid var(--color-void-border); }
.xw-module-item { display: flex; min-height: 5.25rem; align-items: center; gap: .85rem; padding: .9rem 1rem; color: inherit; text-decoration: none; transition: background-color 180ms ease, transform 180ms ease; }
.xw-module-item:nth-child(odd) { border-right: 1px solid var(--color-void-border); }
.xw-module-item:not(:nth-last-child(-n + 2)) { border-bottom: 1px solid var(--color-void-border); }
.xw-module-item:hover { background: var(--color-void-muted); transform: translateX(2px); }
.xw-module-item:focus-visible { outline: 2px solid var(--xw-accent); outline-offset: -2px; }
.xw-module-glyph { display: grid; width: 2.25rem; height: 2.25rem; flex: 0 0 2.25rem; place-items: center; border-radius: 50%; color: var(--xw-accent); background: var(--xw-accent-soft); font-family: var(--xw-serif); font-weight: 700; }
.xw-module-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: .2rem; }
.xw-module-copy strong { color: var(--color-text-primary); font-family: var(--xw-serif); font-size: .95rem; }
.xw-module-copy small { overflow: hidden; color: var(--color-text-muted); font-size: .72rem; text-overflow: ellipsis; white-space: nowrap; }
.xw-module-arrow { color: var(--color-text-muted); transition: color 180ms ease, transform 180ms ease; }
.xw-module-item:hover .xw-module-arrow { color: var(--xw-accent); transform: translateX(2px); }
.xw-disclaimer { margin: 1.5rem auto 0; color: var(--color-text-muted); font-size: .72rem; line-height: 1.7; text-align: center; }
@media (max-width: 48rem) { .xw-hero { grid-template-columns: auto minmax(0, 1fr); padding-block: 1.5rem; } .xw-hero-note { grid-column: 1 / -1; padding: .9rem 0 0; border-top: 1px solid var(--color-void-border); border-left: 0; } }
@media (max-width: 36rem) { .xw-seal { width: 3.5rem; height: 3.5rem; font-size: 1.5rem; } .xw-module-list { grid-template-columns: 1fr; } .xw-module-item:nth-child(odd) { border-right: 0; } .xw-module-item:not(:last-child) { border-bottom: 1px solid var(--color-void-border); } }
</style>
