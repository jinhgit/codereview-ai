import type { FixResult, Lang, OptimizeResult, ReviewResult } from '../types'
import { apiPost } from './apiClient'

export async function analyzeCode(
  code: string,
  lang: Lang,
  onModelChange?: (label: string) => void,
): Promise<ReviewResult> {
  const res = await apiPost<ReviewResult>('/api/v1/ai/review', {
    language: lang,
    code,
  })
  if (res.modelLabel) onModelChange?.(res.modelLabel)
  return res.data
}

export async function fixCode(
  code: string,
  lang: Lang,
  onModelChange?: (label: string) => void,
): Promise<FixResult> {
  const res = await apiPost<FixResult>('/api/v1/ai/fix', {
    language: lang,
    code,
  })
  if (res.modelLabel) onModelChange?.(res.modelLabel)
  return res.data
}

export async function optimizeCode(
  code: string,
  lang: Lang,
  onModelChange?: (label: string) => void,
): Promise<OptimizeResult> {
  const res = await apiPost<OptimizeResult>('/api/v1/ai/optimize', {
    language: lang,
    code,
  })
  if (res.modelLabel) onModelChange?.(res.modelLabel)
  return res.data
}
