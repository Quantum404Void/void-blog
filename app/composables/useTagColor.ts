const TAG_COLORS = ['neon-green', 'neon-cyan', 'neon-purple', 'neon-pink'] as const
export type TagColorName = typeof TAG_COLORS[number]

export function useTagColor() {
  function getTagColor(tag: string): TagColorName {
    const idx = Math.abs(tag.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % TAG_COLORS.length
    return TAG_COLORS[idx]!
  }
  function getTagColorVar(tag: string) {
    return `var(--color-${getTagColor(tag)})`
  }
  return { getTagColor, getTagColorVar }
}
