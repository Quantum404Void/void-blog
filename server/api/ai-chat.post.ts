// server/api/ai-chat.post.ts — AI 助手小新（Cloudflare Workers AI, @cf/qwen/qwen3-30b-a3b-fp8）
// 免费，无需额外 API key，动态注入博客文章列表作为上下文
import type { ChatMessage, AiChatResponse } from '~/types/ai'
import { queryD1 } from '~~/server/utils/d1'

interface CfAiMessage { role: string; content: string }
interface CfAiResponse { response?: string; result?: { response?: string } }

interface BlogPost {
  slug: string
  title: string
  description: string
  tags: string
}

let _postCache: { posts: BlogPost[]; ts: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 min

async function getPostsContext(event: any): Promise<string> {
  // Cache posts list to avoid querying D1 on every message
  if (_postCache && Date.now() - _postCache.ts < CACHE_TTL) {
    return _postCache.posts.map(p =>
      `- **${p.title}** (/${p.slug})：${p.description}`
    ).join('\n')
  }

  try {
    const rows = await queryD1<BlogPost>(
      event,
      `SELECT slug, title, description, tags FROM posts WHERE draft = 0 ORDER BY pub_date DESC`,
    )
    _postCache = { posts: rows, ts: Date.now() }
    return rows.map(p =>
      `- **${p.title}** (/${p.slug}) 标签：${p.tags}`
    ).join('\n')
  } catch {
    // D1 unavailable (local dev) — fallback
    if (_postCache) {
      return _postCache.posts.map(p =>
        `- **${p.title}** (/${p.slug})`
      ).join('\n')
    }
    return '（暂无文章数据）'
  }
}

function buildSystemPrompt(postsCtx: string): string {
  return `你是 void.dev 博客的 AI 助手，名叫「小新」。
博客作者是一名 C++/TypeScript 开发者，专注于 Linux 内核、系统编程、AI Agent 等技术。

你的核心职责是帮助读者了解本博客的内容。当用户提问时，优先结合以下博客文章列表来回答，引导读者阅读相关文章。

## 博客已发布文章
${postsCtx}

## 回答规则
- 优先推荐博客中已有的相关文章（给出标题和链接 /文章路径）
- 如果问题与博客内容无关，简单说明并引导回博客主题
- 用简洁、技术范儿的中文回答，带一点极客风格
- 遇到代码问题直接给出可运行的代码片段
- 回答控制在 300 字以内`
}

export default defineEventHandler(async (event): Promise<AiChatResponse> => {
  const body = await readBody<{ messages: ChatMessage[] }>(event)
  const messages: ChatMessage[] = body?.messages ?? []

  // 获取 CF AI binding
  const ai = (event.context.cloudflare?.env as any)?.AI
  if (!ai) {
    return { reply: '🔌 本地开发模式，AI 助手在 Cloudflare Pages 生产环境才能使用。' }
  }

  // 获取博客文章列表作为上下文
  const postsCtx = await getPostsContext(event)
  const systemPrompt = buildSystemPrompt(postsCtx)

  // 构建消息
  const cfMessages: CfAiMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-12).map(m => ({ role: m.role, content: m.content })),
  ]

  try {
    const resp = await ai.run('@cf/qwen/qwen3-30b-a3b-fp8', {
      messages: cfMessages,
      max_tokens: 1200,
    }) as CfAiResponse

    const text = (resp?.response ?? resp?.result?.response ?? '').trim()
    return { reply: text || '（无响应，请稍后再试）' }
  } catch (err: any) {
    console.error('[ai-chat] CF AI error:', err)
    return { reply: `AI 服务暂时不可用：${err?.message ?? '未知错误'}` }
  }
})
