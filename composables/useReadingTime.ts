export function useReadingTime() {
  function calcReadingTime(content: string): number {
    const cjkChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
    const otherChars = content.length - cjkChars
    return Math.max(1, Math.round(cjkChars / 500 + otherChars / 1000))
  }

  function calcWordCount(content: string): number {
    const cjkChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length
    // 英文单词
    const enWords = (content.replace(/[\u4e00-\u9fa5]/g, '').match(/\b\w+\b/g) || []).length
    return cjkChars + enWords
  }

  function formatCount(n: number): string {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
  }

  return { calcReadingTime, calcWordCount, formatCount }
}
