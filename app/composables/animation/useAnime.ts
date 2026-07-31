/**
 * useAnime — SSR 安全的 Anime.js 懒加载 composable（模块级单例）
 */
type AnimeModule = typeof import('animejs')

let _animePromise: Promise<AnimeModule> | null = null

export function useAnime(): Promise<AnimeModule | null> {
  if (import.meta.server) return Promise.resolve(null)

  if (!_animePromise) {
    _animePromise = import('animejs')
  }

  return _animePromise
}
