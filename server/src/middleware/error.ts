import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { HttpError } from '../services/groq.js'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: '요청 본문이 올바르지 않습니다.',
        details: err.flatten(),
      },
    })
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: 'HTTP_ERROR', message: err.message },
    })
  }
  const message = err instanceof Error ? err.message : 'Internal Server Error'
  console.error('[BFF]', err)
  return res.status(500).json({
    error: { code: 'INTERNAL', message },
  })
}
