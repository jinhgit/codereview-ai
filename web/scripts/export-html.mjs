import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const webRoot = join(__dirname, '..')
const distHtml = join(webRoot, 'dist', 'index.html')
const outHtml = join(webRoot, '..', 'codereview-ai.html')

let html = readFileSync(distHtml, 'utf8')

// 단일 파일 배포 안내 주석
const banner = `<!--
  CodeReview AI — standalone single-file build
  Generated from web/ (React + TS). Do not edit by hand; run: npm run build:html --prefix web
  - BFF 있으면 /api 사용, 없으면 브라우저에서 Groq/Piston 직접 호출 (sessionStorage API Key)
-->
`
if (!html.includes('CodeReview AI — standalone')) {
  html = html.replace('<!doctype html>', `<!doctype html>\n${banner}`)
  if (!html.startsWith('<!doctype') && !html.startsWith('<!DOCTYPE')) {
    html = banner + html
  }
}

writeFileSync(outHtml, html)
// also keep dist copy
copyFileSync(outHtml, join(webRoot, 'dist', 'codereview-ai.html'))

const kb = (html.length / 1024).toFixed(1)
console.log(`Wrote ${outHtml} (${kb} KB)`)
