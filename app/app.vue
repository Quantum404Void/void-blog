<template>
  <NuxtPwaManifest />
  <NuxtLayout>
    <NuxtPage :transition="false" />
  </NuxtLayout>
  <GlobalActions />
</template>

<script setup lang="ts">
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
</script>

<style>
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
