import { demoPost } from '../../content/demo-post'
import { hasD1 } from '../../utils/d1'

export default defineEventHandler(async (event) => {
  if (!hasD1(event)) {
    return Object.fromEntries(demoPost.tags.map(tag => [tag, 1]))
  }

  const rows = await queryD1<{ tags: string }>(event, "SELECT tags FROM posts WHERE draft=0 AND slug!='about'")
  const counts: Record<string, number> = {}
  for (const r of rows) {
    const tags: string[] = JSON.parse(r.tags || '[]')
    for (const t of tags) counts[t] = (counts[t] || 0) + 1
  }
  return counts
})
