/**
 * useGsap — SSR 安全的 GSAP 懒加载 composable
 *
 * GSAP + TextPlugin + ScrollTrigger 只在客户端按需注册。
 * 用法：
 *   const { gsap, ScrollTrigger } = await useGsap()
 */
export async function useGsap() {
  if (import.meta.server) {
    return { gsap: null as any, ScrollTrigger: null as any }
  }

  const [{ gsap }, { TextPlugin }, { ScrollTrigger }] = await Promise.all([
    import('gsap'),
    import('gsap/TextPlugin'),
    import('gsap/ScrollTrigger'),
  ])

  gsap.registerPlugin(TextPlugin, ScrollTrigger)

  return { gsap, ScrollTrigger }
}
