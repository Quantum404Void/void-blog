<template>
  <div class="min-h-screen bg-[var(--color-void)] flex flex-col">
    <nav class="sticky top-0 z-50 border-b border-[var(--color-void-border)] bg-[rgba(10,10,15,0.85)] backdrop-blur-xl">
      <div class="max-w-3xl mx-auto px-6 h-14 flex items-center gap-4 font-mono text-xs">
        <NuxtLink to="/lab" class="text-[var(--color-neon-green)]">~/lab</NuxtLink><span>/</span>
        <NuxtLink to="/lab" class="text-[var(--color-neon-cyan)] hover:opacity-80 transition-opacity">tools</NuxtLink><span>/</span>
        <span style="color:#b400ff">markdown</span>
      </div>
    </nav>

    <div class="flex-1 flex flex-col max-w-6xl w-full mx-auto px-6 py-6">
      <div class="flex items-center justify-between mb-4">
        <h1 class="font-mono text-xl font-bold" style="color:#b400ff">MD Markdown 预览</h1>
        <button @click="clear" class="font-mono text-[10px] px-3 py-1.5 rounded-lg border transition-all" style="border-color:rgba(255,0,170,0.3);color:rgba(255,0,170,0.7)">清空</button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1" style="min-height:60vh">
        <!-- 左侧输入 -->
        <div class="flex flex-col gap-2">
          <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest flex items-center gap-2">
            <span style="color:#b400ff">▌</span> 输入
            <span class="ml-auto">{{ charCount }} 字符</span>
          </div>
          <textarea
            v-model="source"
            placeholder="# 在这里输入 Markdown…"
            class="flex-1 w-full font-mono text-sm rounded-xl border border-[var(--color-void-border)] p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none leading-relaxed"
            style="min-height:50vh"
          ></textarea>
        </div>

        <!-- 右侧预览 -->
        <div class="flex flex-col gap-2">
          <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest flex items-center gap-2">
            <span style="color:#00ff88">▌</span> 预览
          </div>
          <div
            class="flex-1 rounded-xl border border-[var(--color-void-border)] bg-[var(--color-void-card)] p-5 overflow-y-auto prose-void"
            style="min-height:50vh"
            v-html="rendered"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
// @ts-ignore
import markdownItHljs from 'markdown-it-highlightjs'

useHead({ title: 'Markdown 预览 | void.dev' })

const md = new MarkdownIt({ html: true, linkify: true, typographer: true, breaks: true })
  .use(markdownItHljs, { hljs, auto: true, code: true })

const source = ref(`# Hello, Markdown!

## 基本语法示例

**粗体** 和 *斜体* 以及 \`行内代码\`

> 引用块示例：写代码，记录思考

\`\`\`js
const greet = name => \`Hello, \${name}!\`
console.log(greet('void'))
\`\`\`

- 无序列表项 1
- 无序列表项 2
  - 嵌套项目

1. 有序列表
2. 第二项

[链接示例](https://void.dev) | ![图片](https://via.placeholder.com/40)

---

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A   | B   | C   |
`)

const rendered = computed(() => md.render(source.value))
const charCount = computed(() => source.value.length)

function clear() {
  source.value = ''
}
</script>

<style>
.prose-void h1, .prose-void h2, .prose-void h3, .prose-void h4 {
  color: var(--color-neon-green);
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  margin: 1em 0 0.5em;
  font-weight: 700;
}
.prose-void h1 { font-size: 1.5rem; }
.prose-void h2 { font-size: 1.2rem; }
.prose-void h3 { font-size: 1rem; }
.prose-void p { color: var(--color-text-primary); margin: 0.6em 0; line-height: 1.7; font-size: 0.875rem; }
.prose-void a { color: #00d4ff; text-decoration: underline; }
.prose-void strong { color: #00ff88; }
.prose-void em { color: #b400ff; }
.prose-void code {
  background: rgba(180,0,255,0.12);
  color: #b400ff;
  padding: 0.1em 0.4em;
  border-radius: 4px;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: 0.8rem;
}
.prose-void pre {
  background: rgba(0,0,0,0.4);
  border: 1px solid var(--color-void-border);
  border-radius: 10px;
  padding: 1rem;
  overflow-x: auto;
  margin: 0.8em 0;
}
.prose-void pre code {
  background: none;
  color: #00d4ff;
  padding: 0;
  font-size: 0.8rem;
}
.prose-void blockquote {
  border-left: 3px solid rgba(180,0,255,0.5);
  padding: 0.3em 1em;
  margin: 0.8em 0;
  color: var(--color-text-muted);
  background: rgba(180,0,255,0.05);
  border-radius: 0 8px 8px 0;
}
.prose-void ul, .prose-void ol { padding-left: 1.4em; color: var(--color-text-primary); font-size: 0.875rem; }
.prose-void li { margin: 0.25em 0; }
.prose-void hr { border: none; border-top: 1px solid var(--color-void-border); margin: 1em 0; }
.prose-void table { border-collapse: collapse; width: 100%; font-size: 0.8rem; margin: 0.8em 0; }
.prose-void th { color: #00d4ff; border: 1px solid rgba(0,212,255,0.2); padding: 0.4em 0.8em; background: rgba(0,212,255,0.06); font-family: var(--font-mono, monospace); }
.prose-void td { color: var(--color-text-primary); border: 1px solid var(--color-void-border); padding: 0.4em 0.8em; }
.prose-void img { max-width: 100%; height: auto; border-radius: 8px; display: block; }
</style>
