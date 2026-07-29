import type { ExecResult, Lang } from '../types'
import { apiPost } from './apiClient'

export const LRT: Record<
  Lang,
  { language: string; version: string; ext: string }
> = {
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

export async function runOnPiston(
  code: string,
  lang: Lang,
  stdin = '',
): Promise<ExecResult> {
  try {
    const res = await apiPost<ExecResult>(
      '/api/v1/execute',
      { language: lang, code, stdin },
      { requireKey: false },
    )
    return res.data
  } catch (e) {
    return {
      ok: false,
      stdout: '',
      stderr: '',
      compileStdout: '',
      compileStderr: '',
      exitCode: -1,
      elapsed: '0',
      language: LRT[lang]?.language || lang,
      error: e instanceof Error ? e.message : '실행 실패',
    }
  }
}
