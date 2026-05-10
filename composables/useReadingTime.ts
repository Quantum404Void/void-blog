export function useReadingTime() {
  function calcReadingTime(content: string): number {
    const cjkChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
    const otherChars = content.length - cjkChars
    return Math.max(1, Math.round(cjkChars / 500 + otherChars / 1000))
  }
  return { calcReadingTime }
}
