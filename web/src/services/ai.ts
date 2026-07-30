import type { FixResult, Lang, OptimizeResult, ReviewResult } from '../types'
import { apiPost, isBffReachable } from './apiClient'
import {
  standaloneFix,
  standaloneOptimize,
  standaloneReview,
} from './standalone'

export async function analyzeCode(
  code: string,
  lang: Lang,
  onModelChange?: (label: string) => void,
): Promise<ReviewResult> {
  if (await isBffReachable()) {
    try {
      const res = await apiPost<ReviewResult>('/api/v1/ai/review', {
        language: lang,
        code,
      })
      if (res.modelLabel) onModelChange?.(res.modelLabel)
      return res.data
    } catch {
      /* fall through */
    }
  }
  return standaloneReview(code, lang, onModelChange)
}

export async function fixCode(
  code: string,
  lang: Lang,
  onModelChange?: (label: string) => void,
): Promise<FixResult> {
  if (await isBffReachable()) {
    try {
      const res = await apiPost<FixResult>('/api/v1/ai/fix', {
        language: lang,
        code,
      })
      if (res.modelLabel) onModelChange?.(res.modelLabel)
      return res.data
    } catch {
      /* fall through */
    }
  }
  return standaloneFix(code, lang, onModelChange)
}

export async function optimizeCode(
  code: string,
  lang: Lang,
  onModelChange?: (label: string) => void,
): Promise<OptimizeResult> {
  if (await isBffReachable()) {
    try {
      const res = await apiPost<OptimizeResult>('/api/v1/ai/optimize', {
        language: lang,
        code,
      })
      if (res.modelLabel) onModelChange?.(res.modelLabel)
      return res.data
    } catch {
      /* fall through */
    }
  }
  return standaloneOptimize(code, lang, onModelChange)
}
