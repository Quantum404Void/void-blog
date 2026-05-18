<template>
  <div>
    <!-- 触发按钮 -->
    <button
      class="ai-trigger-btn"
      aria-label="AI 助手"
      @click="open = !open"
    >
      🤖
    </button>

    <!-- 浮窗 -->
    <Transition name="ai-slide">
      <div v-if="open" class="ai-panel">
        <!-- Header -->
        <div class="ai-panel-header">
          <span class="font-mono text-xs text-neon-purple flex items-center gap-2">
            <span>🤖</span> AI 助手
          </span>
          <button
            class="text-muted hover:text-primary transition-colors text-sm"
            @click="open = false"
          >✕</button>
        </div>

        <!-- Messages -->
        <div ref="msgListRef" class="ai-msg-list">
          <div v-if="history.length === 0" class="ai-empty-hint">
            <p class="font-mono text-xs text-muted text-center leading-relaxed">
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
              :class="m.role === 'user' ? 'msg-user' : 'msg-assistant'"
            >
              <span v-if="m.loading" class="animate-pulse">···</span>
              <span v-else>{{ m.content }}</span>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="ai-panel-footer">
          <input
            v-model="inputText"
            type="text"
            placeholder="输入问题..."
            :disabled="isLoading"
            class="ai-input"
            @keydown.enter.prevent="sendMessage"
          />
          <button
            :disabled="isLoading || !inputText.trim()"
            class="ai-send-btn"
            @click="sendMessage"
          >发送</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { UiMessage, ChatMessage, AiChatResponse } from '~/types/ai'

const SYSTEM_PROMPT = '你是 void.redx.space 博客的 AI 助手，帮助读者理解技术文章。回答简洁，中文，带一点极客风格。'
const MAX_HISTORY_TURNS = 20
const API_ENDPOINT = '/api/ai-chat'

const open = ref(false)
const inputText = ref('')
const isLoading = ref(false)
const msgListRef = ref<HTMLElement | null>(null)
const history = ref<UiMessage[]>([])

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
</script>

<style scoped>
.ai-trigger-btn {
  position: fixed;
  bottom: 5rem;
  right: 1rem;
  z-index: 60;
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  border: 2px solid rgba(180, 76, 255, 0.6);
  background: var(--color-void-card);
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.ai-trigger-btn:hover {
  border-color: rgba(180, 76, 255, 1);
  box-shadow: 0 0 16px rgba(180, 76, 255, 0.5);
}
@media (min-width: 640px) {
  .ai-trigger-btn { right: 1.5rem; }
}

.ai-panel {
  position: fixed;
  bottom: 9rem;
  right: 1rem;
  z-index: 60;
  display: flex;
  flex-direction: column;
  width: min(360px, 90vw);
  height: 480px;
  border-radius: 0.75rem;
  border: 1px solid rgba(180, 76, 255, 0.4);
  background: var(--color-void-card);
  box-shadow: 0 0 32px rgba(180, 76, 255, 0.2);
}
@media (min-width: 640px) {
  .ai-panel { right: 1.5rem; }
}

.ai-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(180, 76, 255, 0.3);
}

.ai-msg-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  scroll-behavior: smooth;
}

.ai-empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.msg-user {
  background: rgba(0, 212, 255, 0.12);
  color: var(--color-neon-cyan);
  border: 1px solid rgba(0, 212, 255, 0.25);
}
.msg-assistant {
  background: rgba(180, 76, 255, 0.08);
  color: var(--color-text-secondary);
  border: 1px solid rgba(180, 76, 255, 0.2);
}

.ai-panel-footer {
  padding: 0.75rem;
  border-top: 1px solid rgba(180, 76, 255, 0.3);
  display: flex;
  gap: 0.5rem;
}

.ai-input {
  flex: 1;
  background: transparent;
  border: 1px solid var(--color-void-border);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 0.2s;
}
.ai-input::placeholder { color: var(--color-text-muted); }
.ai-input:focus { border-color: rgba(180, 76, 255, 0.5); }
.ai-input:disabled { opacity: 0.5; }

.ai-send-btn {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  border: 1px solid rgba(180, 76, 255, 0.4);
  color: var(--color-neon-purple);
  transition: background 0.2s;
  cursor: pointer;
  background: transparent;
}
.ai-send-btn:hover:not(:disabled) { background: rgba(180, 76, 255, 0.1); }
.ai-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.text-neon-purple { color: var(--color-neon-purple); }
.text-muted { color: var(--color-text-muted); }
.text-primary { color: var(--color-text-primary); }

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
