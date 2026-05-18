/**
 * useAnime — SSR 安全的 Anime.js 懒加载 composable
 *
 * 用法：
 *   const anime = await useAnime()
 *   if (!anime) return   // SSR 环境直接返回 null
 *   anime({ targets: '.card', opacity: [0, 1], delay: anime.stagger(60) })
 */

import type anime from 'animejs'

export async function useAnime(): Promise<typeof anime | null> {
  if (import.meta.server) return null

  const { default: animeJs } = await import('animejs')
  return animeJs
}
