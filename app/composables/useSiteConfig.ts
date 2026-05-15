// composables/useSiteConfig.ts
// 统一读取站点配置，避免硬编码分散在各文件
export function useSiteConfig() {
  const config = useRuntimeConfig()
  return {
    siteUrl:         config.public.siteUrl as string,
    siteName:        config.public.siteName as string,
    siteDescription: config.public.siteDescription as string,
    authorName:      config.public.authorName as string,
    authorEmail:     config.public.authorEmail as string,
    authorGithub:    config.public.authorGithub as string,
    authorInitial:   config.public.authorInitial as string,
    authorMotto:     config.public.authorMotto as string,
  }
}
