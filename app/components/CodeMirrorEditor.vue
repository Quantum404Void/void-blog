<template>
  <div ref="editorContainer" class="cm-editor-wrap" />
</template>

<script setup lang="ts">
import { EditorView, keymap, highlightActiveLine, drawSelection, placeholder } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { highlightSelectionMatches } from '@codemirror/search'

const props = defineProps<{ modelValue: string; placeholderText?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const editorContainer = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null

onMounted(() => {
  if (!editorContainer.value) return

  const updateListener = EditorView.updateListener.of((u) => {
    if (u.docChanged) emit('update:modelValue', u.state.doc.toString())
  })

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      vscodeDark,
      // Markdown + 代码块内语言高亮（fenced code blocks）
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      highlightActiveLine(),
      highlightSelectionMatches(),
      drawSelection(),
      history(),
      closeBrackets(),
      placeholder(props.placeholderText ?? '用 Markdown 写文章…'),
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
          padding: '16px 20px',
          caretColor: '#00d4ff',
          minHeight: '60vh',
        },
        '.cm-focused .cm-cursor': { borderLeftColor: '#00d4ff', borderLeftWidth: '2px' },
        '.cm-activeLine': { background: 'rgba(0,212,255,0.03)' },
        '.cm-selectionBackground': { background: 'rgba(0,212,255,0.15) !important' },
        '&.cm-focused .cm-selectionBackground': { background: 'rgba(0,212,255,0.2) !important' },
        '.cm-matchingBracket': { color: '#00ff88 !important', background: 'rgba(0,255,136,0.1)' },
        '.cm-searchMatch': { background: 'rgba(255,200,0,0.2)', border: '1px solid rgba(255,200,0,0.4)' },
        '.cm-searchMatch.cm-searchMatch-selected': { background: 'rgba(255,200,0,0.4)' },
        // placeholder
        '.cm-placeholder': { color: 'rgba(104,104,160,0.5)', fontStyle: 'italic' },
        // scroller
        '.cm-scroller': { overflow: 'auto', lineHeight: '1.7' },
        // heading 样式增强（依赖 Markdown 高亮）
        '.cm-line': { padding: '0' },
      }),
      updateListener,
    ],
  })

  view = new EditorView({ state, parent: editorContainer.value })
})

// 外部更新同步（避免光标跳动）
watch(() => props.modelValue, (val) => {
  if (!view) return
  const current = view.state.doc.toString()
  if (current !== val) {
    view.dispatch({
      changes: { from: 0, to: current.length, insert: val },
      // 保留光标位置
      selection: view.state.selection,
    })
  }
})

onUnmounted(() => { view?.destroy(); view = null })
</script>

<style scoped>
.cm-editor-wrap {
  width: 100%;
  min-height: 60vh;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid var(--color-void-border);
  transition: border-color 0.15s;
}
.cm-editor-wrap:focus-within {
  border-color: rgba(0, 212, 255, 0.35);
}
.cm-editor-wrap :deep(.cm-editor) {
  height: 100%;
  min-height: 60vh;
  outline: none !important;
}
/* 修正 vscodeDark 主题下 content 不被 gutter 遮挡 */
.cm-editor-wrap :deep(.cm-editor .cm-scroller) {
  overflow: auto;
}
</style>
