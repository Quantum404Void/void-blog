<template>
  <div ref="editorContainer" class="cm-editor-wrap" :class="{ 'cm-no-border': noBorder }" />
</template>

<script setup lang="ts">
import { EditorView, keymap, highlightActiveLine, drawSelection, placeholder as cmPlaceholder, lineNumbers, highlightActiveLineGutter } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { javascript } from '@codemirror/lang-javascript'
import { json as langJson } from '@codemirror/lang-json'
import { python } from '@codemirror/lang-python'
import { cpp } from '@codemirror/lang-cpp'
import { sql } from '@codemirror/lang-sql'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { languages } from '@codemirror/language-data'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
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
      return markdown({ base: markdownLanguage, codeLanguages: languages })
    default: return []
  }
}

onMounted(() => {
  if (!editorContainer.value) return

  const updateListener = EditorView.updateListener.of((u) => {
    if (u.docChanged) emit('update:modelValue', u.state.doc.toString())
  })

  const extensions: any[] = [
    vscodeDark,
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
    EditorView.theme({
      '&': {
        height: '100%',
        background: 'var(--color-void-card)',
        fontSize: '13.5px',
        borderRadius: '0.75rem',
      },
      '.cm-content': {
        fontFamily: 'JetBrains Mono, Fira Code, monospace',
        padding: props.showLineNumbers ? '16px 20px 16px 8px' : '16px 20px',
        caretColor: '#00d4ff',
        minHeight: props.minHeight,
      },
      '.cm-focused .cm-cursor': { borderLeftColor: '#00d4ff', borderLeftWidth: '2px' },
      '.cm-activeLine': { background: 'rgba(0,212,255,0.03)' },
      '.cm-selectionBackground': { background: 'rgba(0,212,255,0.15) !important' },
      '&.cm-focused .cm-selectionBackground': { background: 'rgba(0,212,255,0.2) !important' },
      '.cm-matchingBracket': { color: '#00ff88 !important', background: 'rgba(0,255,136,0.1)' },
      '.cm-placeholder': { color: 'rgba(104,104,160,0.5)', fontStyle: 'italic' },
      '.cm-scroller': { overflow: 'auto', lineHeight: '1.7' },
      '.cm-line': { padding: '0' },
      // 行号样式
      '.cm-gutters': { background: 'rgba(10,10,20,0.5)', borderRight: '1px solid rgba(30,30,48,0.8)', color: 'rgba(100,100,140,0.5)', minWidth: '2.5rem' },
      '.cm-activeLineGutter': { background: 'rgba(0,212,255,0.05)' },
      '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 4px' },
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
