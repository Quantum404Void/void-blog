<template>
  <div class="min-h-screen bg-[var(--color-void)] flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-10">
        <p class="font-mono text-xs text-[var(--color-text-muted)] tracking-[0.2em] uppercase mb-3">
          <span class="text-[var(--color-neon-green)]">root@void</span>
          <span class="text-[var(--color-text-muted)]">:~$</span>
          <span class="text-[var(--color-text-muted)]"> sudo -i</span>
        </p>
        <h1 class="font-mono text-2xl font-bold text-[var(--color-text-primary)]">
          <span class="text-[var(--color-neon-green)]">/</span>admin
        </h1>
        <p class="font-mono text-xs text-[var(--color-text-muted)] mt-2">身份验证</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block font-mono text-xs text-[var(--color-text-muted)] mb-2 tracking-wider uppercase">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-4 py-3 font-mono text-sm text-[var(--color-text-primary)] outline-none transition-all focus:border-[rgba(0,212,255,0.5)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] placeholder:text-[var(--color-void-muted)]"
            :class="{ 'border-[rgba(255,45,120,0.5)] focus:border-[rgba(255,45,120,0.5)]': error }"
          />
          <p v-if="error" class="font-mono text-[10px] text-[var(--color-neon-pink)] mt-2">{{ error }}</p>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 font-mono text-sm font-bold rounded-lg border transition-all"
          :class="loading
            ? 'border-[var(--color-void-border)] text-[var(--color-text-muted)] cursor-not-allowed'
            : 'border-[rgba(0,255,136,0.4)] text-[var(--color-neon-green)] bg-[rgba(0,255,136,0.06)] hover:bg-[rgba(0,255,136,0.12)] hover:shadow-[0_0_16px_rgba(0,255,136,0.2)]'"
        >
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <span class="inline-block w-3 h-3 border border-[var(--color-text-muted)] border-t-transparent rounded-full animate-spin"></span>
            验证中…
          </span>
          <span v-else>$ authenticate</span>
        </button>
      </form>

      <div class="mt-8 text-center">
        <NuxtLink href="/" class="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">
          ← 返回博客
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { siteName } = useSiteConfig()
useSeoMeta({ title: `Admin Login | ${siteName}`, robots: 'noindex' })

const password = ref('')
const error = ref('')
const loading = ref(false)

// 已登录直接跳转
const { data } = await useFetch('/api/auth/me').catch(() => ({ data: null }))
if (data?.value) navigateTo('/admin')

async function handleLogin() {
  if (!password.value) return
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { password: password.value } })
    navigateTo('/admin')
  } catch (e: unknown) {
    error.value = e?.data?.message || '密码错误'
  } finally {
    loading.value = false
  }
}
</script>
