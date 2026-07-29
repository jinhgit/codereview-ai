export function parseJSON<T = unknown>(raw: string): T {
  const s = raw.trim()
  const attempts: ((r: string) => unknown)[] = [
    (r) => JSON.parse(r),
    (r) => JSON.parse(r.replace(/^```json\s*/i, '').replace(/\s*```$/, '')),
    (r) => JSON.parse(r.replace(/^```\s*/, '').replace(/\s*```$/, '')),
    (r) => {
      const i = r.indexOf('{')
      const j = r.lastIndexOf('}')
      if (i >= 0 && j > i) return JSON.parse(r.slice(i, j + 1))
      throw new Error('no object')
    },
  ]
  for (const fn of attempts) {
    try {
      return fn(s) as T
    } catch {
      /* next */
    }
  }
  throw new Error('JSON 파싱 실패')
}

export function unescapeCode(code: string): string {
  return code
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '    ')
    .replace(/\\"/g, '"')
}
