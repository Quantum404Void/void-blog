<template>
  <NuxtPwaManifest />
  <NuxtLayout>
    <NuxtPage :transition="pageTransition" />
  </NuxtLayout>
  <GlobalActions />
</template>

<script setup lang="ts">
const pageTransition = {
  name: 'page',
  mode: 'default',
  appear: true,
  onEnter(el: Element, done: () => void) {
    if (import.meta.server) { done(); return }
    useGsap().then(bundle => {
      if (!bundle) { done(); return }
      bundle.gsap.fromTo(el,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', onComplete: done }
      )
    })
  },
  onLeave(el: Element, done: () => void) {
    if (import.meta.server) { done(); return }
    useGsap().then(bundle => {
      if (!bundle) { done(); return }
      bundle.gsap.to(el,
        { opacity: 0, duration: 0.15, ease: 'power1.in', onComplete: done }
      )
    })
  },
}
</script>

<style>
/* fallback for browsers before gsap loads */
.page-enter-from { opacity: 0; }
.page-leave-to   { opacity: 0; }
.page-leave-active {
  position: absolute;
  width: 100%;
}
</style>
