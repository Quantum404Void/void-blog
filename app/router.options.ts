import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  // 返回时恢复滚动位置，前进时滚到顶部
  scrollBehavior(to, from, savedPosition) {
    // lab/index 有自己的 sessionStorage scroll 恢复，不用 router savedPosition
    if (to.path === '/lab' && savedPosition) {
      return false
    }
    if (savedPosition) {
      // 浏览器返回：恢复之前的滚动位置
      return new Promise(resolve => {
        setTimeout(() => resolve(savedPosition), 50)
      })
    }
    if (to.hash) {
      // 带 hash 的导航：滚到锚点
      return { el: to.hash, top: 80, behavior: 'smooth' }
    }
    // 普通前进：回到顶部
    return { top: 0, behavior: 'instant' }
  },
}
