<template>
  <div>
    <!-- 触发按钮 -->
    <button
      class="fixed bottom-20 right-4 sm:right-6 z-[var(--z-ai)] w-12 h-12 rounded-full flex items-center justify-center text-xl
             border-2 border-[rgba(180,76,255,0.6)] bg-[var(--color-void-card)] cursor-pointer
             transition-[border-color,box-shadow] duration-200
             hover:border-[rgba(180,76,255,1)] hover:shadow-[0_0_16px_rgba(180,76,255,0.5)]"
      aria-label="AI 助手"
      @click="open = !open"
    >🤖</button>

    <!-- 浮窗 -->
    <Transition name="ai-slide">
      <div
        v-if="open"
        class="fixed bottom-36 right-4 sm:right-6 z-[var(--z-ai)] flex flex-col
               w-[min(360px,90vw)] h-[480px] rounded-xl
               border border-[rgba(180,76,255,0.4)] bg-[var(--color-void-card)]
               shadow-[0_0_32px_rgba(180,76,255,0.2)]"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-[rgba(180,76,255,0.3)]">
          <span class="font-mono text-xs text-[var(--color-neon-purple)] flex items-center gap-2">
            <span>🤖</span> AI 助手
          </span>
          <button
            class="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors text-sm"
            @click="open = false"
          >✕</button>
        </div>

        <!-- Messages -->
        <div ref="msgListRef" class="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scroll-smooth">
          <div v-if="history.length === 0" class="flex items-center justify-center h-full">
            <p class="font-mono text-xs text-[var(--color-text-muted)] text-center leading-relaxed">
              你好！我是 void.redx.space 的 AI 助手 🤖<br />
              <span class="opacity-60">有什么技术问题可以问我~</span>
            </p>
          </div>
          <div
            v-for="(m, i) in history"
            :key="i"
            class="flex"
            :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[80%] rounded-lg px-3 py-2 font-mono text-xs leading-relaxed"
              :class="m.role === 'user'
                ? 'bg-[rgba(0,212,255,0.12)] text-[var(--color-neon-cyan)] border border-[rgba(0,212,255,0.25)]'
                : 'bg-[rgba(180,76,255,0.08)] text-[var(--color-text-secondary)] border border-[rgba(180,76,255,0.2)]'"
            >
              <span v-if="m.loading" class="animate-pulse">···</span>
              <span v-else>{{ m.content }}</span>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="flex gap-2 p-3 border-t border-[rgba(180,76,255,0.3)]">
          <input
            v-model="inputText"
            type="text"
            placeholder="输入问题..."
            :disabled="isLoading"
            class="flex-1 bg-transparent border border-[var(--color-void-border)] rounded-lg
                   px-3 py-2 font-mono text-xs text-[var(--color-text-primary)]
                   placeholder:text-[var(--color-text-muted)] outline-none
                   transition-[border-color] duration-200
                   focus:border-[rgba(180,76,255,0.5)] disabled:opacity-50"
            @keydown.enter.prevent="sendMessage"
          />
          <button
            :disabled="isLoading || !inputText.trim()"
            class="px-3 py-2 rounded-lg font-mono text-xs
                   border border-[rgba(180,76,255,0.4)] text-[var(--color-neon-purple)]
                   transition-colors duration-200 cursor-pointer bg-transparent
                   hover:not-disabled:bg-[rgba(180,76,255,0.1)]
                   disabled:opacity-40 disabled:cursor-not-allowed"
            @click="sendMessage"
          >发送</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AiAssistant' })

import type { UiMessage, ChatMessage, AiChatResponse } from '~/types/ai'

// ── 常量 ──────────────────────────────────────────────────
const SYSTEM_PROMPT = '你是 void.redx.space 博客的 AI 助手，帮助读者理解技术文章。回答简洁，中文，带一点极客风格。'
const MAX_HISTORY_TURNS = 20
const API_ENDPOINT = '/api/ai-chat'

// ── Chat session composable（局部）────────────────────────
function useChatSession() {
  const history = ref<UiMessage[]>([])
  const isLoading = ref(false)
  const inputText = ref('')
  const msgListRef = ref<HTMLElement | null>(null)

  function scrollToBottom() {
    nextTick(() => {
      if (msgListRef.value) msgListRef.value.scrollTop = msgListRef.value.scrollHeight
    })
  }

  async function sendMessage() {
    const text = inputText.value.trim()
    if (!text || isLoading.value) return

    inputText.value = ''
    history.value.push({ role: 'user', content: text })
    scrollToBottom()

    isLoading.value = true
    const placeholder: UiMessage = { role: 'assistant', content: '', loading: true }
    history.value.push(placeholder)
    scrollToBottom()

    const recentMsgs = history.value
      .filter(m => !m.loading)
      .slice(-MAX_HISTORY_TURNS)

    const payload: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentMsgs.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]

    try {
      const res = await $fetch<AiChatResponse>(API_ENDPOINT, {
        method: 'POST',
        body: { messages: payload },
      })
      placeholder.loading = false
      placeholder.content = res.reply
    } catch {
      placeholder.loading = false
      placeholder.content = 'AI 助手暂时离线，请稍后再试'
    } finally {
      isLoading.value = false
      scrollToBottom()
    }
  }

  return { history, isLoading, inputText, msgListRef, sendMessage }
}

// ── 状态 ──────────────────────────────────────────────────
const open = ref(false)
const { history, isLoading, inputText, msgListRef, sendMessage } = useChatSession()
</script>

<style scoped>
.ai-slide-enter-active,
.ai-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.ai-slide-enter-from,
.ai-slide-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}
</style>
