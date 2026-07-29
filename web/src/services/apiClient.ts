import { getGroqKey } from './keyStore'

export type BffConfig = {
  hasServerKey: boolean
  allowClientKey: boolean
  maxCodeChars: number
}

export class ApiError extends Error {
  status: number
  code?: string
  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

let cachedConfig: BffConfig | null = null

export async function fetchBffConfig(): Promise<BffConfig> {
  try {
    const res = await fetch('/api/v1/config')
    if (!res.ok) throw new Error('config failed')
    const json = (await res.json()) as { data: BffConfig }
    cachedConfig = json.data
    return json.data
  } catch {
    // BFF 미기동 시 클라이언트 키 모드로 폴백 표시
    cachedConfig = {
      hasServerKey: false,
      allowClientKey: true,
      maxCodeChars: 80_000,
    }
    return cachedConfig
  }
}

export function getCachedConfig(): BffConfig | null {
  return cachedConfig
}

/** 서버 키가 없으면 클라이언트 키를 헤더로 전달 */
export function needsClientKey(): boolean {
  const cfg = cachedConfig
  if (!cfg) return !getGroqKey()
  if (cfg.hasServerKey) return false
  return cfg.allowClientKey && !getGroqKey()
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options?: { requireKey?: boolean },
): Promise<{ data: T; model?: string; modelLabel?: string }> {
  const requireKey = options?.requireKey !== false
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const clientKey = getGroqKey()
  if (clientKey) headers['X-Groq-Key'] = clientKey

  if (requireKey && needsClientKey()) {
    throw new ApiError(401, 'API 키가 필요합니다')
  }

  const res = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  let json: {
    data?: T
    model?: string
    modelLabel?: string
    error?: { message?: string; code?: string }
  } = {}
  try {
    json = await res.json()
  } catch {
    /* empty */
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json.error?.message || `요청 실패 (HTTP ${res.status})`,
      json.error?.code,
    )
  }

  return {
    data: json.data as T,
    model: json.model,
    modelLabel: json.modelLabel,
  }
}
