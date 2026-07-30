import { Router } from 'express'
import { z } from 'zod'
import { config } from '../config.js'
import { executeCode, SUPPORTED_LANGS } from '../services/executeEngine.js'

const router = Router()

router.get('/runtimes', (_req, res) => {
  res.json({
    data: SUPPORTED_LANGS.map((ui) => ({
      ui,
      engine: 'judge0',
      note: 'Judge0 CE primary; Wandbox fallback for some languages',
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

    const data = await executeCode(body.language, body.code, body.stdin || '')
    res.json({ data })
  } catch (e) {
    next(e)
  }
})

export default router
