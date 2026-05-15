export function useFormatDate() {
  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }
  function formatDateLong(d: string) {
    return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  function formatMonthDay(d: string) {
    return new Date(d).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
  return { formatDate, formatDateLong, formatMonthDay }
}
