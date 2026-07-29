import { Router } from 'express'
import { z } from 'zod'
import { HttpError } from '../services/groq.js'

const router = Router()

function toRaw(url: string): string {
  let u = url.trim()
  if (u.includes('github.com') && !u.includes('raw.')) {
    u = u
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/')
  }
  return u
}

router.post('/fetch', async (req, res, next) => {
  try {
    const body = z
      .object({
        url: z.string().url().max(2000),
        token: z.string().max(300).optional(),
      })
      .parse(req.body)

    const raw = toRaw(body.url)
    const headers: Record<string, string> = {
      'User-Agent': 'CodeReview-AI-BFF',
    }
    if (body.token?.trim()) {
      headers.Authorization = `token ${body.token.trim()}`
    }

    const r = await fetch(raw, { headers })
    if (!r.ok) throw new HttpError(r.status, `GitHub HTTP ${r.status}`)
    const content = await r.text()
    res.json({
      data: {
        content,
        rawUrl: raw,
        lines: content.split('\n').length,
      },
    })
  } catch (e) {
    next(e)
  }
})

export default router
