import { useState } from 'react'
import { copyText } from '../hooks/useClipboard'
import type { FixResult } from '../types'
import { Icon, IconLabel } from './icons'
import styles from './FixPanel.module.css'

type Props = {
  loading: boolean
  error: string | null
  result: FixResult | null
  fixedCode: string
  onApply: (code: string) => void
}

const TYPE_META: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  SyntaxError: {
    label: '문법 오류',
    color: '#f85149',
    bg: 'rgba(248,81,73,.12)',
    border: 'rgba(248,81,73,.35)',
  },
  LogicError: {
    label: '로직 오류',
    color: '#d29922',
    bg: 'rgba(210,153,34,.12)',
    border: 'rgba(210,153,34,.35)',
  },
  RuntimeError: {
    label: '런타임 오류',
    color: '#f85149',
    bg: 'rgba(248,81,73,.1)',
    border: 'rgba(248,81,73,.3)',
  },
  SecurityError: {
    label: '보안 오류',
    color: '#bc8cff',
    bg: 'rgba(188,140,255,.12)',
    border: 'rgba(188,140,255,.35)',
  },
  TypeError: {
    label: '타입 오류',
    color: '#d29922',
    bg: 'rgba(210,153,34,.1)',
    border: 'rgba(210,153,34,.3)',
  },
}

function meta(t?: string) {
  return (
    TYPE_META[t || ''] || {
      label: t || '오류',
      color: '#f85149',
      bg: 'rgba(248,81,73,.1)',
      border: 'rgba(248,81,73,.3)',
    }
  )
}

export function FixPanel({ loading, error, result, fixedCode, onApply }: Props) {
  const [copied, setCopied] = useState(false)

  const doCopy = async () => {
    if (!fixedCode) return
    const ok = await copyText(fixedCode)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="big-sp blue" />
        <div className={styles.loadTxt}>수정 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errBox}>
<strong><IconLabel name="xCircle" size={13}>오류 수정 실패</IconLabel></strong>
        <br />
        {error}
      </div>
    )
  }

  if (!result) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyI}><Icon name="wrench" size={36} /></div>
        <div className={styles.emptyT}>오류 수정 대기 중</div>
        <div className={styles.emptyD}><IconLabel name="wrench" size={11}>코드 입력 후 오류 수정을 누르세요</IconLabel></div>
      </div>
    )
  }

  if (!result.has_errors || result.error_count === 0) {
    return (
      <div className={styles.okWrap}>
        <div style={{ marginBottom: 12 }}><Icon name="checkCircle" size={48} style={{ color: 'var(--gn)' }} /></div>
        <div className={styles.okTitle}>오류가 없습니다!</div>
        <div className={styles.okDesc}>{result.summary || '코드가 정상입니다.'}</div>
      </div>
    )
  }

  const errors = result.errors || []

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <div className={styles.fixIco}><Icon name="wrench" size={18} /></div>
            <div>
              <div className={styles.headerTitle}>
                {errors.length}개 오류 발견 · 수정 완료
              </div>
              <div className={styles.headerSum}>{result.summary || ''}</div>
            </div>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.copyBtn} onClick={doCopy}>
              {copied ? <IconLabel name="check" size={11}>복사됨</IconLabel> : <IconLabel name="copy" size={11}>복사</IconLabel>}
            </button>
            <button
              type="button"
              className={styles.applyBtn}
              onClick={() => {
                if (!fixedCode) return
                if (!confirm('에디터의 코드를 교체하시겠습니까?')) return
                onApply(fixedCode)
              }}
            >
              <IconLabel name="arrowLeft" size={11}>적용</IconLabel>
            </button>
          </div>
        </div>
        <div className={styles.tags}>
          {errors.map((e, i) => {
            const m = meta(e.type)
            return (
              <span
                key={i}
                className={styles.tag}
                style={{ background: m.bg, color: m.color, borderColor: m.border }}
              >
                {m.label}
                {e.line ? ` · L${e.line}` : ''}
              </span>
            )
          })}
        </div>
      </div>

      <div className={styles.body}>
        {errors.map((e, idx) => {
          const m = meta(e.type)
          return (
            <div key={idx} className={styles.card}>
              <div
                className={styles.cardHead}
                style={{ background: m.bg, borderBottomColor: m.border }}
              >
                <div
                  className={styles.num}
                  style={{ borderColor: m.color, color: m.color, background: `${m.color}22` }}
                >
                  {idx + 1}
                </div>
                <div>
                  <div className={styles.cardMeta}>
                    <span style={{ color: m.color, fontWeight: 700 }}>{m.label}</span>
                    {e.line != null && (
                      <span className={styles.lineBadge}>Line {e.line}</span>
                    )}
                  </div>
                  <div className={styles.problem}>{e.problem || ''}</div>
                </div>
              </div>
              <div className={styles.cardBody}>
                {e.fix && <div className={styles.fixTxt}>{e.fix}</div>}
                {e.original && (
                  <div>
                    <div className={styles.beforeLbl}><IconLabel name="circleDot" size={10}>오류 코드</IconLabel></div>
                    <pre className={styles.before}>{e.original}</pre>
                  </div>
                )}
                {e.fixed_code && (
                  <div>
                    <div className={styles.afterLbl}><IconLabel name="circleDot" size={10}>수정된 코드</IconLabel></div>
                    <pre className={styles.after}>{e.fixed_code}</pre>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        <div className={styles.fullCard}>
          <div className={styles.fullHead}>
            <span><IconLabel name="checkCircle" size={12}>수정된 전체 코드</IconLabel></span>
            <button type="button" className={styles.copyBtn} onClick={doCopy}>
              {copied ? <IconLabel name="check" size={11}>복사됨</IconLabel> : <IconLabel name="copy" size={11}>복사</IconLabel>}
            </button>
          </div>
          <div className={styles.fullCode}>
            <table>
              <tbody>
                {fixedCode.split('\n').map((line, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? styles.even : undefined}>
                    <td className={styles.ln}>{idx + 1}</td>
                    <td className={styles.lc}>{line}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
