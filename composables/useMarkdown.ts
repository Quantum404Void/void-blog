// composables/useMarkdown.ts
// 统一 markdown-it 实例，所有页面共享配置
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
// @ts-expect-error — no type declarations for this package
import markdownItHljs from 'markdown-it-highlightjs'
// @ts-expect-error — no type declarations for this package
import markdownItContainer from 'markdown-it-container'

function toSlug(text: string) {
  return text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '')
}

export function useMarkdown(options: { containers?: boolean; lineNumbers?: boolean } = {}) {
  const md = new MarkdownIt({ html: true, linkify: true, typographer: true })
    .use(markdownItHljs, { hljs, auto: true, code: true })

  // heading id 注入
  const defaultHeadingOpen = md.renderer.rules.heading_open ||
    ((tokens: any[], idx: number, o: any, env: any, self: any) => self.renderToken(tokens, idx, o))
  md.renderer.rules.heading_open = (tokens: any[], idx: number, o: any, env: any, self: any) => {
    const inline = tokens[idx + 1]
    const text = inline?.children?.map((t: any) => t.content).join('') ?? ''
    tokens[idx].attrSet('id', toSlug(text))
    return defaultHeadingOpen(tokens, idx, o, env, self)
  }

  // callout containers
  if (options.containers !== false) {
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
  }

  // 代码块行号
  if (options.lineNumbers !== false) {
    const defaultFence = md.renderer.rules.fence
    md.renderer.rules.fence = (tokens: any[], idx: number, o: any, env: any, self: any) => {
      const raw: string = defaultFence
        ? defaultFence(tokens, idx, o, env, self)
        : self.renderToken(tokens, idx, o)
      return raw.replace(
        /(<code[^>]*>)([\s\S]*?)(<\/code>)/,
        (_m: string, open: string, body: string, close: string) => {
          const lines = body.split('\n')
          const last = lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines
          if (last.length < 4) return open + body + close
          const wrapped = last.map((l: string) => `<span class="code-line">${l}</span>`).join('\n')
          return open + wrapped + '\n' + close
        }
      )
    }
  }

  return { md, toSlug }
}
