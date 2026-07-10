<template>
  <nav v-if="headings.length > 0" class="toc" aria-label="文章章节">
    <p class="toc-title"><span style="color:var(--color-neon-green)">&#9658;</span> 本文目录</p>
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

interface Heading { depth: number; slug: string; text: string }
const props = defineProps<{ headings: Heading[] }>()

const activeSlug = shallowRef('')
const prefersReducedMotion = useReducedMotion()

function scrollTo(slug: string) {
  const el = document.getElementById(slug)
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top: y, behavior: prefersReducedMotion.value ? 'auto' : 'smooth' })
  }
}

function onScroll() {
  const headingEls = props.headings
    .map(h => document.getElementById(h.slug))
    .filter(Boolean) as HTMLElement[]

  const scrollY = window.scrollY + 120
  for (let i = headingEls.length - 1; i >= 0; i--) {
    const heading = headingEls[i]
    const sourceHeading = props.headings[i]
    if (heading && sourceHeading && heading.offsetTop <= scrollY) {
      activeSlug.value = sourceHeading.slug
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
  padding: 0.25rem 0 0.25rem 1rem;
  border-left: 1px solid var(--color-void-border);
  scrollbar-width: thin;
  scrollbar-color: rgba(0,212,255,0.2) transparent;
}
.toc-title {
  font-size: 0.75rem;
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
  padding: 0.45rem 0.5rem;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toc-item.active a {
  color: var(--color-neon-cyan);
  background: rgba(0,212,255,0.07);
  padding-left: 0.75rem;
}
.toc-item a:hover {
  color: var(--color-text-secondary);
  padding-left: 0.75rem;
}
/* h3 内嵌级 */
.toc-h3 { }
.toc-h3 a {
  padding-left: 1.25rem;
  font-size: 0.7rem;
  opacity: 0.82;
}
.toc-h3.active a {
  padding-left: 1.5rem;
  opacity: 1;
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
