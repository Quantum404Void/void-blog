<template>
  <div class="comment-list mt-6">
    <p class="list-title"><span class="list-icon">▶</span> 评论 ({{ comments.length }})</p>

    <div v-if="comments.length === 0" class="empty-text">
      暂无评论，成为第一个留言的人吧。
    </div>

    <div v-for="c in comments" :key="c.id" class="comment-item">
      <div class="comment-header">
        <span class="comment-nickname">{{ c.nickname }}</span>
        <span class="comment-time">{{ formatTime(c.created_at) }}</span>
      </div>
      <div class="comment-body" v-html="renderContent(c.content)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'CommentList' })

interface Comment {
  id: number
  nickname: string
  content: string
  parent_id: number | null
  created_at: string
}

defineProps<{ comments: Comment[] }>()

function formatTime(iso: string): string {
  const d = new Date(iso + 'Z')
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function renderContent(text: string): string {
  // 简单转义 HTML + 基本 Markdown（链接、粗体、代码）
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
  // inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
  // bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  return html
}
</script>

<style scoped>
.list-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--color-text-muted);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.list-icon {
  color: var(--color-neon-green);
  font-size: 9px;
}

.empty-text {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 24px 0;
  text-align: center;
  border: 1px dashed var(--color-void-border);
  border-radius: 8px;
}

.comment-item {
  padding: 14px 0;
  border-bottom: 1px solid var(--color-void-border);
}
.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.comment-nickname {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-neon-green);
  font-family: var(--font-mono);
}

.comment-time {
  font-size: 10px;
  color: var(--color-text-muted);
}

.comment-body {
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-secondary);
}
.comment-body :deep(.inline-code) {
  background: var(--color-void-muted);
  color: var(--color-neon-cyan);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 11px;
  font-family: var(--font-mono);
}
.comment-body :deep(a) {
  color: var(--color-neon-cyan);
  text-decoration: underline;
}
.comment-body :deep(strong) {
  color: var(--color-text-primary);
}
</style>
