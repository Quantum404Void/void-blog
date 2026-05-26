/**
 * useTts — 文章朗读 composable
 * 封装浏览器 SpeechSynthesis API，SSR 安全。
 */

export type TtsState = 'idle' | 'playing' | 'paused'

export interface UseTtsOptions {
  /** 朗读语言，默认 zh-CN */
  lang?: string
  /** 语速，默认 0.95 */
  rate?: number
}

export function useTts(options: UseTtsOptions = {}) {
  const { lang = 'zh-CN', rate = 0.95 } = options

  const supported = ref(false)
  const state = ref<TtsState>('idle')
  let utterance: SpeechSynthesisUtterance | null = null

  onMounted(() => {
    supported.value = 'speechSynthesis' in window
  })

  onUnmounted(() => {
    if (supported.value) window.speechSynthesis.cancel()
  })

  function speak(text: string) {
    if (!supported.value) return
    const synth = window.speechSynthesis

    if (state.value === 'idle') {
      utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = rate
      utterance.onend = () => { state.value = 'idle' }
      utterance.onerror = () => { state.value = 'idle' }
      synth.speak(utterance)
      state.value = 'playing'
    } else if (state.value === 'playing') {
      synth.pause()
      state.value = 'paused'
    } else {
      synth.resume()
      state.value = 'playing'
    }
  }

  function cancel() {
    if (!supported.value) return
    window.speechSynthesis.cancel()
    state.value = 'idle'
  }

  const label = computed(() => {
    if (state.value === 'playing') return '⏸ 暂停'
    if (state.value === 'paused') return '▶ 继续'
    return '▶ 朗读'
  })

  return { supported, state, label, speak, cancel }
}
