import 'dotenv/config'

function bool(v: string | undefined, fallback: boolean): boolean {
  if (v === undefined || v === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())
}

export const config = {
  port: Number(process.env.PORT || 8787),
  groqApiKey: (process.env.GROQ_API_KEY || '').trim(),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  allowClientKey: bool(process.env.ALLOW_CLIENT_KEY, true),
  maxCodeChars: Number(process.env.MAX_CODE_CHARS || 80_000),
  // emkc 공개 API는 2026-02 이후 화이트리스트 전용. 기본 실행은 Judge0.
  pistonUrl: process.env.PISTON_URL || '',
  judge0Url: process.env.JUDGE0_URL || 'https://ce.judge0.com',
}

export function hasServerKey(): boolean {
  return config.groqApiKey.startsWith('gsk_')
}
