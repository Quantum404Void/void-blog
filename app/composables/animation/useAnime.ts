/**
 * useAnime — SSR 安全的 Anime.js 懒加载 composable（模块级单例）
 */
import type anime from 'animejs'

let _animePromise: Promise<typeof anime> | null = null

export function useAnime(): Promise<typeof anime | null> {
  if (import.meta.server) return Promise.resolve(null)

  if (!_animePromise) {
    _animePromise = import('animejs').then(m => m.default)
  }

  return _animePromise
}
