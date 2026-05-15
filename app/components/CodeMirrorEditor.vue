<template>
  <div ref="editorContainer" class="cm-editor-wrap" />
</template>

<script setup lang="ts">
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'

const props = defineProps<{ modelValue: string }>()
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
      markdown(),
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      drawSelection(),
      history(),
      closeBrackets(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...closeBracketsKeymap,
        indentWithTab,
      ]),
      EditorView.lineWrapping,
      EditorView.theme({
        '&': { height: '100%', background: 'transparent', fontSize: '13px' },
        '.cm-content': { fontFamily: 'JetBrains Mono, monospace', padding: '12px 0' },
        '.cm-gutters': { background: 'rgba(10,10,15,0.5)', borderRight: '1px solid rgba(30,30,48,0.8)', color: 'rgba(100,100,140,0.5)' },
        '.cm-activeLineGutter': { background: 'rgba(0,212,255,0.05)' },
        '.cm-activeLine': { background: 'rgba(0,212,255,0.03)' },
        '.cm-cursor': { borderLeftColor: '#00d4ff' },
        '.cm-selectionBackground, ::selection': { background: 'rgba(0,212,255,0.2) !important' },
        '.cm-scroller': { overflow: 'auto' },
      }),
      updateListener,
    ],
  })

  view = new EditorView({ state, parent: editorContainer.value })
})

// 外部更新同步
watch(() => props.modelValue, (val) => {
  if (!view) return
  const current = view.state.doc.toString()
  if (current !== val) {
    view.dispatch({ changes: { from: 0, to: current.length, insert: val } })
  }
})

onUnmounted(() => { view?.destroy(); view = null })
</script>

<style scoped>
.cm-editor-wrap {
  width: 100%;
  min-height: 60vh;
  border-radius: 0;
  overflow: hidden;
}
.cm-editor-wrap :deep(.cm-editor) {
  height: 100%;
  min-height: 60vh;
}
</style>
