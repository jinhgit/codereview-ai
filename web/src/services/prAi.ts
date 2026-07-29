import type { AiReview, AiReviewItem, PullRequest } from '../types/collab'
import { parseJSON } from '../utils/parseJson'
import { getGroqKey } from './keyStore'
import { gid } from './collabStore'

const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
]

export async function runPrAiReview(
  pr: PullRequest,
  onModelChange?: (label: string) => void,
): Promise<AiReview> {
  const key = getGroqKey()
  if (!key) throw new Error('Groq API 키가 필요합니다.')

  const prompt =
    `PR 코드 변경을 분석하고 JSON만 반환하세요. 마크다운 없음.\n\n` +
    `PR 제목: ${pr.title}\n` +
    `변경 전:\n\`\`\`\n${pr.before || '(없음)'}\n\`\`\`\n` +
    `변경 후:\n\`\`\`\n${pr.after || '(없음)'}\n\`\`\`\n\n` +
    `{"score":0-100,"bugScore":0-100,"perfScore":0-100,"styleScore":0-100,"secScore":0-100,"testScore":0-100,` +
    `"summary":"AI 종합 평가 한 문장","items":[{"id":"1","category":"bug|performance|style|security|test",` +
    `"severity":"error|warning|info|suggestion","title":"제목","description":"설명",` +
    `"line":줄번호또는null,"suggestion":"개선코드또는빈문자열"}]}\n` +
    `items 2~6개, 실제 발견된 문제 위주, 한국어, JSON만 반환`

  let lastErr = '모든 모델 시도 실패'
  for (let i = 0; i < MODELS.length; i++) {
    const model = MODELS[i]
    onModelChange?.(model)
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: '코드 리뷰 전문 AI. 순수 JSON만 반환. 마크다운 금지.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 3000,
        }),
      })
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 800))
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const raw = ((data.choices?.[0]?.message?.content as string) || '').trim()
      const result = parseJSON<{
        score?: number
        bugScore?: number
        perfScore?: number
        styleScore?: number
        secScore?: number
        testScore?: number
        summary?: string
        items?: AiReviewItem[]
      }>(raw)

      const items: AiReviewItem[] = (result.items || []).map((item) => ({
        ...item,
        id: item.id || gid(),
        hd: (item.hd as AiReviewItem['hd']) || '',
      }))

      return {
        id: gid(),
        model,
        score: Math.min(100, Math.max(0, Number(result.score) || 0)),
        bugScore: Number(result.bugScore) || 0,
        perfScore: Number(result.perfScore) || 0,
        styleScore: Number(result.styleScore) || 0,
        secScore: Number(result.secScore) || 0,
        testScore: Number(result.testScore) || 0,
        summary: result.summary || '분석 완료',
        items,
        humanApproved: false,
        createdAt: Date.now(),
      }
    } catch (e) {
      lastErr = e instanceof Error ? e.message : '실패'
    }
  }
  throw new Error(lastErr)
}
