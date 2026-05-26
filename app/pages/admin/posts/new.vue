<template>
  <AdminEditor :is-new="true" />
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
const { siteName } = useSiteConfig()
useSeoMeta({ title: `新建文章 | Admin | ${siteName}`, robots: 'noindex' })
</script>
