// server/utils/markdown.ts — 服务端基础 Markdown 渲染（无 Shiki，Worker 安全）
// 只做结构化渲染：heading id、callout、图片 lazy，不做语法高亮（代码块保留原始 HTML）
import MarkdownIt from 'markdown-it'
import type { MarkdownIt as MarkdownItInstance, RendererRule, Token } from 'markdown-it'
// @ts-expect-error markdown-it-container 未提供类型声明
import markdownItContainer from 'markdown-it-container'

function toSlug(text: string) {
  return text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '')
}

let _md: MarkdownItInstance | null = null

export function getServerMd(): MarkdownItInstance {
  if (_md) return _md

  _md = new MarkdownIt({ html: true, linkify: true, typographer: true })

  // heading id
  const _defHeading: RendererRule = _md.renderer.rules.heading_open ||
    ((t, i, o, _e, s) => s.renderToken(t, i, o))
  _md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!
    if (token.tag === 'h2' || token.tag === 'h3') {
      const text = tokens[idx + 1]?.children?.map(child => child.content).join('') ?? ''
      token.attrSet('id', toSlug(text))
    }
    return _defHeading(tokens, idx, options, env, self)
  }

  // callouts
  for (const { name, icon, label } of [
    { name: 'tip', icon: '💡', label: '提示' },
    { name: 'warning', icon: '⚠️', label: '注意' },
    { name: 'danger', icon: '🚨', label: '危险' },
    { name: 'info', icon: 'ℹ️', label: '说明' },
  ]) {
    _md.use(markdownItContainer, name, {
      render(tokens: Token[], idx: number) {
        const token = tokens[idx]!
        if (token.nesting === 1) {
          const title = token.info.trim().slice(name.length).trim() || label
          return `<div class="callout callout-${name}"><p class="callout-title">${icon} ${title}</p>\n`
        }
        return '</div>\n'
      }
    })
  }

  // image lazy
  const _defImg: RendererRule = _md.renderer.rules.image ||
    ((t, i, o, _e, s) => s.renderToken(t, i, o))
  _md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!
    token.attrSet('loading', 'lazy')
    token.attrSet('decoding', 'async')
    return _defImg(tokens, idx, options, env, self)
  }

  return _md
}
