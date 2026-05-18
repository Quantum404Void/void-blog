// plugins/shiki.client.ts
// Shiki 只在客户端初始化，完全不进入 SSR/Worker bundle
// 性能优化：
//   1. 使用 createJavaScriptRegexEngine（已是最小化引擎，无 WASM 依赖）
//   2. langs 按需懒加载：先初始化常用语言，其余用 addLanguage 动态添加
//   3. 单例缓存，全站只初始化一次
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

type MdToken = { tag: string; nesting: number; info: string; attrSet: (k: string, v: string) => void; children?: Array<{ content: string }> }
type MdOptions = Record<string, unknown>
type MdRenderer = { renderToken: (tokens: MdToken[], idx: number, options: MdOptions) => string }
type RenderRule = (tokens: MdToken[], idx: number, options: MdOptions, env: unknown, self: MdRenderer) => string

function toSlug(text: string) {
  return text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '')
}

let _md: MarkdownIt | null = null
// 记录已加载的语言，支持按需追加
let _hl: any = null
const _loadedLangs = new Set<string>()

// 核心语言（最常用，首次加载就带上）
const CORE_LANGS = ['cpp', 'typescript', 'python', 'bash', 'json'] as const

// 扩展语言映射（用到时才 import，减少首屏 bundle）
const LANG_MAP: Record<string, () => Promise<any>> = {
  c:           () => import('shiki/langs/c.mjs'),
  javascript:  () => import('shiki/langs/javascript.mjs'),
  js:          () => import('shiki/langs/javascript.mjs'),
  ts:          () => import('shiki/langs/typescript.mjs'),
  shellscript: () => import('shiki/langs/shellscript.mjs'),
  shell:       () => import('shiki/langs/shellscript.mjs'),
  sh:          () => import('shiki/langs/shellscript.mjs'),
  yaml:        () => import('shiki/langs/yaml.mjs'),
  toml:        () => import('shiki/langs/toml.mjs'),
  sql:         () => import('shiki/langs/sql.mjs'),
  rust:        () => import('shiki/langs/rust.mjs'),
  go:          () => import('shiki/langs/go.mjs'),
  java:        () => import('shiki/langs/java.mjs'),
  markdown:    () => import('shiki/langs/markdown.mjs'),
  md:          () => import('shiki/langs/markdown.mjs'),
  html:        () => import('shiki/langs/html.mjs'),
  css:         () => import('shiki/langs/css.mjs'),
  vue:         () => import('shiki/langs/vue.mjs'),
  diff:        () => import('shiki/langs/diff.mjs'),
}

async function buildMd() {
  if (_md) return _md

  const { createHighlighterCore } = await import('shiki/core')
  const { createJavaScriptRegexEngine } = await import('shiki/engine/javascript')
  const { fromHighlighter } = await import('@shikijs/markdown-it')

  _hl = await createHighlighterCore({
    themes: [import('shiki/themes/github-dark-dimmed.mjs')],
    langs: [
      // 只加载核心语言，其余按需动态添加
      import('shiki/langs/cpp.mjs'),
      import('shiki/langs/typescript.mjs'),
      import('shiki/langs/python.mjs'),
      import('shiki/langs/bash.mjs'),
      import('shiki/langs/json.mjs'),
    ],
    engine: createJavaScriptRegexEngine(),
  })

  for (const l of CORE_LANGS) _loadedLangs.add(l)

  _md = new MarkdownIt({ html: true, linkify: true, typographer: true })

  // 自定义 fence（代码块）renderer，支持按需加载语言
  const defaultFence = _md.renderer.rules.fence || ((tokens: MdToken[], idx: number, options: MdOptions, _e: unknown, self: MdRenderer) => self.renderToken(tokens, idx, options))

  _md.renderer.rules.fence = (tokens: MdToken[], idx: number, options: MdOptions, env: unknown, self: MdRenderer) => {
    // fence renderer is sync; language load happens lazily on next render
    const lang = (tokens[idx] as any).info?.trim()?.split(/\s+/)[0] || ''
    if (lang && !_loadedLangs.has(lang) && LANG_MAP[lang]) {
      // 触发异步加载，下次 buildMd 调用时已就绪
      LANG_MAP[lang]().then(mod => {
        _hl.loadLanguage(mod.default ?? mod)
        _loadedLangs.add(lang)
        // 失效缓存，下次重新渲染
        _md = null
      }).catch(() => {})
    }
    return defaultFence(tokens, idx, options, env, self)
  }

  _md.use(fromHighlighter(_hl as Parameters<typeof fromHighlighter>[0], {
    theme: 'github-dark-dimmed',
    transformers: [
      {
        pre(node: { tagName?: string; properties?: Record<string, unknown> }) {
          const ctx = this as unknown as { options?: { lang?: string } }
          const lang = ctx.options?.lang ?? ''
          if (lang && lang !== 'text' && lang !== 'plaintext') {
            node.properties['data-lang'] = lang
          }
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

export default defineNuxtPlugin((_nuxtApp) => {
  return {
    provide: {
      buildMd,
      toSlug,
    },
  }
})
