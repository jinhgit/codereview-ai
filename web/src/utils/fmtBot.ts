import { esc } from './escape'

/** 간단한 마크다운 → 안전한 HTML (원본 프로토타입과 동일 수준) */
export function fmtBot(text: string): string {
  let t = text
  t = t.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _l, c: string) => {
    return `<pre>${esc(c.trim())}</pre>`
  })
  t = t.replace(/`([^`]+)`/g, (_m, c: string) => `<code>${esc(c)}</code>`)
  t = t.replace(/\n/g, '<br>')
  t = t.replace(/\*\*(.*?)\*\*/g, (_m, c: string) => `<strong>${esc(c)}</strong>`)
  return t
}

export function extractCode(text: string): string {
  const m = text.match(/```(?:\w*)\n?([\s\S]*?)```/)
  return m ? m[1].trim() : ''
}
