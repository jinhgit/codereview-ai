import { Router } from 'express'
import { z } from 'zod'
import type { AuthedRequest } from '../middleware/auth.js'
import { resolveGroqKey } from '../middleware/auth.js'
import {
  chatSystem,
  fixPrompt,
  optimizePrompt,
  prReviewPrompt,
  reviewPrompt,
} from '../prompts.js'
import { callGroq, HttpError, PR_MODELS } from '../services/groq.js'
import { parseJSON, unescapeCode } from '../utils/parseJson.js'
import { config } from '../config.js'

const router = Router()
const langSchema = z.string().min(1).max(32)
const codeSchema = z.string().min(1).max(config.maxCodeChars)

function keyOf(req: AuthedRequest): string {
  const k = req.groqKey
  if (!k) throw new HttpError(401, 'API 키가 필요합니다')
  return k
}

router.post('/review', resolveGroqKey, async (req, res, next) => {
  try {
    const body = z
      .object({ language: langSchema, code: codeSchema })
      .parse(req.body)
    const p = reviewPrompt(body.language, body.code)
    const result = await callGroq(
      keyOf(req as AuthedRequest),
      [
        { role: 'system', content: p.system },
        { role: 'user', content: p.user },
      ],
      { jsonMode: p.jsonMode, maxTokens: 8192 },
    )
    const data = parseJSON(result.content)
    res.json({ data, model: result.model, modelLabel: result.modelLabel })
  } catch (e) {
    next(e)
  }
})

router.post('/fix', resolveGroqKey, async (req, res, next) => {
  try {
    const body = z
      .object({ language: langSchema, code: codeSchema })
      .parse(req.body)
    const p = fixPrompt(body.language, body.code)
    const result = await callGroq(
      keyOf(req as AuthedRequest),
      [
        { role: 'system', content: p.system },
        { role: 'user', content: p.user },
      ],
      { jsonMode: p.jsonMode, maxTokens: 8192 },
    )

    let data: {
      has_errors?: boolean
      error_count?: number
      summary?: string
      errors?: unknown[]
      fixed_full_code?: string
    } | null = null
    try {
      data = parseJSON(result.content)
    } catch {
      const raw = result.content
      const fi = raw.indexOf('"fixed_full_code"')
      if (fi !== -1) {
        const ac = raw.indexOf('"', fi + 18)
        if (ac !== -1) {
          const ex = unescapeCode(raw.slice(ac + 1, raw.lastIndexOf('"')))
          data = {
            has_errors: true,
            error_count: 1,
            summary: '오류가 수정되었습니다.',
            errors: [],
            fixed_full_code: ex,
          }
        }
      }
    }
    if (!data?.fixed_full_code) {
      throw new HttpError(502, '응답 파싱 실패. 다시 시도해주세요.')
    }
    data.fixed_full_code = unescapeCode(data.fixed_full_code).trim()
    res.json({ data, model: result.model, modelLabel: result.modelLabel })
  } catch (e) {
    next(e)
  }
})

router.post('/optimize', resolveGroqKey, async (req, res, next) => {
  try {
    const body = z
      .object({ language: langSchema, code: codeSchema })
      .parse(req.body)
    const p = optimizePrompt(body.language, body.code)
    const result = await callGroq(
      keyOf(req as AuthedRequest),
      [
        { role: 'system', content: p.system },
        { role: 'user', content: p.user },
      ],
      { jsonMode: p.jsonMode, maxTokens: 8192 },
    )

    let data: {
      summary?: string
      score_before?: number
      score_after?: number
      changes?: unknown[]
      optimized_code?: string
    }
    try {
      data = parseJSON(result.content)
    } catch {
      const m = result.content.match(
        /"optimized_code"\s*:\s*"([\s\S]*?)"\s*[,}]/,
      )
      const sm = result.content.match(/"summary"\s*:\s*"([^"]+)"/)
      if (!m) throw new HttpError(502, '파싱 실패')
      data = {
        summary: sm ? sm[1] : '최적화 완료',
        score_before: 50,
        score_after: 80,
        changes: [
          {
            type: 'improve',
            title: '코드 최적화',
            detail: 'AI가 최적화했습니다.',
          },
        ],
        optimized_code: unescapeCode(m[1]),
      }
    }
    if (!data.optimized_code) throw new HttpError(502, '최적화된 코드가 없습니다.')
    data.optimized_code = unescapeCode(data.optimized_code)
    res.json({ data, model: result.model, modelLabel: result.modelLabel })
  } catch (e) {
    next(e)
  }
})

router.post('/chat', resolveGroqKey, async (req, res, next) => {
  try {
    const body = z
      .object({
        messages: z
          .array(
            z.object({
              role: z.enum(['user', 'assistant']),
              content: z.string().min(1).max(config.maxCodeChars),
            }),
          )
          .min(1)
          .max(40),
      })
      .parse(req.body)

    const result = await callGroq(
      keyOf(req as AuthedRequest),
      [
        { role: 'system', content: chatSystem() },
        ...body.messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      { jsonMode: false, maxTokens: 8192 },
    )
    res.json({
      data: { content: result.content },
      model: result.model,
      modelLabel: result.modelLabel,
    })
  } catch (e) {
    next(e)
  }
})

router.post('/pr-review', resolveGroqKey, async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(1).max(300),
        before: z.string().max(config.maxCodeChars).default(''),
        after: z.string().max(config.maxCodeChars).default(''),
      })
      .parse(req.body)
    const p = prReviewPrompt(body.title, body.before, body.after)
    const result = await callGroq(
      keyOf(req as AuthedRequest),
      [
        { role: 'system', content: p.system },
        { role: 'user', content: p.user },
      ],
      { jsonMode: p.jsonMode, maxTokens: 3000, models: PR_MODELS },
    )
    const parsed = parseJSON<{
      score?: number
      bugScore?: number
      perfScore?: number
      styleScore?: number
      secScore?: number
      testScore?: number
      summary?: string
      items?: {
        id?: string
        category?: string
        severity?: string
        title?: string
        description?: string
        line?: number | null
        suggestion?: string
      }[]
    }>(result.content)

    const items = (parsed.items || []).map((item, i) => ({
      ...item,
      id: item.id || `item_${i + 1}_${Date.now().toString(36)}`,
      hd: '',
    }))

    res.json({
      data: {
        model: result.model,
        score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
        bugScore: Number(parsed.bugScore) || 0,
        perfScore: Number(parsed.perfScore) || 0,
        styleScore: Number(parsed.styleScore) || 0,
        secScore: Number(parsed.secScore) || 0,
        testScore: Number(parsed.testScore) || 0,
        summary: parsed.summary || '분석 완료',
        items,
        humanApproved: false,
        createdAt: Date.now(),
      },
      model: result.model,
      modelLabel: result.modelLabel,
    })
  } catch (e) {
    next(e)
  }
})

export default router
