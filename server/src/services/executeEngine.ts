/**
 * 서버 측 코드 실행
 * emkc 공개 Piston은 2026-02 이후 화이트리스트 전용 → Judge0 CE 기본
 */
import { config } from '../config.js'
import { HttpError } from './groq.js'

const JUDGE0_URL = process.env.JUDGE0_URL || config.judge0Url
const WANDBOX_URL = 'https://wandbox.org/api/compile.json'
const UA = 'CodeReviewAI-BFF/1.0 (educational)'

export type ExecResult = {
  ok: boolean
  stdout: string
  stderr: string
  compileStdout: string
  compileStderr: string
  exitCode: number
  elapsed: string
  language: string
  error?: string
  engine?: string
}

const JUDGE0_LANG: Record<string, number> = {
  python: 100,
  javascript: 93,
  typescript: 94,
  java: 91,
  c: 103,
  cpp: 105,
  go: 106,
  rust: 108,
  sql: 82,
}

const WANDBOX_COMPILER: Record<string, string> = {
  python: 'cpython-3.12.7',
  c: 'gcc-13.2.0-c',
  cpp: 'gcc-13.2.0',
  java: 'openjdk-jdk-21+35',
}

const PISTON_LANG: Record<string, { language: string; version: string; ext: string }> = {
  python: { language: 'python', version: '*', ext: 'main.py' },
  javascript: { language: 'javascript', version: '*', ext: 'main.js' },
  typescript: { language: 'typescript', version: '*', ext: 'main.ts' },
  java: { language: 'java', version: '*', ext: 'Main.java' },
  c: { language: 'c', version: '*', ext: 'main.c' },
  cpp: { language: 'c++', version: '*', ext: 'main.cpp' },
  go: { language: 'go', version: '*', ext: 'main.go' },
  rust: { language: 'rust', version: '*', ext: 'main.rs' },
  sql: { language: 'sqlite3', version: '*', ext: 'main.sql' },
}

export const SUPPORTED_LANGS = Object.keys(JUDGE0_LANG)

async function runJudge0(
  code: string,
  lang: string,
  stdin: string,
): Promise<ExecResult> {
  const languageId = JUDGE0_LANG[lang]
  if (!languageId) throw new HttpError(400, `${lang}는 실행을 지원하지 않습니다`)

  const t0 = Date.now()
  const res = await fetch(
    `${JUDGE0_URL.replace(/\/$/, '')}/submissions?base64_encoded=false&wait=true`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': UA,
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: stdin || '',
        cpu_time_limit: 5,
        wall_time_limit: 10,
        memory_limit: 128000,
      }),
    },
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Judge0 HTTP ${res.status}: ${text.slice(0, 160)}`)
  }

  const d = (await res.json()) as {
    stdout?: string | null
    stderr?: string | null
    compile_output?: string | null
    message?: string | null
    time?: string | null
    status?: { id?: number; description?: string }
  }

  const elapsed =
    d.time != null
      ? String(Number(d.time).toFixed(3))
      : ((Date.now() - t0) / 1000).toFixed(3)
  const statusId = d.status?.id ?? 0
  const ok = statusId === 3
  const compileOut = (d.compile_output || '').trimEnd()
  const stdout = (d.stdout || '').trimEnd()
  const stderr = (d.stderr || d.message || '').trimEnd()

  return {
    ok,
    stdout,
    stderr,
    compileStdout: '',
    compileStderr: compileOut,
    exitCode: ok ? 0 : statusId || 1,
    elapsed,
    language: lang,
    engine: 'judge0',
  }
}

async function runWandbox(
  code: string,
  lang: string,
  stdin: string,
): Promise<ExecResult> {
  const compiler = WANDBOX_COMPILER[lang]
  if (!compiler) throw new Error(`${lang} Wandbox 미지원`)

  const t0 = Date.now()
  const res = await fetch(WANDBOX_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({
      code,
      compiler,
      options: '',
      stdin: stdin || '',
    }),
  })
  if (!res.ok) throw new Error(`Wandbox HTTP ${res.status}`)
  const d = (await res.json()) as {
    status?: string | number
    program_output?: string
    program_message?: string
    program_error?: string
    compiler_error?: string
    compiler_message?: string
  }
  const elapsed = ((Date.now() - t0) / 1000).toFixed(3)
  const statusNum = Number(d.status)
  const ok = !Number.isNaN(statusNum)
    ? statusNum === 0
    : !d.compiler_error && !d.program_error

  return {
    ok,
    stdout: (d.program_output || d.program_message || '').trimEnd(),
    stderr: (d.program_error || '').trimEnd(),
    compileStdout: '',
    compileStderr: (d.compiler_error || d.compiler_message || '').trimEnd(),
    exitCode: ok ? 0 : 1,
    elapsed,
    language: lang,
    engine: 'wandbox',
  }
}

async function runPiston(
  code: string,
  lang: string,
  stdin: string,
): Promise<ExecResult> {
  const rt = PISTON_LANG[lang]
  if (!rt) throw new Error(`${lang} Piston 미지원`)
  const base = (process.env.PISTON_URL || config.pistonUrl || '').replace(/\/$/, '')
  if (!base) throw new Error('PISTON_URL 없음')

  // emkc public is whitelist-only; only call if custom URL
  const isEmkc = base.includes('emkc.org')
  if (isEmkc && !process.env.PISTON_API_KEY) {
    throw new Error(
      'emkc 공개 Piston은 화이트리스트 전용입니다. JUDGE0 또는 자체 Piston을 사용하세요.',
    )
  }

  const url = base.includes('/execute') ? base : `${base}/api/v2/execute`
  const t0 = Date.now()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': UA,
  }
  if (process.env.PISTON_API_KEY) {
    headers.Authorization = `Bearer ${process.env.PISTON_API_KEY}`
  }

  const body: Record<string, unknown> = {
    language: rt.language,
    version: rt.version,
    files: [{ name: rt.ext, content: code }],
  }
  if (stdin) body.stdin = stdin

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Piston HTTP ${res.status}: ${text.slice(0, 160)}`)
  }
  const d = (await res.json()) as {
    message?: string
    run?: { stdout?: string; stderr?: string; code?: number }
    compile?: { stdout?: string; stderr?: string }
  }
  if (d.message && !d.run) throw new Error(d.message)

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
    engine: 'piston',
  }
}

export async function executeCode(
  code: string,
  lang: string,
  stdin = '',
): Promise<ExecResult> {
  const errors: string[] = []
  const customPiston =
    process.env.PISTON_URL && !process.env.PISTON_URL.includes('emkc.org')

  if (customPiston || process.env.PISTON_API_KEY) {
    try {
      return await runPiston(code, lang, stdin)
    } catch (e) {
      errors.push(`Piston: ${e instanceof Error ? e.message : e}`)
    }
  }

  try {
    return await runJudge0(code, lang, stdin)
  } catch (e) {
    errors.push(`Judge0: ${e instanceof Error ? e.message : e}`)
  }

  if (WANDBOX_COMPILER[lang]) {
    try {
      return await runWandbox(code, lang, stdin)
    } catch (e) {
      errors.push(`Wandbox: ${e instanceof Error ? e.message : e}`)
    }
  }

  throw new HttpError(
    502,
    `코드 실행 실패. ${errors.join(' | ') || '사용 가능한 실행 엔진이 없습니다.'}`,
  )
}
