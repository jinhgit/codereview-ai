/** GitHub blob URL → raw content URL */
export function toRawGitHubUrl(url: string): string {
  let u = url.trim()
  if (u.includes('github.com') && !u.includes('raw.')) {
    u = u
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/')
  }
  return u
}

export async function fetchGitHubFile(
  url: string,
  token?: string,
): Promise<string> {
  const raw = toRawGitHubUrl(url)
  if (!raw) throw new Error('URL을 입력해주세요.')

  const headers: Record<string, string> = {}
  if (token?.trim()) {
    headers.Authorization = `token ${token.trim()}`
  }

  const res = await fetch(raw, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

/** 확장자로 언어 힌트 */
export function guessLangFromPath(url: string): string | null {
  const path = url.split('?')[0].toLowerCase()
  if (path.endsWith('.py')) return 'python'
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript'
  if (path.endsWith('.js') || path.endsWith('.jsx') || path.endsWith('.mjs'))
    return 'javascript'
  if (path.endsWith('.java')) return 'java'
  if (path.endsWith('.c') || path.endsWith('.h')) return 'c'
  if (path.endsWith('.cpp') || path.endsWith('.cc') || path.endsWith('.hpp'))
    return 'cpp'
  if (path.endsWith('.go')) return 'go'
  if (path.endsWith('.rs')) return 'rust'
  if (path.endsWith('.sql')) return 'sql'
  return null
}
