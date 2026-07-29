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
  pistonUrl: process.env.PISTON_URL || 'https://emkc.org/api/v2/piston/execute',
}

export function hasServerKey(): boolean {
  return config.groqApiKey.startsWith('gsk_')
}
