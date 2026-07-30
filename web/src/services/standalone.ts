/**
 * BFF 없이 단일 HTML/정적 배포 시 브라우저에서 직접 호출하는 폴백 로직
 */
import type { FixResult, Lang, OptimizeResult, ReviewResult } from '../types'
import type { AiReview, AiReviewItem, PullRequest } from '../types/collab'
import type { LlmTurn } from '../types/chat'
import { parseJSON, unescapeCode } from '../utils/parseJson'
import { callGroq } from './groq'
import { executeCode } from './executeEngine'
import { gid } from './collabStore'

export async function standaloneReview(
  code: string,
  lang: Lang,
  onModelChange?: (label: string) => void,
): Promise<ReviewResult> {
  const prompt =
    `아래 ${lang} 코드를 분석하고 JSON만 반환하세요.\n코드:\`\`\`${lang}\n${code}\n\`\`\`\n` +
    `{"scores":{"total":0-100,"style":0-100,"performance":0-100,"safety":0-100,"readability":0-100,"grade":"A/B/C/D/F","summary":"한줄평가"},` +
    `"score_details":{"style":{"reason":"이유","problems":["문제"],"tips":[{"title":"팁","desc":"설명","code":""}]},` +
    `"performance":{"reason":"이유","problems":["문제"],"tips":[{"title":"팁","desc":"설명","code":""}]},` +
    `"safety":{"reason":"이유","problems":["문제"],"tips":[{"title":"팁","desc":"설명","code":""}]},` +
    `"readability":{"reason":"이유","problems":["문제"],"tips":[{"title":"팁","desc":"설명","code":""}]}},` +
    `"style":[{"severity":"info|warning|error","title":"제목","description":"설명","suggestion":"예시"}],` +
    `"complexity":{"time":"O(?)","space":"O(?)","rating":"good|ok|bad","explanation":"설명","items":[{"severity":"info","title":"제목","description":"설명"}]},` +
    `"bugs":[{"severity":"error","title":"제목","description":"설명","suggestion":"예시"}],` +
    `"refactoring":[{"severity":"warning","title":"제목","description":"설명","suggestion":"예시"}],` +
    `"algorithms":[{"severity":"info","title":"제목","description":"설명","suggestion":"예시"}],` +
    `"datastructures":[{"severity":"info","title":"제목","description":"설명","suggestion":"예시"}]}\n한국어,JSON만`

  const raw = await callGroq(
    [
      { role: 'system', content: '수석 소프트웨어 엔지니어. 순수 JSON만 반환.' },
      { role: 'user', content: prompt },
    ],
    { jsonMode: true, onModelChange },
  )
  return parseJSON<ReviewResult>(raw)
}

export async function standaloneFix(
  code: string,
  lang: Lang,
  onModelChange?: (label: string) => void,
): Promise<FixResult> {
  const userMsg =
    `아래 ${lang} 코드의 오류를 찾아 수정하세요. JSON만 반환.\n\n코드:\n${code}` +
    `\n\n형식: {"has_errors":true,"error_count":2,"summary":"요약","errors":[{"type":"SyntaxError","line":3,"original":"오류줄","problem":"문제설명","fix":"수정방법","fixed_code":"수정줄"}],"fixed_full_code":"수정된 전체 코드"}\n` +
    `오류없으면: {"has_errors":false,"error_count":0,"summary":"정상","errors":[],"fixed_full_code":"원본코드"}`

  const raw = await callGroq(
    [
      {
        role: 'system',
        content: '코드 오류 수정 전문가. 순수 JSON만 반환. 마크다운 절대 금지.',
      },
      { role: 'user', content: userMsg },
    ],
    { jsonMode: false, onModelChange },
  )

  let result: FixResult | null = null
  try {
    result = parseJSON<FixResult>(raw)
  } catch {
    const fi = raw.indexOf('"fixed_full_code"')
    if (fi !== -1) {
      const ac = raw.indexOf('"', fi + 18)
      if (ac !== -1) {
        const ex = unescapeCode(raw.slice(ac + 1, raw.lastIndexOf('"')))
        result = {
          has_errors: true,
          error_count: 1,
          summary: '오류가 수정되었습니다.',
          errors: [],
          fixed_full_code: ex,
        }
      }
    }
  }
  if (!result?.fixed_full_code) throw new Error('응답 파싱 실패. 다시 시도해주세요.')
  result.fixed_full_code = unescapeCode(result.fixed_full_code).trim()
  return result
}

