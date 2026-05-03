<template>
  <NuxtPwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <!-- SW 更新提示 -->
  <ClientOnly>
    <Transition name="pwa-fade">
      <button
        v-if="$pwa?.needRefresh"
        class="pwa-btn update"
        @click="$pwa?.updateServiceWorker()"
        title="点击更新到新版本"
      >
        🔄 新版本
      </button>
    </Transition>
  </ClientOnly>
</template>

<style>
.pwa-btn {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid rgba(0, 212, 255, 0.4);
  background: rgba(10, 10, 15, 0.92);
  color: #00d4ff;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}
.pwa-btn:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.8);
}
.pwa-btn.update {
  border-color: rgba(57, 255, 20, 0.4);
  color: #39ff14;
}
.pwa-btn.update:hover {
  background: rgba(57, 255, 20, 0.1);
  border-color: rgba(57, 255, 20, 0.8);
}

.pwa-fade-enter-active,
.pwa-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.pwa-fade-enter-from,
.pwa-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
