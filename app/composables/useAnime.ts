/**
 * useAnime — SSR 安全的 Anime.js 懒加载 composable
 *
 * 用法：
 *   const anime = await useAnime()
 *   anime({ targets: '.card', opacity: [0, 1], delay: anime.stagger(60) })
 */
export async function useAnime() {
  if (import.meta.server) return null as any

  const { default: anime } = await import('animejs')
  return anime
}
