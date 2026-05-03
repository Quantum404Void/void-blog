<template>
  <div class="min-h-screen bg-[var(--color-void)] flex items-center justify-center px-6">
    <div class="font-mono max-w-lg w-full">
      <!-- ASCII art -->
      <pre class="text-[var(--color-neon-green)] text-[10px] leading-tight mb-6 opacity-80 select-none">{{ is404 ? skull : errorAscii }}</pre>

      <!-- Terminal output -->
      <div class="space-y-1 text-sm mb-8">
        <div>
          <span class="text-[var(--color-neon-green)]">root@void</span>
          <span class="text-[var(--color-text-muted)]">:~$ </span>
          <span class="text-[var(--color-text-primary)]">cat {{ currentPath }}</span>
        </div>
        <div class="text-[var(--color-neon-pink)]">
          cat: {{ currentPath }}: No such file or directory
        </div>
        <div class="mt-3">
          <span class="text-[var(--color-neon-green)]">root@void</span>
          <span class="text-[var(--color-text-muted)]">:~$ </span>
          <span class="text-[var(--color-text-primary)]">echo $?</span>
        </div>
        <div class="text-[var(--color-neon-cyan)]">{{ error?.statusCode ?? 500 }}</div>
        <div class="mt-3">
          <span class="text-[var(--color-neon-green)]">root@void</span>
          <span class="text-[var(--color-text-muted)]">:~$ </span>
          <span class="text-[var(--color-text-primary)]">cd ~/<span class="cursor-blink"></span></span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-3">
        <NuxtLink href="/"
          class="font-mono text-xs px-4 py-2 border border-[rgba(0,255,136,0.4)] text-[var(--color-neon-green)] bg-[rgba(0,255,136,0.06)] rounded-lg hover:bg-[rgba(0,255,136,0.12)] transition-all">
          ~/home
        </NuxtLink>
        <NuxtLink href="/blog"
          class="font-mono text-xs px-4 py-2 border border-[var(--color-void-border)] text-[var(--color-text-muted)] rounded-lg hover:border-[rgba(0,212,255,0.3)] hover:text-[var(--color-neon-cyan)] transition-all">
          ~/blog
        </NuxtLink>
        <NuxtLink href="/search"
          class="font-mono text-xs px-4 py-2 border border-[var(--color-void-border)] text-[var(--color-text-muted)] rounded-lg hover:border-[rgba(0,212,255,0.3)] hover:text-[var(--color-neon-cyan)] transition-all">
          ~/search
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message: string } | null }>()
const { siteName } = useSiteConfig()
useHead({ title: `${props.error?.statusCode ?? 'Error'} | ${siteName}` })

const is404 = computed(() => props.error?.statusCode === 404)
const currentPath = useRoute().path

const skull = `
    ░░░░░░░░░░░░░░░░░░░░░░░
    ░░  ┌─────────────┐  ░░
    ░░  │  4  0  4    │  ░░
    ░░  │  ╔═══════╗  │  ░░
    ░░  │  ║ ◉   ◉ ║  │  ░░
    ░░  │  ║   ▲   ║  │  ░░
    ░░  │  ║  ───  ║  │  ░░
    ░░  │  ╚═══════╝  │  ░░
    ░░  │  NOT FOUND  │  ░░
    ░░  └─────────────┘  ░░
    ░░░░░░░░░░░░░░░░░░░░░░░`.trim()

const errorAscii = `
    ╔═══════════════════╗
    ║   SYSTEM ERROR    ║
    ║                   ║
    ║  ⚠  ${props.error?.statusCode ?? 500}  ⚠  ║
    ║                   ║
    ║ KERNEL PANIC      ║
    ╚═══════════════════╝`.trim()
</script>
