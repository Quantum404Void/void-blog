<template>
  <NuxtPwaManifest />
  <NuxtLayout>
    <NuxtPage :transition="pageTransition" />
  </NuxtLayout>
  <GlobalActions />
</template>

<script setup lang="ts">
// 页面切换过渡：快速淡入（50ms），避免白屏闪烁
const pageTransition = {
  name: 'page',
  mode: 'out-in',
  appear: true,
}
</script>

<style>
/* 页面切换过渡 */
.page-enter-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.page-leave-active {
  transition: opacity 0.08s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.page-leave-to {
  opacity: 0;
}
</style>
