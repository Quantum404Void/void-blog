export default defineEventHandler(async (event) => {
  const rows = await queryD1<{ tags: string }>(event, 'SELECT tags FROM posts WHERE draft=0')
  const counts: Record<string, number> = {}
  for (const r of rows) { const tags: string[] = JSON.parse(r.tags || '[]'); for (const t of tags) counts[t] = (counts[t] || 0) + 1 }
  return counts
})
