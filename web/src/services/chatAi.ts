import type { Lang } from '../types'
import type { LlmTurn } from '../types/chat'
import { apiPost, isBffReachable } from './apiClient'
import { standaloneChat } from './standalone'

export async function sendChatCompletion(
  history: LlmTurn[],
  onModelChange?: (label: string) => void,
): Promise<string> {
  if (await isBffReachable()) {
    try {
      const res = await apiPost<{ content: string }>('/api/v1/ai/chat', {
        messages: history.map((h) => ({
          role: h.role,
          content: h.content,
        })),
      })
      if (res.modelLabel) onModelChange?.(res.modelLabel)
      return res.data.content
    } catch {
      /* fall through */
    }
  }
  return standaloneChat(history, onModelChange)
}

export function buildUserPayload(msg: string, code: string, lang: Lang): string {
  const trimmed = code.trim()
  if (!trimmed) return msg
  return `${msg}\n\n[현재 에디터 코드 - ${lang}]\n\`\`\`${lang}\n${trimmed}\n\`\`\``
}
