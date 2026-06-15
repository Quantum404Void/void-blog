<template>
  <div class="skeleton-block" :style="{ width, height, borderRadius: radius }" />
</template>

<script setup lang="ts">
defineOptions({ name: 'Skeleton' })

withDefaults(defineProps<{
  width?: string
  height?: string
  radius?: string
}>(), {
  width: '100%',
  height: '1rem',
  radius: '0.375rem',
})
</script>

<style scoped>
.skeleton-block {
  background: linear-gradient(
    90deg,
    var(--color-void-card) 25%,
    rgba(30,30,50,0.8) 50%,
    var(--color-void-card) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  display: block;
}

@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
