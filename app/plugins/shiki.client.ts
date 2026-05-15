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

  _md.use(fromHighlighter(hl, {
    theme: 'github-dark-dimmed',
    transformers: [
      {
        pre(node: any) {
          const lang = (this as any).options?.lang || ''
          if (lang && lang !== 'text' && lang !== 'plaintext') {
            node.properties['data-lang'] = lang
          }
        }
      },
      transformerNotationDiff(),
      transformerNotationHighlight(),
      transformerNotationFocus(),
      transformerNotationWordHighlight(),
      transformerMetaHighlight(),
    ],
  }))

  const _defHeading = _md.renderer.rules.heading_open ||
    ((t: any[], i: number, o: any, _e: any, s: any) => s.renderToken(t, i, o))
  _md.renderer.rules.heading_open = (t: any[], i: number, o: any, e: any, s: any) => {
    const tag = t[i].tag
    if (tag === 'h2' || tag === 'h3') {
      const text = t[i + 1]?.children?.map((x: any) => x.content).join('') ?? ''
      t[i].attrSet('id', toSlug(text))
    }
    return _defHeading(t, i, o, e, s)
  }

  for (const { name, icon, label } of [
    { name: 'tip', icon: '💡', label: '提示' },
    { name: 'warning', icon: '⚠️', label: '注意' },
    { name: 'danger', icon: '🚨', label: '危险' },
    { name: 'info', icon: 'ℹ️', label: '说明' },
  ]) {
    _md.use(markdownItContainer, name, {
      render(tokens: any[], idx: number) {
        if (tokens[idx].nesting === 1) {
          const title = tokens[idx].info.trim().slice(name.length).trim() || label
          return `<div class="callout callout-${name}"><p class="callout-title">${icon} ${title}</p>\n`
        }
        return '</div>\n'
      }
    })
  }

  const _defImg = _md.renderer.rules.image ||
    ((t: any[], i: number, o: any, _e: any, s: any) => s.renderToken(t, i, o))
  _md.renderer.rules.image = (t: any[], i: number, o: any, e: any, s: any) => {
    t[i].attrSet('loading', 'lazy')
    t[i].attrSet('decoding', 'async')
    return _defImg(t, i, o, e, s)
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
