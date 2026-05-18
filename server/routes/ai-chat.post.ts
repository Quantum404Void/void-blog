import type { ChatMessage, AiChatResponse } from '~/app/types/ai'

const GITHUB_COPILOT_API = 'https://api.githubcopilot.com/chat/completions'
const MODEL = 'gpt-4o-mini'
const NO_KEY_REPLY = 'AI 助手暂未配置，请设置 NUXT_OPENAI_KEY'

export default defineEventHandler(async (event): Promise<AiChatResponse> => {
  const config = useRuntimeConfig()
  const apiKey = config.openaiKey as string

  if (!apiKey) {
    return { reply: NO_KEY_REPLY }
  }

  const body = await readBody<{ messages: ChatMessage[] }>(event)
  const messages = body?.messages ?? []

  try {
    const res = await $fetch<{ choices: { message: { content: string } }[] }>(
      GITHUB_COPILOT_API,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Editor-Version': 'vscode/1.90.0',
          'Copilot-Integration-Id': 'vscode-chat',
        },
        body: { model: MODEL, messages, max_tokens: 1024 },
      }
    )
    const reply = res?.choices?.[0]?.message?.content?.trim() ?? '（无回复）'
    return { reply }
  } catch (err: any) {
    const msg = err?.data?.error?.message ?? err?.message ?? 'unknown error'
    return { reply: `AI 请求失败：${msg}` }
  }
})
