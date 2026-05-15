// composables/useMarkdown.client.ts
// SSR: 不存在（.client.ts 不加入服务端 bundle）
// Client: 通过 nuxtApp.$buildMd 使用 Shiki

export function toSlug(text: string) {
  return text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '')
}

export function useMarkdown() {
  const nuxtApp = useNuxtApp()
  return {
    buildMd: (nuxtApp.$buildMd as () => Promise<any>),
    toSlug,
  }
}
