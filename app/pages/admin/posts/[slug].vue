<template>
  <AdminEditor :is-new="false" :initial-slug="slug" />
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
const { siteName } = useSiteConfig()
const route = useRoute()
const slug = route.params.slug as string
useSeoMeta({ title: `编辑文章 | Admin | ${siteName}`, robots: 'noindex' })
</script>
