<template>
  <NuxtPwaManifest />
  <NuxtLayout>
    <NuxtPage :transition="pageTransition" />
  </NuxtLayout>
  <GlobalActions />
</template>

<script setup lang="ts">
// 页面切换过渡：新页进入时淡入，不等旧页离开（避免 out-in 的黑屏间隙）
const pageTransition = {
  name: 'page',
  mode: 'default',   // 并行，不用 out-in
  appear: true,
}
</script>

<style>
.page-enter-active {
  transition: opacity 0.15s ease;
}
.page-leave-active {
  transition: opacity 0.1s ease;
  position: absolute;   /* 脱离文档流，防止两页叠加时撑高页面 */
  width: 100%;
}
.page-enter-from {
  opacity: 0;
}
.page-leave-to {
  opacity: 0;
}
</style>
