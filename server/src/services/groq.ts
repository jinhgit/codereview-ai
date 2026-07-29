import { config } from '../config.js'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export const MODELS = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
  { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B' },
  { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
  { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
] as const

const PR_MODELS = MODELS.slice(0, 3)

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function callGroq(
  apiKey: string,
  messages: ChatMessage[],
  options: {
    jsonMode?: boolean
    maxTokens?: number
    models?: readonly { id: string; label: string }[]
  } = {},
): Promise<{ content: string; model: string; modelLabel: string }> {
  const models = options.models || MODELS
  const jsonMode = options.jsonMode ?? false
  const maxTokens = options.maxTokens ?? 8192

  let lastErr = '모든 모델 시도 실패'
  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    try {
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
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 800))
        lastErr = 'Rate limit (429)'
        continue
      }
      if (res.status === 401) {
        throw new HttpError(401, 'API 키 인증 실패 — 키를 다시 확인해주세요')
      }
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const b = (await res.json()) as { error?: { message?: string } }
          msg = b?.error?.message || msg
        } catch {
          /* ignore */
        }
        lastErr = msg
        continue
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[]
      }
      const content = (data.choices?.[0]?.message?.content || '').trim()
      return { content, model: model.id, modelLabel: model.label }
    } catch (e) {
      if (e instanceof HttpError) throw e
      lastErr = e instanceof Error ? e.message : '네트워크 오류'
    }
  }
  throw new HttpError(503, lastErr)
}

export { PR_MODELS }
