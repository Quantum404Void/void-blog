import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    // lab/index 有自己的 sessionStorage scroll 恢复逻辑
    if (to.path === '/lab' && savedPosition) {
      return false
    }

    if (savedPosition) {
      // 浏览器返回/前进：恢复之前位置（延迟等待 DOM 渲染完成）
      return new Promise(resolve => {
        setTimeout(() => resolve(savedPosition), 80)
      })
    }

    if (to.hash) {
      // 从带 hash 的页面（如 /blog/xxx#section）返回到上一页时，不处理 hash
      // 只有主动导航到含 hash 的路由时才滚到锚点
      const isBack = !!savedPosition
      if (isBack) return false
      // 等 DOM 渲染后再滚到锚点（动态内容用 onMounted 渲染，需要延迟）
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ el: to.hash, top: 80, behavior: 'smooth' })
        }, 300)
      })
    }

    // 普通前进：回到顶部
    return { top: 0, behavior: 'instant' }
  },
}
