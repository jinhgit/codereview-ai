import { config } from '../config.js'
import { HttpError } from './groq.js'

export const LRT: Record<string, { language: string; version: string; ext: string }> = {
  python: { language: 'python', version: '3.10.0', ext: 'main.py' },
  javascript: { language: 'javascript', version: '18.15.0', ext: 'main.js' },
  typescript: { language: 'typescript', version: '5.0.3', ext: 'main.ts' },
  java: { language: 'java', version: '15.0.2', ext: 'Main.java' },
  c: { language: 'c', version: '10.2.0', ext: 'main.c' },
  cpp: { language: 'c++', version: '10.2.0', ext: 'main.cpp' },
  go: { language: 'go', version: '1.16.2', ext: 'main.go' },
  rust: { language: 'rust', version: '1.50.0', ext: 'main.rs' },
  sql: { language: 'sqlite3', version: '3.36.0', ext: 'main.sql' },
}

export async function runPiston(language: string, code: string, stdin = '') {
  const rt = LRT[language]
  if (!rt) {
    throw new HttpError(400, `${language}는 현재 실행을 지원하지 않습니다`)
  }

  const t0 = Date.now()
  const body: Record<string, unknown> = {
    language: rt.language,
    version: rt.version,
    files: [{ name: rt.ext, content: code }],
  }
  if (stdin) body.stdin = stdin

  try {
    const res = await fetch(config.pistonUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new HttpError(res.status, `Piston HTTP ${res.status}`)
    const d = (await res.json()) as {
      run?: { stdout?: string; stderr?: string; code?: number }
      compile?: { stdout?: string; stderr?: string }
    }
    const elapsed = ((Date.now() - t0) / 1000).toFixed(3)
    const run = d.run || {}
    const comp = d.compile || {}
    const exitCode = typeof run.code === 'number' ? run.code : 0
    return {
      ok: exitCode === 0,
      stdout: (run.stdout || '').trimEnd(),
      stderr: (run.stderr || '').trimEnd(),
      compileStdout: (comp.stdout || '').trimEnd(),
      compileStderr: (comp.stderr || '').trimEnd(),
      exitCode,
      elapsed,
      language: rt.language,
    }
  } catch (e) {
    if (e instanceof HttpError) throw e
    throw new HttpError(
      502,
      '네트워크 연결 오류. 인터넷을 확인하거나 잠시 후 재시도해주세요.',
    )
  }
}
