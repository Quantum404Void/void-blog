// app/utils/markdown-it-katex.ts
// Custom markdown-it plugin for KaTeX math rendering
// Supports: $$...$$ (display) and $...$ (inline)
import type { MarkdownIt } from 'markdown-it'
import katex from 'katex'

function renderMath(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      trust: false,
      strict: false,
    })
  } catch {
    return `<code class="katex-error">${tex}</code>`
  }
}

export function katexPlugin(md: MarkdownIt): void {
  // $$...$$ display math
  md.inline.ruler.before('escape', 'katex_display', (state, silent) => {
    const src = state.src.slice(state.pos)
    if (!src.startsWith('$$')) return false

    const endIdx = src.indexOf('$$', 2)
    if (endIdx === -1) return false

    const tex = src.slice(2, endIdx).trim()
    if (!tex) return false

    if (!silent) {
      const token = state.push('katex_display', '', 0)
      token.content = tex
      token.markup = '$$'
    }

    state.pos += endIdx + 2
    return true
  })

  md.renderer.rules.katex_display = (tokens, idx) => {
    return `<div class="math-display">${renderMath(tokens[idx]!.content, true)}</div>`
  }

  // $...$ inline math
  md.inline.ruler.before('escape', 'katex_inline', (state, silent) => {
    const src = state.src.slice(state.pos)
    // Must start with single $, not $$
    if (!src.startsWith('$') || src.startsWith('$$')) return false

    const endIdx = src.indexOf('$', 1)
    if (endIdx === -1) return false

    const tex = src.slice(1, endIdx)
    // Reject empty or whitespace-only
    if (!tex.trim()) return false
    // Reject if $ is preceded/followed by whitespace without content (e.g., "price $ 10")
    // or if content looks like currency (e.g., "$100" → tex="100" with no opening space is fine)

    if (!silent) {
      const token = state.push('katex_inline', '', 0)
      token.content = tex
      token.markup = '$'
    }

    state.pos += endIdx + 1
    return true
  })

  md.renderer.rules.katex_inline = (tokens, idx) => {
    return renderMath(tokens[idx]!.content, false)
  }
}
