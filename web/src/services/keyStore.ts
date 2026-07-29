const KEY = 'groq_key'

export function getGroqKey(): string {
  return sessionStorage.getItem(KEY) || ''
}

export function setGroqKey(k: string): void {
  sessionStorage.setItem(KEY, k)
}

export function isValidGroqKey(k: string): boolean {
  return k.trim().startsWith('gsk_')
}