export async function standaloneOptimize(
  code: string,
  lang: Lang,
  onModelChange?: (label: string) => void,
): Promise<OptimizeResult> {
  const prompt =
    `아래 ${lang} 코드를 최적화해주세요.\n[원본]\n${code}\n[형식] JSON만. 마크다운 없음.\n` +
    `{"summary":"개선 요약","score_before":점수,"score_after":점수,"changes":[{"type":"fix","title":"제목","detail":"설명"}],"optimized_code":"최적화된 전체 코드"}\n` +
    `최적화: 보안취약점 제거, 하드코딩 제거, 성능개선, 스타일, 가독성, 한국어주석`

  const raw = await callGroq(
    [
      {
        role: 'system',
        content: '수석 소프트웨어 엔지니어. 유효한 JSON만 반환. 마크다운 금지.',
      },
      { role: 'user', content: prompt },
    ],
    { jsonMode: false, onModelChange },
  )

  let result: OptimizeResult
  try {
    result = parseJSON<OptimizeResult>(raw)
  } catch {
    const m = raw.match(/"optimized_code"\s*:\s*"([\s\S]*?)"\s*[,}]/)
    const sm = raw.match(/"summary"\s*:\s*"([^"]+)"/)
    if (!m) throw new Error('파싱 실패')
    result = {
      summary: sm ? sm[1] : '최적화 완료',
      score_before: 50,
      score_after: 80,
      changes: [
        { type: 'improve', title: '코드 최적화', detail: 'AI가 최적화했습니다.' },
      ],
      optimized_code: unescapeCode(m[1]),
    }
  }
  if (!result.optimized_code) throw new Error('최적화된 코드가 없습니다.')
  result.optimized_code = unescapeCode(result.optimized_code)
  return result
}

export async function standaloneChat(
  history: LlmTurn[],
  onModelChange?: (label: string) => void,
): Promise<string> {
  return callGroq(
    [
      {
        role: 'system',
        content:
          '전문 코드 AI 어시스턴트. 코드 요청 시 완전하고 실행 가능한 코드 제공. 마크다운 코드블록 사용. 한국어 답변. 한국어 주석.',
      },
      ...history.map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
    ],
    { jsonMode: false, onModelChange },
  )
}

export async function standalonePrReview(
  pr: PullRequest,
  onModelChange?: (label: string) => void,
): Promise<AiReview> {
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

  const raw = await callGroq(
    [
      {
        role: 'system',
        content: '코드 리뷰 전문 AI. 순수 JSON만 반환. 마크다운 금지.',
      },
      { role: 'user', content: prompt },
    ],
    { jsonMode: false, maxTokens: 3000, onModelChange },
  )

  const parsed = parseJSON<{
    score?: number
    bugScore?: number
    perfScore?: number
    styleScore?: number
    secScore?: number
    testScore?: number
    summary?: string
    items?: AiReviewItem[]
  }>(raw)

  return {
    id: gid(),
    model: 'standalone',
    score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
    bugScore: Number(parsed.bugScore) || 0,
    perfScore: Number(parsed.perfScore) || 0,
    styleScore: Number(parsed.styleScore) || 0,
    secScore: Number(parsed.secScore) || 0,
    testScore: Number(parsed.testScore) || 0,
    summary: parsed.summary || '분석 완료',
    items: (parsed.items || []).map((item) => ({
      ...item,
      id: item.id || gid(),
      hd: item.hd || '',
    })),
    humanApproved: false,
    createdAt: Date.now(),
  }
}

export { executeCode as standaloneExecute }
