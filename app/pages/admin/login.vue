<script setup lang="ts">
import { getApiErrorMessage } from '~/utils/apiError'

definePageMeta({ layout: false })

const { siteName } = useSiteConfig()
useSeoMeta({ title: `Admin Login | ${siteName}`, robots: 'noindex' })

const password = shallowRef('')
const error = shallowRef('')
const loading = shallowRef(false)
const showPassword = shallowRef(false)

const { data } = await useFetch('/api/auth/me').catch(() => ({ data: null }))
if (data?.value) navigateTo('/admin')

async function handleLogin() {
  if (!password.value) {
    error.value = '请输入管理密码'
    return
  }
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { password: password.value } })
    await navigateTo('/admin')
  } catch (loginError: unknown) {
    error.value = getApiErrorMessage(loginError, '验证失败，请检查密码后重试')
  } finally {
    loading.value = false
  }
}
</script>

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
          <label for="admin-password" class="block font-mono text-xs text-[var(--color-text-secondary)] mb-2 tracking-wider uppercase">
            Password
          </label>
          <div class="relative">
            <input
              id="admin-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="输入管理密码"
              :aria-invalid="Boolean(error)"
              aria-describedby="admin-login-error"
              class="w-full bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg pl-4 pr-16 py-3 font-mono text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[rgba(0,212,255,0.5)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] placeholder:text-[var(--color-text-muted)]"
              :class="{ 'border-[rgba(255,45,120,0.5)] focus:border-[rgba(255,45,120,0.5)]': error }"
            />
            <button type="button" class="absolute inset-y-0 right-0 px-4 font-mono text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-neon-cyan)]" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword">
              {{ showPassword ? '隐藏' : '显示' }}
            </button>
          </div>
          <p v-if="error" id="admin-login-error" role="alert" class="font-mono text-xs text-[var(--color-neon-pink)] mt-2">{{ error }}</p>
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
        <NuxtLink href="/" class="admin-action inline-flex items-center px-3 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors">
          ← 返回博客
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
