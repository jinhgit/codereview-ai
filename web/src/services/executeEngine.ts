/**
 * 코드 실행 엔진
 * - emkc Piston 공개 API는 2026-02 이후 화이트리스트 전용 → 사용 불가
 * - 기본: Judge0 CE (https://ce.judge0.com)
 * - 폴백: Wandbox (일부 언어)
 * - 옵션: 자체 Piston (VITE_PISTON_URL / 런타임 설정)
 */
import type { ExecResult, Lang } from '../types'

const JUDGE0_URL =
  (import.meta.env.VITE_JUDGE0_URL as string | undefined) ||
  'https://ce.judge0.com'
const WANDBOX_URL = 'https://wandbox.org/api/compile.json'
const PISTON_URL =
  (import.meta.env.VITE_PISTON_URL as string | undefined) || ''

/** Judge0 language_id (CE 공개 인스턴스 기준) */
const JUDGE0_LANG: Record<Lang, number> = {
  python: 100, // Python 3.12.5
  javascript: 93, // Node.js 18.15.0
  typescript: 94, // TypeScript 5.0.3
  java: 91, // JDK 17
  c: 103, // GCC 14.1.0
  cpp: 105, // G++ 14.1.0
  go: 106, // Go 1.22.0
  rust: 108, // Rust 1.85.0
  sql: 82, // SQLite 3.27.2
}

const WANDBOX_COMPILER: Partial<Record<Lang, string>> = {
  python: 'cpython-3.12.7',
  javascript: 'nodejs-20.17.0', // may not exist — probe below
  c: 'gcc-13.2.0-c',
  cpp: 'gcc-13.2.0',
  java: 'openjdk-jdk-21+35',
}

const UA = 'CodeReviewAI/1.0 (local portfolio; educational)'

function emptyResult(
  lang: string,
  elapsed: string,
  error: string,
): ExecResult {
  return {
    ok: false,
    stdout: '',
    stderr: '',
    compileStdout: '',
    compileStderr: '',
    exitCode: -1,
    elapsed,
    language: lang,
    error,
  }
}

async function runJudge0(
  code: string,
  lang: Lang,
  stdin: string,
): Promise<ExecResult> {
  const languageId = JUDGE0_LANG[lang]
  if (!languageId) {
    throw new Error(`${lang}는 Judge0에서 지원하지 않습니다`)
  }

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
    throw new Error(`Judge0 HTTP ${res.status}${text ? `: ${text.slice(0, 120)}` : ''}`)
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
  // 3 = Accepted
  const ok = statusId === 3
  const compileOut = (d.compile_output || '').trimEnd()
  const stdout = (d.stdout || '').trimEnd()
  const stderr = (d.stderr || d.message || '').trimEnd()

  // 컴파일 실패 등
  if (!ok && !stdout && !stderr && !compileOut) {
    return emptyResult(
      lang,
      elapsed,
      d.status?.description || '실행 실패',
    )
  }

  return {
    ok,
    stdout,
    stderr,
    compileStdout: '',
    compileStderr: compileOut,
    exitCode: ok ? 0 : statusId || 1,
    elapsed,
    language: lang,
    error: undefined,
  }
}

async function runWandbox(
  code: string,
  lang: Lang,
  stdin: string,
): Promise<ExecResult> {
  const compiler = WANDBOX_COMPILER[lang]
  if (!compiler) throw new Error(`${lang} Wandbox 미지원`)

  const t0 = Date.now()
  const res = await fetch(WANDBOX_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': UA,
    },
    body: JSON.stringify({
      code,
      compiler,
      options: '',
      stdin: stdin || '',
      'compiler-option-raw': '',
      'runtime-option-raw': '',
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
    signal?: string
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(3)
  const statusNum = Number(d.status)
  const ok = !Number.isNaN(statusNum) ? statusNum === 0 : !d.compiler_error && !d.program_error
  const stdout = (d.program_output || d.program_message || '').trimEnd()
  const stderr = (d.program_error || '').trimEnd()
  const compileErr = (d.compiler_error || d.compiler_message || '').trimEnd()

  return {
    ok,
    stdout,
    stderr,
    compileStdout: '',
    compileStderr: compileErr,
    exitCode: ok ? 0 : 1,
    elapsed,
    language: lang,
  }
}

async function runPistonSelfHosted(
  code: string,
  lang: Lang,
  stdin: string,
): Promise<ExecResult> {
  if (!PISTON_URL) throw new Error('PISTON_URL not set')

  const map: Record<Lang, { language: string; version: string; ext: string }> = {
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
  const rt = map[lang]
  const t0 = Date.now()
  const body: Record<string, unknown> = {
    language: rt.language,
    version: rt.version,
    files: [{ name: rt.ext, content: code }],
  }
  if (stdin) body.stdin = stdin

  const res = await fetch(PISTON_URL.replace(/\/$/, '') + (PISTON_URL.includes('/execute') ? '' : '/api/v2/execute'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(`Piston HTTP ${res.status}: ${msg.slice(0, 160)}`)
  }
  const d = await res.json()
  if (d.message && !d.run) {
    throw new Error(String(d.message))
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
}

/**
 * 우선순위: 자체 Piston → Judge0 → Wandbox
 */
export async function executeCode(
  code: string,
  lang: Lang,
  stdin = '',
): Promise<ExecResult> {
  const errors: string[] = []

  if (PISTON_URL) {
    try {
      return await runPistonSelfHosted(code, lang, stdin)
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

  return emptyResult(
    lang,
    '0',
    `코드 실행 실패. ${errors.join(' | ') || '사용 가능한 실행 엔진이 없습니다.'}`,
  )
}
