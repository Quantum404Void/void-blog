<template>
  <!-- 新建文章 = 复用编辑页，slug 为 undefined -->
  <AdminPostsSlug />
</template>

<script setup lang="ts">
// 直接复用编辑组件，route.params.slug = undefined → isNew = true
import AdminPostsSlug from './[slug].vue'
definePageMeta({ layout: false })
</script>
