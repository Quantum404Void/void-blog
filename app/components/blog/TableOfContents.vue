<template>
  <nav v-if="headings.length > 0" class="toc">
    <p class="toc-title"><span style="color:var(--color-neon-green)">&#9658;</span> 目录</p>
    <ul>
      <li
        v-for="h in headings"
        :key="h.slug"
        :class="['toc-item', `toc-h${h.depth}`, { active: activeSlug === h.slug }]"
      >
        <a :href="`#${h.slug}`" @click.prevent="scrollTo(h.slug)">
          <span v-if="h.depth === 3" class="toc-h3-dot">·</span>
          {{ h.text }}
        </a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
defineOptions({ name: 'TableOfContents' })

import { ref, onMounted, onUnmounted } from 'vue'

interface Heading { depth: number; slug: string; text: string }
const props = defineProps<{ headings: Heading[] }>()

const activeSlug = ref('')

function scrollTo(slug: string) {
  const el = document.getElementById(slug)
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

function onScroll() {
  const headingEls = props.headings
    .map(h => document.getElementById(h.slug))
    .filter(Boolean) as HTMLElement[]

  const scrollY = window.scrollY + 120
  for (let i = headingEls.length - 1; i >= 0; i--) {
    if (headingEls[i].offsetTop <= scrollY) {
      activeSlug.value = props.headings[i].slug
      return
    }
  }
  activeSlug.value = props.headings[0]?.slug ?? ''
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.toc {
  position: sticky;
  top: 5rem;
  max-height: calc(100vh - 7rem);
  overflow-y: auto;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  padding: 1rem;
  border: 1px solid var(--color-void-border);
  border-radius: 0.75rem;
  background: rgba(19,19,31,0.6);
  backdrop-filter: blur(8px);
  scrollbar-width: thin;
  scrollbar-color: rgba(0,212,255,0.2) transparent;
}
.toc-title {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.toc ul { list-style: none; padding: 0; margin: 0; }
.toc-item { margin: 0.1rem 0; }
.toc-item a {
  color: var(--color-text-muted);
  text-decoration: none;
  line-height: 1.55;
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  transition: color 0.15s, padding-left 0.15s;
  border-left: 2px solid transparent;
  padding-left: 0.6rem;
  font-size: 0.7rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toc-item.active a {
  color: var(--color-neon-cyan);
  border-left-color: var(--color-neon-cyan);
  text-shadow: 0 0 6px rgba(0,212,255,0.4);
  padding-left: 0.9rem;
}
.toc-item a:hover {
  color: var(--color-text-secondary);
  padding-left: 0.9rem;
}
/* h3 内嵌级 */
.toc-h3 { }
.toc-h3 a {
  padding-left: 1.25rem;
  font-size: 0.65rem;
  opacity: 0.75;
}
.toc-h3.active a {
  padding-left: 1.5rem;
  opacity: 1;
  border-left-color: rgba(0,212,255,0.6);
  color: rgba(0,212,255,0.8);
}
.toc-h3 a:hover {
  padding-left: 1.5rem;
  opacity: 1;
}
.toc-h3-dot {
  color: var(--color-void-muted);
  flex-shrink: 0;
  font-size: 0.8rem;
}
</style>
