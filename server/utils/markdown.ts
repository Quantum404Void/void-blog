// server/utils/markdown.ts — 服务端基础 Markdown 渲染（无 Shiki，Worker 安全）
// 只做结构化渲染：heading id、callout、图片 lazy，不做语法高亮（代码块保留原始 HTML）
import MarkdownIt from 'markdown-it'
// @ts-expect-error
import markdownItContainer from 'markdown-it-container'

type MdToken = { tag: string; nesting: number; info: string; attrSet: (k: string, v: string) => void; children?: Array<{ content: string }> }
type MdOptions = Record<string, unknown>
type MdRenderer = { renderToken: (tokens: MdToken[], idx: number, options: MdOptions) => string }
type RenderRule = (tokens: MdToken[], idx: number, options: MdOptions, env: unknown, self: MdRenderer) => string

function toSlug(text: string) {
  return text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '')
}

let _md: MarkdownIt | null = null

export function getServerMd(): MarkdownIt {
  if (_md) return _md

  _md = new MarkdownIt({ html: true, linkify: true, typographer: true, highlight: null as any })

  // heading id
  const _defHeading: RenderRule = _md.renderer.rules.heading_open ||
    ((t, i, o, _e, s) => s.renderToken(t, i, o))
  _md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
    const tag = tokens[idx].tag
    if (tag === 'h2' || tag === 'h3') {
      const text = tokens[idx + 1]?.children?.map((x) => x.content).join('') ?? ''
      tokens[idx].attrSet('id', toSlug(text))
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
      render(tokens: MdToken[], idx: number) {
        if (tokens[idx].nesting === 1) {
          const title = tokens[idx].info.trim().slice(name.length).trim() || label
          return `<div class="callout callout-${name}"><p class="callout-title">${icon} ${title}</p>\n`
        }
        return '</div>\n'
      }
    })
  }

  // image lazy
  const _defImg: RenderRule = _md.renderer.rules.image ||
    ((t, i, o, _e, s) => s.renderToken(t, i, o))
  _md.renderer.rules.image = (tokens, idx, options, env, self) => {
    tokens[idx].attrSet('loading', 'lazy')
    tokens[idx].attrSet('decoding', 'async')
    return _defImg(tokens, idx, options, env, self)
  }

  return _md
}
