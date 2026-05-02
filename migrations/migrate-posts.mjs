#!/usr/bin/env node
/**
 * migrate-posts.mjs
 * 读取 void-blog-content/posts/*.mdx，解析 frontmatter，插入 D1
 * 用法: node migrations/migrate-posts.mjs
 */
import { readdir, readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dir = dirname(fileURLToPath(import.meta.url))
const postsDir = join(__dir, '../../void-blog-content/posts')

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { meta: {}, content: raw }
  const fm = match[1]
  const content = raw.slice(match[0].length).trim()
  const meta = {}
  for (const line of fm.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (!m) continue
    const [, k, v] = m
    if (v.startsWith('[')) {
      try { meta[k] = JSON.parse(v.replace(/'/g, '"')) } catch { meta[k] = [] }
    } else if (v.startsWith('"') || v.startsWith("'")) {
      meta[k] = v.slice(1, -1)
    } else {
      meta[k] = v
    }
  }
  return { meta, content }
}

const files = (await readdir(postsDir)).filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
console.log(`Found ${files.length} posts`)

const rows = []
for (const file of files) {
  const slug = file.replace(/\.(mdx|md)$/, '')
  const raw = await readFile(join(postsDir, file), 'utf-8')
  const { meta, content } = parseFrontmatter(raw)
  rows.push({
    slug,
    title: meta.title ?? slug,
    description: meta.description ?? '',
    content: content.replace(/'/g, "''"),   // escape SQL single quotes
    pub_date: meta.pubDate ?? new Date().toISOString().slice(0, 10),
    tags: JSON.stringify(Array.isArray(meta.tags) ? meta.tags : []),
    draft: meta.draft ? 1 : 0,
  })
}

// 生成 SQL 批量 INSERT
const sqlLines = rows.map(r =>
  `INSERT OR REPLACE INTO posts (slug, title, description, content, pub_date, tags, draft) VALUES (` +
  `'${r.slug}', '${r.title.replace(/'/g,"''")}', '${r.description.replace(/'/g,"''")}', ` +
  `'${r.content}', '${r.pub_date}', '${r.tags}', ${r.draft});`
)

const sqlFile = join(__dir, '0002_seed.sql')
await (await import('fs')).promises.writeFile(sqlFile, sqlLines.join('\n') + '\n')
console.log(`Written ${sqlLines.length} INSERT statements to 0002_seed.sql`)
console.log('Running: wrangler d1 execute void-blog-posts --remote --file=migrations/0002_seed.sql')

execSync(`bunx wrangler d1 execute void-blog-posts --remote --file=${sqlFile}`, { stdio: 'inherit' })
console.log('Done!')
