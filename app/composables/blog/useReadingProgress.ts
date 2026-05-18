/**
 * useReadingProgress — 文章阅读进度持久化 composable
 * 监听 scroll，保存进度到 localStorage，提供"继续阅读"跳转。
 */

export interface ReadingProgress {
  /** 百分比 0-100 */
  pct: number
  /** 页面 Y 坐标 */
  y: number
}

/** 最小记录进度（%），避免刚进来就存 */
const MIN_RECORD_PCT = 5
/** 最大记录进度（%），接近末尾不再提示继续 */
const MAX_RECORD_PCT = 95

export function useReadingProgress(slug: string) {
  const saved = useLocalStorage<ReadingProgress | null>(
    `reading-progress-${slug}`,
    null,
  )

  const bar = reactive({
    show: saved.value
      ? (saved.value.pct > MIN_RECORD_PCT && saved.value.pct < MAX_RECORD_PCT)
      : false,
    pct: saved.value?.pct ?? 0,
    savedY: saved.value?.y ?? 0,
  })

  function onScroll() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    if (docHeight <= 0) return
    const pct = Math.round((window.scrollY / docHeight) * 100)
    if (pct > MIN_RECORD_PCT) saved.value = { pct, y: window.scrollY }
  }

  function jumpToSaved() {
    window.scrollTo({ top: bar.savedY, behavior: 'smooth' })
    bar.show = false
  }

  onMounted(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
  })

  return { bar, jumpToSaved }
}
