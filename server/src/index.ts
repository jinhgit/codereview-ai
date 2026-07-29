import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { config, hasServerKey } from './config.js'
import { errorHandler } from './middleware/error.js'
import aiRouter from './routes/ai.js'
import executeRouter from './routes/execute.js'
import githubRouter from './routes/github.js'

const app = express()

app.use(helmet({ contentSecurityPolicy: false }))
app.use(
  cors({
    origin: config.corsOrigin.split(',').map((s) => s.trim()),
    exposedHeaders: ['X-Model', 'X-Model-Label'],
  }),
)
app.use(express.json({ limit: '1mb' }))

app.use(
  rateLimit({
    windowMs: 60_000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMIT',
        message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      },
    },
  }),
)

app.get('/api/v1/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'codereview-ai-bff',
    time: new Date().toISOString(),
  })
})

app.get('/api/v1/config', (_req, res) => {
  res.json({
    data: {
      hasServerKey: hasServerKey(),
      allowClientKey: config.allowClientKey,
      maxCodeChars: config.maxCodeChars,
    },
  })
})

app.use('/api/v1/ai', aiRouter)
app.use('/api/v1/execute', executeRouter)
app.use('/api/v1/github', githubRouter)

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`[BFF] http://localhost:${config.port}`)
  console.log(
    `[BFF] server key: ${hasServerKey() ? 'configured' : 'missing'} | allow client key: ${config.allowClientKey}`,
  )
})
