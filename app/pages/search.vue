<script setup lang="ts">
definePageMeta({ layout: false })
const route = useRoute()
await navigateTo({ path: '/explore', query: { ...route.query, tab: 'search' } }, { redirectCode: 301, replace: true })
</script>
