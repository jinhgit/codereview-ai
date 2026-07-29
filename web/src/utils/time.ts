export function ago(ts: number): string {
  const d = Date.now() - ts
  if (d < 60000) return '방금'
  if (d < 3600000) return `${Math.floor(d / 60000)}분 전`
  if (d < 86400000) return `${Math.floor(d / 3600000)}시간 전`
  return `${Math.floor(d / 86400000)}일 전`
}
