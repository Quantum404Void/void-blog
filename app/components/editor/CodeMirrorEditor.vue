<template>
  <div ref="editorContainer" class="cm-editor-wrap" :class="{ 'cm-no-border': noBorder }" />
</template>

<script setup lang="ts">
defineOptions({ name: 'CodeMirrorEditor' })

import { EditorView, keymap, highlightActiveLine, drawSelection, placeholder as cmPlaceholder, lineNumbers, highlightActiveLineGutter } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import type { Extension } from '@codemirror/state'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { javascript } from '@codemirror/lang-javascript'
import { json as langJson } from '@codemirror/lang-json'
import { python } from '@codemirror/lang-python'
import { cpp } from '@codemirror/lang-cpp'
import { sql } from '@codemirror/lang-sql'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
// 仅保留博客常用语言，避免 language-data 把 700+ 语言全部打包
const COMMON_LANGS = ['C', 'C++', 'JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Java', 'CSS', 'HTML', 'JSON', 'YAML', 'SQL', 'Markdown', 'Shell', 'Dockerfile']
import { languages as allLanguages } from '@codemirror/language-data'
const filteredLanguages = allLanguages.filter(l => COMMON_LANGS.includes(l.name))
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { highlightSelectionMatches } from '@codemirror/search'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholderText?: string
  /** 语言: markdown | javascript | json | python | cpp | sql | html | css | x86asm | text */
  lang?: string
  /** 是否显示行号 (默认 false，markdown 不需要；代码游戏需要) */
  showLineNumbers?: boolean
  /** 移除边框 */
  noBorder?: boolean
  minHeight?: string
}>(), {
  lang: 'markdown',
  showLineNumbers: false,
  noBorder: false,
  minHeight: '60vh',
})
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const editorContainer = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null

function getLangExtension(lang: string) {
  switch (lang) {
    case 'javascript': case 'js': case 'typescript': case 'ts':
      return javascript({ typescript: lang === 'typescript' || lang === 'ts' })
    case 'json': return langJson()
    case 'python': return python()
    case 'cpp': case 'c': case 'x86asm': case 'asm': return cpp()
    case 'sql': return sql()
    case 'html': return html()
    case 'css': return css()
    case 'markdown': case 'md':
      return markdown({ base: markdownLanguage, codeLanguages: filteredLanguages })
    default: return []
  }
}

onMounted(() => {
  if (!editorContainer.value) return

  const updateListener = EditorView.updateListener.of((u) => {
    if (u.docChanged) emit('update:modelValue', u.state.doc.toString())
  })

  // void.dev 全局风格主题（与 main.css 保持一致）
  const voidTheme = EditorView.theme({
    '&': {
      background: 'var(--color-void-card)',
      color: 'var(--color-text-primary)',
    },
    '.cm-content': {
      caretColor: '#00d4ff',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#00d4ff',
      borderLeftWidth: '2px',
    },
    '.cm-activeLine': { background: 'rgba(0,212,255,0.035)' },
    '.cm-activeLineGutter': { background: 'rgba(0,212,255,0.05)' },
    '.cm-selectionBackground, ::selection': { background: 'rgba(0,212,255,0.18) !important' },
    '&.cm-focused .cm-selectionBackground': { background: 'rgba(0,212,255,0.22) !important' },
    '.cm-matchingBracket': { color: '#00ff88 !important', background: 'rgba(0,255,136,0.1)', borderRadius: '2px' },
    '.cm-nonmatchingBracket': { color: '#ff2d78 !important' },
    '.cm-placeholder': { color: 'rgba(104,104,160,0.45)', fontStyle: 'italic' },
    '.cm-scroller': { overflow: 'auto', lineHeight: '1.65' },
    '.cm-line': { padding: '0' },
    '.cm-gutters': {
      background: 'rgba(8,8,18,0.6)',
      borderRight: '1px solid var(--color-void-border)',
      color: 'rgba(104,104,160,0.5)',
      minWidth: '2.5rem',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 4px' },
    // 语法着色（与赛博朋克色盘对齐）
    '.tok-keyword':   { color: '#b44cff' },
    '.tok-comment':   { color: '#5a5a88', fontStyle: 'italic' },
    '.tok-string':    { color: '#00ff88' },
    '.tok-number':    { color: '#00d4ff' },
    '.tok-typeName':  { color: '#00d4ff' },
    '.tok-className': { color: '#00d4ff' },
    '.tok-variableName': { color: '#e8e8f0' },
    '.tok-function(.tok-variableName)': { color: '#00d4ff' },
    '.tok-propertyName': { color: '#a8a8c8' },
    '.tok-operator':  { color: '#ff2d78' },
    '.tok-punctuation': { color: '#6868a0' },
    '.tok-tagName':   { color: '#b44cff' },
    '.tok-attributeName': { color: '#00d4ff' },
    '.tok-attributeValue': { color: '#00ff88' },
    '.tok-meta':      { color: '#6868a0' },
    '.tok-invalid':   { color: '#ff2d78' },
  }, { dark: true })

  const extensions: Extension[] = [
    voidTheme,
    getLangExtension(props.lang),
    highlightActiveLine(),
    highlightSelectionMatches(),
    drawSelection(),
    history(),
    closeBrackets(),
    cmPlaceholder(props.placeholderText ?? ''),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...closeBracketsKeymap,
      indentWithTab,
    ]),
    EditorView.lineWrapping,
    // layout 层（大小/字体/padding）——不在 voidTheme 里重复
    EditorView.theme({
      '&': { height: '100%', fontSize: '13.5px', borderRadius: '0.75rem' },
      '.cm-content': {
        fontFamily: 'JetBrains Mono, Fira Code, monospace',
        padding: props.showLineNumbers ? '16px 20px 16px 8px' : '16px 20px',
        minHeight: props.minHeight,
      },
    }),
    updateListener,
  ]

  if (props.showLineNumbers) {
    extensions.splice(1, 0, lineNumbers(), highlightActiveLineGutter())
  }

  const state = EditorState.create({
    doc: props.modelValue,
    extensions,
  })

  view = new EditorView({ state, parent: editorContainer.value })
})

watch(() => props.modelValue, (val) => {
  if (!view) return
  const current = view.state.doc.toString()
  if (current !== val) {
    view.dispatch({
      changes: { from: 0, to: current.length, insert: val },
      selection: view.state.selection,
    })
  }
})

onUnmounted(() => { view?.destroy(); view = null })
</script>

<style scoped>
.cm-editor-wrap {
  width: 100%;
  min-height: v-bind('props.minHeight');
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid var(--color-void-border);
  transition: border-color 0.15s;
}
.cm-editor-wrap:focus-within {
  border-color: rgba(0, 212, 255, 0.35);
}
.cm-editor-wrap.cm-no-border {
  border: none;
  border-radius: 0;
}
.cm-editor-wrap :deep(.cm-editor) {
  height: 100%;
  min-height: v-bind('props.minHeight');
  outline: none !important;
}
</style>
