<template>
  <form class="comment-form" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div class="field">
        <label class="field-label" for="cmt-nickname">
          <span class="field-icon">></span> 昵称
        </label>
        <input
          id="cmt-nickname"
          v-model="nickname"
          type="text"
          class="field-input"
          placeholder="你的名字"
          maxlength="50"
          required
          :disabled="submitting"
        />
      </div>
      <div class="field">
        <label class="field-label" for="cmt-email">
          <span class="field-icon">></span> 邮箱 <span class="text-text-muted text-2xs">(选填)</span>
        </label>
        <input
          id="cmt-email"
          v-model="email"
          type="email"
          class="field-input"
          placeholder="不会公开显示"
          maxlength="200"
          :disabled="submitting"
        />
      </div>
    </div>

    <div class="field mt-3">
      <label class="field-label" for="cmt-content">
        <span class="field-icon">></span> 评论
      </label>
      <textarea
        id="cmt-content"
        v-model="content"
        class="field-input field-textarea"
        placeholder="写下你的想法…"
        maxlength="2000"
        rows="4"
        required
        :disabled="submitting"
      ></textarea>
      <div class="flex justify-between items-center mt-1">
        <span class="text-text-muted" style="font-size: 10px;">支持 Markdown</span>
        <span class="text-text-muted" style="font-size: 10px;">{{ content.length }}/2000</span>
      </div>
    </div>

    <div class="flex items-center justify-between mt-4">
      <transition name="fade">
        <span v-if="error" class="text-neon-pink" style="font-size: 11px;">{{ error }}</span>
        <span v-else-if="success" class="text-neon-green" style="font-size: 11px;">评论成功！</span>
      </transition>
      <button
        type="submit"
        class="submit-btn"
        :disabled="submitting"
      >
        <span v-if="submitting" class="inline-flex items-center gap-2">
          <span class="spinner"></span> 提交中…
        </span>
        <span v-else>发表评论</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
defineOptions({ name: 'CommentForm' })

const props = defineProps<{ slug: string }>()
const emit = defineEmits<{ submitted: [] }>()

const nickname = ref('')
const email = ref('')
const content = ref('')
const submitting = ref(false)
const error = ref('')
const success = ref(false)

async function handleSubmit() {
  error.value = ''
  success.value = false

  const n = nickname.value.trim()
  const c = content.value.trim()
  if (!n || n.length > 50) { error.value = '昵称 1-50 字符'; return }
  if (c.length < 2 || c.length > 2000) { error.value = '评论 2-2000 字符'; return }

  submitting.value = true
  try {
    const res = await $fetch(`/api/comments/${props.slug}`, {
      method: 'POST',
      body: {
        nickname: n,
        email: email.value.trim(),
        content: c,
      },
    })
    if (res.ok) {
      success.value = true
      content.value = ''
      emit('submitted')
      setTimeout(() => { success.value = false }, 3000)
    }
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || '提交失败'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.comment-form {
  margin-top: 8px;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.field-icon {
  color: var(--color-neon-green);
  font-size: 10px;
  margin-right: 2px;
}

.field-input {
  width: 100%;
  padding: 10px 12px;
  background: var(--color-void);
  border: 1px solid var(--color-void-border);
  border-radius: 6px;
  color: var(--color-text-primary);
  font-size: 13px;
  font-family: var(--font-mono);
  transition: border-color 0.2s;
  outline: none;
}
.field-input:focus {
  border-color: var(--color-neon-green);
  box-shadow: 0 0 0 2px rgba(0,255,136,0.08);
}
.field-input:disabled {
  opacity: 0.5;
}
.field-input::placeholder {
  color: var(--color-text-muted);
}
.field-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
}

.submit-btn {
  padding: 8px 20px;
  background: transparent;
  border: 1px solid var(--color-neon-green);
  border-radius: 6px;
  color: var(--color-neon-green);
  font-size: 12px;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.5px;
}
.submit-btn:hover:not(:disabled) {
  background: var(--color-neon-green);
  color: var(--color-void);
}
.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
