/**
 * useGsap — SSR 安全的 GSAP 懒加载 composable
 *
 * GSAP + TextPlugin + ScrollTrigger 只在客户端按需注册。
 * 用法：
 *   const { gsap, ScrollTrigger } = await useGsap()
 *   if (!gsap) return   // SSR 环境直接返回 null
 */

import type { gsap as GsapType } from 'gsap'
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger'

export interface GsapBundle {
  gsap: typeof GsapType
  ScrollTrigger: typeof ScrollTriggerType
}

export async function useGsap(): Promise<GsapBundle | null> {
  if (import.meta.server) return null

  const [{ gsap }, { TextPlugin }, { ScrollTrigger }] = await Promise.all([
    import('gsap'),
    import('gsap/TextPlugin'),
    import('gsap/ScrollTrigger'),
  ])

  gsap.registerPlugin(TextPlugin, ScrollTrigger)

  return { gsap, ScrollTrigger }
}
