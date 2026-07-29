import type { Lang } from '../types'
import type { LlmTurn } from '../types/chat'
import { callGroq, type ChatMessage } from './groq'

const SYSTEM =
  '전문 코드 AI 어시스턴트. 코드 요청 시 완전하고 실행 가능한 코드 제공. 마크다운 코드블록 사용. 한국어 답변. 한국어 주석.'

export async function sendChatCompletion(
  history: LlmTurn[],
  onModelChange?: (label: string) => void,
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM },
    ...history.map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    })),
  ]
  return callGroq(messages, { jsonMode: false, maxTokens: 8192, onModelChange })
}

export function buildUserPayload(
  msg: string,
  code: string,
  lang: Lang,
): string {
  const trimmed = code.trim()
  if (!trimmed) return msg
  return `${msg}\n\n[현재 에디터 코드 - ${lang}]\n\`\`\`${lang}\n${trimmed}\n\`\`\``
}
