export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiChatRequest {
  messages: ChatMessage[]
}

export interface AiChatResponse {
  reply: string
}

export interface UiMessage {
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}
