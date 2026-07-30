import type { ExecResult, Lang } from '../types'
import { apiPost, isBffReachable } from './apiClient'
import { executeCode } from './executeEngine'

export async function runOnPiston(
  code: string,
  lang: Lang,
  stdin = '',
): Promise<ExecResult> {
  // 1) BFF 경유 (서버 측 Judge0/Wandbox)
  if (await isBffReachable()) {
    try {
      const res = await apiPost<ExecResult>(
        '/api/v1/execute',
        { language: lang, code, stdin },
        { requireKey: false },
      )
      return res.data
    } catch (e) {
      // BFF 실패 시 브라우저 직접 실행으로 폴백
      console.warn('[execute] BFF failed, falling back to client engine', e)
    }
  }

  // 2) 클라이언트 직접 (Judge0 / Wandbox)
  return executeCode(code, lang, stdin)
}
