<template>
  <NuxtPwaManifest />
  <NuxtLayout>
    <NuxtPage :transition="pageTransition" />
  </NuxtLayout>
  <GlobalActions />
</template>

<script setup lang="ts">
const prefersReducedMotion = useReducedMotion()
const route = useRoute()

useHead(() => ({
  bodyAttrs: {
    class: route.path.startsWith('/admin')
      ? 'admin-route'
      : route.path.startsWith('/lab/tools/')
        ? 'lab-tools-route'
        : route.path.startsWith('/lab/games/') ? 'lab-games-route' : '',
  },
}))

const pageTransition = {
  name: 'page',
  mode: 'default',
  appear: true,
  onEnter(el: Element, done: () => void) {
    if (import.meta.server || prefersReducedMotion.value) { done(); return }
    useGsap().then(bundle => {
      if (!bundle) { done(); return }
      bundle.gsap.fromTo(el,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', onComplete: done }
      )
    })
  },
  onLeave(el: Element, done: () => void) {
    if (import.meta.server || prefersReducedMotion.value) { done(); return }
    useGsap().then(bundle => {
      if (!bundle) { done(); return }
      bundle.gsap.to(el,
        { opacity: 0, duration: 0.15, ease: 'power1.in', onComplete: done }
      )
    })
  },
} as const
</script>

<style>
/* fallback for browsers before gsap loads */
.page-enter-from { opacity: 0; }
.page-leave-to   { opacity: 0; }
.page-leave-active {
  position: absolute;
  width: 100%;
}

@media (max-width: 640px) {
  .lab-tools-route button:not([data-compact]),
  .lab-tools-route input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="color"]),
  .lab-tools-route select {
    min-height: 44px;
  }

  .admin-route button,
  .admin-route input:not([type="checkbox"]):not([type="radio"]),
  .admin-route select,
  .admin-route a.admin-action {
    min-height: 44px;
  }
}
</style>
