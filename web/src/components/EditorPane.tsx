import { useEffect, useRef } from 'react'
import { SAMPLE_CHIPS, SAMPLES } from '../data/samples'
import type { Lang } from '../types'
import { LANG_OPTIONS } from '../types'
import { detectLang } from '../utils/detectLang'
import styles from './EditorPane.module.css'

type Props = {
  code: string
  lang: Lang
  activeSample: string
  busy: boolean
  onCodeChange: (code: string) => void
  onLangChange: (lang: Lang) => void
  onSample: (id: string) => void
  onReview: () => void
  onFix: () => void
  onRun: () => void
}

export function EditorPane({
  code,
  lang,
  activeSample,
  busy,
  onCodeChange,
  onLangChange,
  onSample,
  onReview,
  onFix,
  onRun,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const lnRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lines = Math.max(1, code.split('\n').length)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const handleChange = (v: string) => {
    onCodeChange(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const d = detectLang(v)
      if (d && d !== lang) onLangChange(d)
    }, 800)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const el = e.currentTarget
    const s = el.selectionStart
    const end = el.selectionEnd
    const next = code.slice(0, s) + '  ' + code.slice(end)
    onCodeChange(next)
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = s + 2
    })
  }

  const pickSample = (id: string) => {
    onSample(id)
    onCodeChange(SAMPLES[id] || '')
    onLangChange('python')
  }

  return (
    <div className={styles.pane}>
      <div className={styles.ph}>
        <span className={styles.pt}>Code Editor</span>
        <select
          className={styles.lsel}
          value={lang}
          onChange={(e) => onLangChange(e.target.value as Lang)}
        >
          {LANG_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.ew}>
        <div className={styles.lnums} ref={lnRef}>
          {Array.from({ length: lines }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <textarea
          ref={taRef}
          className={styles.cta}
          spellCheck={false}
          value={code}
          placeholder="코드를 입력하거나 샘플을 선택하세요..."
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={onKeyDown}
          onScroll={() => {
            if (lnRef.current && taRef.current) {
              lnRef.current.scrollTop = taRef.current.scrollTop
            }
          }}
        />
      </div>

      <div className={styles.bbar}>
        <div className={styles.chips}>
          {SAMPLE_CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`${styles.chip} ${activeSample === c.id ? styles.on : ''}`}
              onClick={() => pickSample(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className={styles.btnRow}>
          <button
            type="button"
            className={styles.runBtn}
            disabled={busy}
            onClick={onReview}
          >
            {busy ? <span className="spin" /> : null}
            ⚡ 코드 리뷰
          </button>
          <button
            type="button"
            className={styles.fixBtn}
            disabled={busy}
            onClick={onFix}
          >
            🔧 오류 수정
          </button>
          <button
            type="button"
            className={styles.execBtn}
            disabled={busy}
            onClick={onRun}
          >
            <span>▶</span> 실행
          </button>
        </div>
      </div>
    </div>
  )
}
