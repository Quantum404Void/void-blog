<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import type { RendererRule } from 'markdown-it'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `Markdown 预览 | ${siteName}` })

const source = shallowRef(`# Markdown 预览

在左侧输入内容，右侧会即时渲染。

- **粗体** 与 *斜体*
- [安全链接](https://void.dev)
- \`inline code\`

> 原始 HTML 会作为文本显示，避免预览注入。`)

const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: false })
const defaultLinkOpen = markdown.renderer.rules.link_open
const safeLinkOpen: RendererRule = (tokens, index, options, env, self) => {
  tokens[index]?.attrSet('target', '_blank')
  tokens[index]?.attrSet('rel', 'noopener noreferrer')
  return defaultLinkOpen ? defaultLinkOpen(tokens, index, options, env, self) : self.renderToken(tokens, index, options)
}
markdown.renderer.rules.link_open = safeLinkOpen

const rendered = computed(() => markdown.render(source.value))
const characterCount = computed(() => source.value.length)
const wordCount = computed(() => source.value.trim() ? source.value.trim().split(/\s+/).length : 0)
</script>

<template>
  <LabLayout title="Markdown 预览" desc="实时预览常用 Markdown。原始 HTML 默认禁用，外部链接在新标签页安全打开。" accent="var(--color-neon-purple)">
    <div class="mb-4 flex flex-wrap items-center gap-4 font-mono text-xs text-[var(--color-text-muted)]">
      <span>{{ characterCount }} 字符</span>
      <span>{{ wordCount }} 词</span>
      <button class="tool-button px-3 sm:ml-auto" @click="source = ''">清空</button>
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <section>
        <label for="markdown-input" class="tool-label">Markdown 输入</label>
        <textarea id="markdown-input" v-model="source" class="tool-field tool-textarea min-h-[34rem]" spellcheck="false" />
      </section>
      <section>
        <p class="tool-label">安全预览</p>
        <div class="markdown-preview min-h-[34rem] overflow-auto rounded-xl border border-[var(--color-void-border)] bg-[var(--color-void-card)] p-5" v-html="rendered" />
      </section>
    </div>
  </LabLayout>
</template>

<style scoped>
.markdown-preview :deep(h1), .markdown-preview :deep(h2), .markdown-preview :deep(h3) { margin: 1.4em 0 0.6em; color: var(--color-text-primary); font-family: var(--font-mono); font-weight: 700; }
.markdown-preview :deep(h1:first-child), .markdown-preview :deep(h2:first-child) { margin-top: 0; }
.markdown-preview :deep(h1) { font-size: 1.5rem; }
.markdown-preview :deep(h2) { border-bottom: 1px solid var(--color-void-border); padding-bottom: 0.5rem; font-size: 1.2rem; }
.markdown-preview :deep(p), .markdown-preview :deep(li) { color: var(--color-text-secondary); font-size: 0.9rem; line-height: 1.75; }
.markdown-preview :deep(ul), .markdown-preview :deep(ol) { margin: 0.8rem 0; padding-left: 1.5rem; }
.markdown-preview :deep(a) { color: var(--color-neon-cyan); text-decoration: underline; text-underline-offset: 0.18em; }
.markdown-preview :deep(code) { border-radius: 0.3rem; background: rgba(180, 76, 255, 0.1); padding: 0.12rem 0.35rem; color: var(--color-neon-purple); font-family: var(--font-mono); }
.markdown-preview :deep(pre) { margin: 1rem 0; overflow-x: auto; border: 1px solid var(--color-void-border); border-radius: 0.75rem; background: var(--color-void); padding: 1rem; }
.markdown-preview :deep(pre code) { background: transparent; padding: 0; color: var(--color-text-primary); }
.markdown-preview :deep(blockquote) { margin: 1rem 0; border-left: 2px solid var(--color-neon-purple); padding-left: 1rem; }
.markdown-preview :deep(table) { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; }
.markdown-preview :deep(th), .markdown-preview :deep(td) { border: 1px solid var(--color-void-border); padding: 0.5rem 0.75rem; text-align: left; }
</style>
