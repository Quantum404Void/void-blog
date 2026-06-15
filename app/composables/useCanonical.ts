// composables/useCanonical.ts
export function useCanonical(path: string = '') {
  const { siteUrl } = useSiteConfig()
  useHead({
    link: [{ rel: 'canonical', href: `${siteUrl}${path}` }]
  })
}
