// plugins/shiki.client.ts
// Shiki 只在客户端初始化，完全不进入 SSR/Worker bundle
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationFocus,
  transformerNotationWordHighlight,
  transformerMetaHighlight,
} from '@shikijs/transformers'
import MarkdownIt from 'markdown-it'
// @ts-expect-error
import markdownItContainer from 'markdown-it-container'

// markdown-it renderer rule type (no official .d.ts in this version)
type MdToken = { tag: string; nesting: number; info: string; attrSet: (k: string, v: string) => void; children?: Array<{ content: string }> }
type MdOptions = Record<string, unknown>
type MdRenderer = { renderToken: (tokens: MdToken[], idx: number, options: MdOptions) => string }
type RenderRule = (tokens: MdToken[], idx: number, options: MdOptions, env: unknown, self: MdRenderer) => string

function toSlug(text: string) {
  return text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '')
}

let _md: MarkdownIt | null = null

async function buildMd() {
  if (_md) return _md

  const { createHighlighterCore } = await import('shiki/core')
  const { createJavaScriptRegexEngine } = await import('shiki/engine/javascript')
  const { fromHighlighter } = await import('@shikijs/markdown-it')

  const hl = await createHighlighterCore({
    themes: [import('shiki/themes/github-dark-dimmed.mjs')],
    langs: [
      import('shiki/langs/c.mjs'),
      import('shiki/langs/cpp.mjs'),
      import('shiki/langs/python.mjs'),
      import('shiki/langs/typescript.mjs'),
      import('shiki/langs/javascript.mjs'),
      import('shiki/langs/bash.mjs'),
      import('shiki/langs/shellscript.mjs'),
      import('shiki/langs/json.mjs'),
      import('shiki/langs/yaml.mjs'),
      import('shiki/langs/toml.mjs'),
      import('shiki/langs/sql.mjs'),
      import('shiki/langs/rust.mjs'),
      import('shiki/langs/go.mjs'),
      import('shiki/langs/java.mjs'),
      import('shiki/langs/markdown.mjs'),
      import('shiki/langs/html.mjs'),
      import('shiki/langs/css.mjs'),
      import('shiki/langs/vue.mjs'),
      import('shiki/langs/diff.mjs'),
    ],
    engine: createJavaScriptRegexEngine(),
  })

  _md = new MarkdownIt({ html: true, linkify: true, typographer: true })

  _md.use(fromHighlighter(hl as Parameters<typeof fromHighlighter>[0], {
    theme: 'github-dark-dimmed',
    transformers: [
      {
        pre(node: { tagName?: string; properties?: Record<string, unknown> }) {
          // In Shiki transformer context, `this` provides codeToHtml options
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ctx = this as unknown as { options?: { lang?: string } }
          const lang = ctx.options?.lang ?? ''
          if (lang && lang !== 'text' && lang !== 'plaintext') {
            node.properties['data-lang'] = lang
          }
          // 伪行号：自动对所有代码块加 has-line-numbers
          const cls = node.properties['class'] || ''
          node.properties['class'] = cls ? cls + ' has-line-numbers' : 'has-line-numbers'
        }
      },
      transformerNotationDiff(),
      transformerNotationHighlight(),
      transformerNotationFocus(),
      transformerNotationWordHighlight(),
      transformerMetaHighlight(),
    ],
  }))

  const _defHeading: RenderRule = _md.renderer.rules.heading_open ||
    ((tokens: MdToken[], idx: number, options: MdOptions, _e: unknown, self: MdRenderer) => self.renderToken(tokens, idx, options))
  _md.renderer.rules.heading_open = (tokens: MdToken[], idx: number, options: MdOptions, env: unknown, self: MdRenderer) => {
    const tag = tokens[idx].tag
    if (tag === 'h2' || tag === 'h3') {
      const text = tokens[idx + 1]?.children?.map((x) => x.content).join('') ?? ''
      tokens[idx].attrSet('id', toSlug(text))
    }
    return _defHeading(tokens, idx, options, env, self)
  }

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

  const _defImg: RenderRule = _md.renderer.rules.image ||
    ((tokens: MdToken[], idx: number, options: MdOptions, _e: unknown, self: MdRenderer) => self.renderToken(tokens, idx, options))
  _md.renderer.rules.image = (tokens: MdToken[], idx: number, options: MdOptions, env: unknown, self: MdRenderer) => {
    tokens[idx].attrSet('loading', 'lazy')
    tokens[idx].attrSet('decoding', 'async')
    return _defImg(tokens, idx, options, env, self)
  }

  return _md
}

export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      buildMd,
      toSlug,
    },
  }
})
