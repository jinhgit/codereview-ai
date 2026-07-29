import { getGroqKey } from './keyStore'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export const MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
  { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
] as const

let modelIdx = 0

export function getCurrentModelLabel(): string {
  return MODELS[modelIdx % MODELS.length].label
}

export async function callGroq(
  messages: ChatMessage[],
  options: { jsonMode?: boolean; maxTokens?: number; onModelChange?: (label: string) => void } = {},
  attempt = 0,
): Promise<string> {
  const { jsonMode = false, maxTokens = 8192, onModelChange } = options
  const key = getGroqKey()
  if (!key) throw new Error('API 키가 필요합니다')

  if (attempt >= MODELS.length) {
    throw new Error('모든 모델 한도 초과. 잠시 후 다시 시도해주세요.')
  }

  const model = MODELS[modelIdx % MODELS.length]
  onModelChange?.(model.label)

  const body: Record<string, unknown> = {
    model: model.id,
    messages,
    temperature: 0.1,
    max_tokens: maxTokens,
  }
  if (jsonMode) body.response_format = { type: 'json_object' }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (res.status === 429) {
    modelIdx = (modelIdx + 1) % MODELS.length
    await new Promise((r) => setTimeout(r, 1000))
    return callGroq(messages, options, attempt + 1)
  }

  if (res.status === 401) {
    throw new Error('API 키 인증 실패 — 키를 다시 확인해주세요')
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const b = await res.json()
      msg = b?.error?.message || msg
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }

  const data = await res.json()
  return ((data.choices?.[0]?.message?.content as string) || '').trim()
}
