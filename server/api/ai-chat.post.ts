// server/api/ai-chat.post.ts — AI 助手（Cloudflare Workers AI, @cf/deepseek-ai/deepseek-r1-distill-qwen-32b）
// 免费，无需额外 API key，直接通过 env.AI binding 调用
import type { ChatMessage, AiChatResponse } from '~/types/ai'

interface CfAiMessage { role: string; content: string }
interface CfAiResponse { response?: string; result?: { response?: string } }

const SYSTEM_PROMPT = `你是 void.dev 博客的 AI 助手，名叫「小助」。
博客作者是一名 C++/TypeScript 开发者，专注于 Linux 内核、系统编程、AI Agent 等技术。
请用简洁、技术范儿的中文回答问题。遇到代码问题直接给出可运行的代码片段。
如果问题与博客内容相关，优先结合博客上下文回答。`

export default defineEventHandler(async (event): Promise<AiChatResponse> => {
  const body = await readBody<{ messages: ChatMessage[] }>(event)
  const messages: ChatMessage[] = body?.messages ?? []

  // 获取 CF AI binding
  const ai = (event.context.cloudflare?.env as any)?.AI
  if (!ai) {
    // 本地开发 fallback（CF AI 只在 Pages/Workers 生产环境有效）
    return { reply: '🔌 本地开发模式，AI 助手在 Cloudflare Pages 生产环境才能使用。' }
  }

  // 构建消息，注入 system prompt
  const cfMessages: CfAiMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.slice(-12).map(m => ({ role: m.role, content: m.content })),
  ]

  try {
    const resp = await ai.run('@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', {
      messages: cfMessages,
      max_tokens: 800,
    }) as CfAiResponse

    let text = resp?.response ?? resp?.result?.response ?? ''
    // DeepSeek R1 会输出 <think>...</think> 推理链，过滤掉只返回答案
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
    return { reply: text || '（无响应，请稍后再试）' }
  } catch (err: any) {
    console.error('[ai-chat] CF AI error:', err)
    return { reply: `AI 服务暂时不可用：${err?.message ?? '未知错误'}` }
  }
})
