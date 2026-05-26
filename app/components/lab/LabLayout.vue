<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="crumbItems" />
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div class="mb-6">
        <h1 class="font-mono text-xl sm:text-2xl font-bold mb-1" :style="`color:${accent}`">
          <span class="text-[var(--color-text-muted)] font-normal text-base">~/lab/ </span>{{ title }}
        </h1>
        <p v-if="desc" class="font-mono text-xs text-[var(--color-text-muted)]">{{ desc }}</p>
      </div>
      <slot />
    </div>
    <AppFooter />
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
