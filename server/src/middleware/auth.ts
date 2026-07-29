import type { NextFunction, Request, Response } from 'express'
import { config, hasServerKey } from '../config.js'
import { HttpError } from '../services/groq.js'

export type AuthedRequest = Request & { groqKey?: string }

export function resolveGroqKey(req: Request, _res: Response, next: NextFunction) {
  const headerKey = String(req.header('x-groq-key') || '').trim()
  if (hasServerKey()) {
    ;(req as AuthedRequest).groqKey = config.groqApiKey
    return next()
  }
  if (config.allowClientKey && headerKey.startsWith('gsk_')) {
    ;(req as AuthedRequest).groqKey = headerKey
    return next()
  }
  return next(
    new HttpError(
      401,
      hasServerKey()
        ? 'API 키 인증 실패'
        : '서버 GROQ_API_KEY가 없고 클라이언트 키도 없습니다. server/.env 또는 상단 키 입력을 확인하세요.',
    ),
  )
}
