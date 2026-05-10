// composables/useMarkdown.ts
// module-level singleton — MarkdownIt 只初始化一次，所有调用共享同一实例
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
// @ts-expect-error — no type declarations for this package
import markdownItHljs from 'markdown-it-highlightjs'
// @ts-expect-error — no type declarations for this package
import markdownItContainer from 'markdown-it-container'

function toSlug(text: string) {
  return text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '')
}

// ── Singleton ───────────────────────────────────────────────────────────────
const md = new MarkdownIt({ html: true, linkify: true, typographer: true })
  .use(markdownItHljs, { hljs, auto: true, code: true })

// heading id 注入
const _defaultHeadingOpen = md.renderer.rules.heading_open ||
  ((tokens: any[], idx: number, o: any, env: any, self: any) => self.renderToken(tokens, idx, o))
md.renderer.rules.heading_open = (tokens: any[], idx: number, o: any, env: any, self: any) => {
  const inline = tokens[idx + 1]
  const text = inline?.children?.map((t: any) => t.content).join('') ?? ''
  tokens[idx].attrSet('id', toSlug(text))
  return _defaultHeadingOpen(tokens, idx, o, env, self)
}

// callout containers
const callouts = [
  { name: 'tip',     icon: '💡', label: '提示' },
  { name: 'warning', icon: '⚠️', label: '注意' },
  { name: 'danger',  icon: '🚨', label: '危险' },
  { name: 'info',    icon: 'ℹ️', label: '说明' },
]
for (const { name, icon, label } of callouts) {
  md.use(markdownItContainer, name, {
    render(tokens: any[], idx: number) {
      if (tokens[idx].nesting === 1) {
        const title = tokens[idx].info.trim().slice(name.length).trim() || label
        return `<div class="callout callout-${name}"><p class="callout-title">${icon} ${title}</p>\n`
      }
      return '</div>\n'
    }
  })
}

// 代码块行号 + 语言 badge
const _defaultFence = md.renderer.rules.fence
md.renderer.rules.fence = (tokens: any[], idx: number, o: any, env: any, self: any) => {
  const token = tokens[idx]
  const lang = token.info?.trim().split(/\s+/)[0] || ''

  const raw: string = _defaultFence
    ? _defaultFence(tokens, idx, o, env, self)
    : self.renderToken(tokens, idx, o)

  // 不再手动切行包 span，完全交给 CSS line-numbers 处理
  // 只提取行数，如果 >= 4 行则在 pre 上加 data-lines class
  const lineCount = (raw.match(/\n/g) || []).length
  const hasLineNumbers = lineCount >= 3

  let result = raw

  // 注入 data-lang + class 到 <pre> 标签
  const extraAttrs = [
    lang ? `data-lang="${lang}"` : '',
    hasLineNumbers ? 'class="line-numbers"' : '',
  ].filter(Boolean).join(' ')

  if (extraAttrs) {
    // 如果已有 class 属性，合并而不是替换
    result = result.replace(/^<pre([^>]*)>/, (match, attrs) => {
      const hasClass = /class="([^"]*)"/.test(attrs)
      if (hasClass && hasLineNumbers) {
        attrs = attrs.replace(/class="([^"]*)"/, 'class="$1 line-numbers"')
      } else {
        attrs = attrs + (lang ? ` data-lang="${lang}"` : '') + (hasLineNumbers && !hasClass ? ' class="line-numbers"' : '')
      }
      return `<pre${attrs}>`
    })
  }

  return result
}

// 图片懒加载
const _defaultImage = md.renderer.rules.image ||
  ((tokens: any[], idx: number, o: any, env: any, self: any) => self.renderToken(tokens, idx, o))

md.renderer.rules.image = (tokens: any[], idx: number, o: any, env: any, self: any) => {
  tokens[idx].attrSet('loading', 'lazy')
  tokens[idx].attrSet('decoding', 'async')
  return _defaultImage(tokens, idx, o, env, self)
}
// ── End Singleton ────────────────────────────────────────────────────────────

export function useMarkdown() {
  return { md, toSlug }
}
