import { useState } from 'react'
import { copyText } from '../hooks/useClipboard'
import type { OptimizeResult } from '../types'
import { Icon, IconLabel } from './icons'
import styles from './OptimizeModal.module.css'

type Props = {
  open: boolean
  loading: boolean
  error: string | null
  result: OptimizeResult | null
  onClose: () => void
  onApply: (code: string) => void
}

const TYPE_MAP: Record<string, { cls: string; lbl: string }> = {
  fix: { cls: styles.octFix, lbl: '수정' },
  improve: { cls: styles.octImprove, lbl: '개선' },
  style: { cls: styles.octStyle, lbl: '스타일' },
}

export function OptimizeModal({
  open,
  loading,
  error,
  result,
  onClose,
  onApply,
}: Props) {
  const [copied, setCopied] = useState(false)
  if (!open) return null

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.modal}>
        <div className={styles.hdr}>
          <div className={styles.hdrTitle}><IconLabel name="rocket" size={14}>AI 자동 최적화 결과</IconLabel></div>
          <button type="button" className={styles.x} onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className={styles.body}>
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spin} />
              <div style={{ fontSize: 12 }}>코드 최적화 중...</div>
            </div>
          )}

          {!loading && error && (
            <div className={styles.err}><IconLabel name="xCircle" size={13}>{error}</IconLabel></div>
          )}

          {!loading && !error && result && (
            <>
              <div className={styles.summary}>
                <div className={styles.scoreRow}>
                  <div className={styles.scoreBox}>
                    <div className={styles.scoreLbl}>최적화 전</div>
                    <div className={styles.scoreBefore}>
                      {result.score_before ?? '?'}
                    </div>
                  </div>
                  <div className={styles.arrow}><Icon name="arrowRight" size={16} /></div>
                  <div className={styles.scoreBox}>
                    <div className={styles.scoreLbl}>최적화 후</div>
                    <div className={styles.scoreAfter}>
                      {result.score_after ?? '?'}
                    </div>
                  </div>
                  <div className={styles.sumTxt}>{result.summary || ''}</div>
                </div>
              </div>

              <div className={styles.changes}>
                <div className={styles.secLbl}>변경 사항</div>
                {(result.changes || []).map((c, i) => {
                  const t = TYPE_MAP[c.type || 'improve'] || TYPE_MAP.improve
                  return (
                    <div key={i} className={styles.ochange}>
                      <span className={`${styles.oct} ${t.cls}`}>{t.lbl}</span>
                      <div className={styles.changeBody}>
                        <strong>{c.title || ''}</strong>
                        <br />
                        {c.detail || ''}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className={styles.codeSec}>
                <div className={styles.codeHdr}>
                  <span><IconLabel name="checkCircle" size={12}>최적화된 코드</IconLabel></span>
                  <button
                    type="button"
                    className={styles.copy}
                    onClick={async () => {
                      if (!result.optimized_code) return
                      const ok = await copyText(result.optimized_code)
                      if (ok) {
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }
                    }}
                  >
                    {copied ? <IconLabel name="check" size={11}>복사됨</IconLabel> : <IconLabel name="copy" size={11}>복사</IconLabel>}
                  </button>
                </div>
                <pre className={styles.code}>{result.optimized_code}</pre>
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            닫기
          </button>
          {result?.optimized_code && !loading && (
            <button
              type="button"
              className={styles.apply}
              onClick={() => {
                if (!confirm('에디터의 코드를 교체하시겠습니까?')) return
                onApply(result.optimized_code!)
                onClose()
              }}
            >
              <IconLabel name="arrowLeft" size={12}>에디터에 적용</IconLabel>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
