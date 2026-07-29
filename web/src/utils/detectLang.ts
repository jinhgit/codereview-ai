import type { Lang } from '../types'

export function detectLang(code: string): Lang | null {
  const c = code.trim()
  if (!c) return null

  if (
    /^(def |class |import |from |print\(|if __name__|async def )/.test(c) ||
    /:\s*\n/.test(c)
  ) {
    return 'python'
  }

  if (/^(const |let |var |function |=>|async |require\(|module\.exports)/.test(c)) {
    if (/:\s*(string|number|boolean|any|void)\b/.test(c) || /interface |type /.test(c)) {
      return 'typescript'
    }
    return 'javascript'
  }

  if (/public\s+(class|static|void|int|String)/.test(c) || /import java\./.test(c)) {
    return 'java'
  }

  if (
    /#include\s*<(iostream|vector|string|map|algorithm)>/.test(c) ||
    /std::/.test(c) ||
    /cout\s*<</.test(c)
  ) {
    return 'cpp'
  }

  if (/#include\s*<(stdio|stdlib|string)\.h>/.test(c) || /printf\s*\(|scanf\s*\(/.test(c)) {
    return 'c'
  }

  if (/^package main/.test(c) || /^import\s*"fmt"/.test(c) || /func main\(\)/.test(c)) {
    return 'go'
  }

  if (/^fn main\(\)/.test(c) || /let mut /.test(c) || /println!\(/.test(c)) {
    return 'rust'
  }

  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s/i.test(c)) {
    return 'sql'
  }

  if (/interface |: string|: number|: boolean/.test(c)) {
    return 'typescript'
  }

  return null
}
