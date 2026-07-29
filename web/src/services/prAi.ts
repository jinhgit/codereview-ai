import type { AiReview, PullRequest } from '../types/collab'
import { apiPost } from './apiClient'
import { gid } from './collabStore'

export async function runPrAiReview(
  pr: PullRequest,
  onModelChange?: (label: string) => void,
): Promise<AiReview> {
  const res = await apiPost<Omit<AiReview, 'id'>>('/api/v1/ai/pr-review', {
    title: pr.title,
    before: pr.before || '',
    after: pr.after || '',
  })
  if (res.modelLabel) onModelChange?.(res.modelLabel)
  const d = res.data
  return {
    id: gid(),
    model: d.model || res.model || 'AI',
    score: d.score,
    bugScore: d.bugScore,
    perfScore: d.perfScore,
    styleScore: d.styleScore,
    secScore: d.secScore,
    testScore: d.testScore,
    summary: d.summary,
    items: (d.items || []).map((it) => ({
      ...it,
      id: it.id || gid(),
      hd: it.hd || '',
    })),
    humanApproved: false,
    createdAt: d.createdAt || Date.now(),
  }
}
