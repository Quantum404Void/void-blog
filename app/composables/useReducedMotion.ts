export function useReducedMotion() {
  let mediaQuery = import.meta.client
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : undefined
  const prefersReducedMotion = shallowRef(mediaQuery?.matches ?? false)

  const updatePreference = () => {
    prefersReducedMotion.value = mediaQuery?.matches ?? false
  }

  onMounted(() => {
    mediaQuery ??= window.matchMedia('(prefers-reduced-motion: reduce)')
    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)
  })

  onUnmounted(() => mediaQuery?.removeEventListener('change', updatePreference))

  return readonly(prefersReducedMotion)
}
