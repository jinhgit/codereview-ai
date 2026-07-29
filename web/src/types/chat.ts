export type ChatRole = 'user' | 'bot'

export type UiChatMessage = {
  role: ChatRole
  html: string
  time: string
  code?: string
}

export type LlmTurn = {
  role: 'user' | 'assistant'
  content: string
}

export type ChatSession = {
  id: string
  title: string
  projectId: string | null
  history: LlmTurn[]
  messages: UiChatMessage[]
  createdAt: number
  updatedAt: number
}

export type ChatProject = {
  id: string
  name: string
  color: string
  chatIds: string[]
  collapsed: boolean
}

export type ChatStore = {
  projects: ChatProject[]
  chats: ChatSession[]
  activeChatId: string | null
}

export type LeftTab = 'editor' | 'chat'
