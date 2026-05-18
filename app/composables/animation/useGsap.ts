/**
 * useGsap — SSR 安全的 GSAP 懒加载 composable（模块级单例，只 import 一次）
 */
import type { gsap as GsapType } from 'gsap'
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger'

export interface GsapBundle {
  gsap: typeof GsapType
  ScrollTrigger: typeof ScrollTriggerType
}

// 模块级缓存 Promise —— 整个应用生命周期只初始化一次
let _gsapPromise: Promise<GsapBundle> | null = null

export function useGsap(): Promise<GsapBundle | null> {
  if (import.meta.server) return Promise.resolve(null)

  if (!_gsapPromise) {
    _gsapPromise = Promise.all([
      import('gsap'),
      import('gsap/TextPlugin'),
      import('gsap/ScrollTrigger'),
    ]).then(([{ gsap }, { TextPlugin }, { ScrollTrigger }]) => {
      gsap.registerPlugin(TextPlugin, ScrollTrigger)
      return { gsap, ScrollTrigger }
    })
  }

  return _gsapPromise
}
