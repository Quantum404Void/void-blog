<template>
  <div class="min-h-screen bg-[var(--color-void)] flex flex-col">
    <AppNav :crumbs="crumbItems" />
    <main class="w-full max-w-5xl mx-auto flex-1 px-5 sm:px-8 py-10 sm:py-14">
      <header class="mb-8 border-b border-[var(--color-void-border)] pb-7">
        <p class="mb-2 font-mono text-xs text-[var(--color-text-muted)]">~/lab/{{ section }}/</p>
        <h1 class="font-mono text-2xl sm:text-3xl font-bold tracking-[-0.025em] mb-2" :style="{ color: accent }">
          {{ title }}
        </h1>
        <p v-if="desc" class="max-w-2xl text-sm sm:text-base leading-relaxed text-[var(--color-text-secondary)] text-pretty">{{ desc }}</p>
      </header>
      <slot />
    </main>
    <AppFooter maxW="max-w-5xl" />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'LabLayout' })

const props = withDefaults(defineProps<{
  title: string
  desc?: string
  accent?: string
  /** lab sub-path for breadcrumb, e.g. 'tools' | 'games' */
  section?: 'tools' | 'games'
}>(), {
  accent: 'var(--color-neon-cyan)',
  section: 'tools',
})

const crumbItems = computed(() => [
  { label: 'lab', href: '/lab' },
  { label: props.section, href: '/lab' },
  { label: props.title },
])
</script>
