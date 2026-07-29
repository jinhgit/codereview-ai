import { Router } from 'express'
import { z } from 'zod'
import { config } from '../config.js'
import { LRT, runPiston } from '../services/piston.js'

const router = Router()

router.get('/runtimes', (_req, res) => {
  res.json({
    data: Object.entries(LRT).map(([ui, rt]) => ({
      ui,
      language: rt.language,
      version: rt.version,
      filename: rt.ext,
    })),
  })
})

router.post('/', async (req, res, next) => {
  try {
    const body = z
      .object({
        language: z.string().min(1).max(32),
        code: z.string().min(1).max(config.maxCodeChars),
        stdin: z.string().max(20_000).optional().default(''),
      })
      .parse(req.body)
    const data = await runPiston(body.language, body.code, body.stdin)
    res.json({ data })
  } catch (e) {
    next(e)
  }
})

export default router
