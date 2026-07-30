import { useState } from 'react'
import type { ReviewItem, ReviewResult } from '../types'
import { Icon, IconLabel, type IconName } from './icons'
import styles from './ReviewPanel.module.css'

type Props = {
  loading: boolean
  error: string | null
  result: ReviewResult | null
  emptyHint?: string
  onOptimize: () => void
  optimizeBusy: boolean
}

const GRADE_MAP: Record<
  string,
  { label: string; color: string; cls: string; desc: string; icon: IconName }
> = {
  A: { label: '훌륭한 코드', color: '#3fb950', cls: 'A', desc: '전반적으로 매우 우수합니다.', icon: 'trophy' },
  B: { label: '양호한 코드', color: '#58a6ff', cls: 'B', desc: '잘 작성된 코드입니다.', icon: 'checkCircle' },
  C: { label: '보통 수준', color: '#d29922', cls: 'C', desc: '여러 항목에서 개선이 필요합니다.', icon: 'alert' },
  D: { label: '개선 필요', color: '#f85149', cls: 'D', desc: '다수의 문제가 발견됐습니다.', icon: 'alertCircle' },
  F: { label: '심각한 문제', color: '#f85149', cls: 'F', desc: '즉각적인 수정이 필요합니다.', icon: 'xCircle' },
}

const CARD_DEFS: { key: 'style'|'performance'|'safety'|'readability'; lbl: string; ico: IconName; color: string; bg: string }[] = [
  { key: 'style', lbl: '코드 스타일', ico: 'palette', color: '#58a6ff', bg: 'rgba(88,166,255,.15)' },
  { key: 'performance', lbl: '성능', ico: 'zap', color: '#bc8cff', bg: 'rgba(188,140,255,.15)' },
  { key: 'safety', lbl: '안전성', ico: 'shield', color: '#3fb950', bg: 'rgba(63,185,80,.15)' },
  { key: 'readability', lbl: '가독성', ico: 'book', color: '#d29922', bg: 'rgba(210,153,34,.15)' },
]

function sevClass(s?: string) {
  if (s === 'error') return styles.fvE
  if (s === 'warning') return styles.fvW
  if (s === 'success') return styles.fvS
  return styles.fvI
}

function Items({ items }: { items: ReviewItem[] }) {
  if (!items.length) {
    return (
      <div className={styles.emptyItems}>
        <IconLabel name="check" size={12}>발견된 항목 없음</IconLabel>
      </div>
    )
  }
  return (
    <>
      {items.map((it, i) => (
        <div key={i} className={styles.fi}>
          <div className={`${styles.fv} ${sevClass(it.severity)}`} />
          <div className={styles.fb}>
            <div className={styles.ft}>{it.title || ''}</div>
            <div className={styles.fd}>{it.description || ''}</div>
            {it.suggestion ? <pre className={styles.fc}>{it.suggestion}</pre> : null}
          </div>
        </div>
      ))}
    </>
  )
}

export function ReviewPanel({
  loading,
  error,
  result,
  emptyHint,
  onOptimize,
  optimizeBusy,
}: Props) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    cx: true,
    sty: true,
    bug: true,
  })
  const [openCard, setOpenCard] = useState<string | null>(null)

  const toggle = (id: string) =>
    setOpenSections((p) => ({ ...p, [id]: !p[id] }))

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="big-sp" />
        <div className={styles.loadTxt}>분석 중...</div>
        <div className={styles.lsteps}>
          {['코드 파싱', '스타일 검사', '버그 탐지', '복잡도 분석', '개선 제안'].map((s, i) => (
            <div key={s} className={styles.lstep}>
              <div className={`${styles.sd} ${i === 0 ? styles.active : ''}`} />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errBox}>
        <strong><IconLabel name="xCircle" size={13}>{error}</IconLabel></strong>
        <br />• API 키 확인
        <br />• 잠시 후 재시도
      </div>
    )
  }

  if (!result) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyI}><Icon name="zap" size={36} /></div>
        <div className={styles.emptyT}>{emptyHint || '코드를 입력하고 리뷰를 시작하세요'}</div>
        <div className={styles.emptyD}>
          <div className={styles.stepBox}>
            <div className={styles.step}>
              <div className={styles.stepN}>1</div>
              <span>
                <a href="https://console.groq.com" target="_blank" rel="noreferrer">
                  console.groq.com
                </a>{' '}
                가입 (무료)
              </span>
            </div>
            <div className={styles.step}>
              <div className={styles.stepN}>2</div>
              <span>API Keys → Create API Key</span>
            </div>
            <div className={styles.step}>
              <div className={styles.stepN}>3</div>
              <span>
                <strong style={{ color: 'var(--gr)' }}>gsk_...</strong> 키를 상단에 입력
              </span>
            </div>
            <div className={styles.step}>
              <div className={styles.stepN}>4</div>
              <span><IconLabel name="zap" size={11}>코드 리뷰</IconLabel> 또는 <IconLabel name="wrench" size={11}>오류 수정</IconLabel></span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const sc = result.scores || {}
  const sd = result.score_details || {}
  const tot = Math.min(100, Math.max(0, Math.round(Number(sc.total) || 0)))
  const grade =
    sc.grade || (tot >= 80 ? 'A' : tot >= 70 ? 'B' : tot >= 60 ? 'C' : tot >= 50 ? 'D' : 'F')
  const gi = GRADE_MAP[grade] || GRADE_MAP.C
  const cx = result.complexity || {}
  const bgc =
    cx.rating === 'good' ? styles.bgGood : cx.rating === 'bad' ? styles.bgBad : styles.bgOk

  const secs: { id: string; title: string; ico: IconName; ic: string; items: ReviewItem[] }[] = [
    { id: 'sty', title: '코드 스타일', ico: 'palette', ic: styles.riS, items: result.style || [] },
    { id: 'bug', title: '버그 가능성', ico: 'bug', ic: styles.riB, items: result.bugs || [] },
    { id: 'ref', title: '리팩토링 제안', ico: 'refresh', ic: styles.riR, items: result.refactoring || [] },
    { id: 'alg', title: '알고리즘 개선', ico: 'zap', ic: styles.riA, items: result.algorithms || [] },
    {
      id: 'dts',
      title: '자료구조 분석',
      ico: 'layers',
      ic: styles.riD,
      items: result.datastructures || [],
    },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.evalBanner}>
        <div className={styles.evalRow}>
          <div className={`${styles.evalBadge} ${styles[`eg${gi.cls}`]}`}>{grade}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: gi.color }}>{gi.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: tot >= 80 ? '#3fb950' : tot >= 60 ? '#d29922' : '#f85149',
                }}
              >
                {tot}
              </span>
              <span style={{ fontSize: 10, color: 'var(--tx2)' }}>/ 100</span>
              <Icon name={gi.icon} size={16} style={{ color: gi.color }} />
            </div>
          </div>
        </div>
        <div className={styles.evalDesc} style={{ borderLeftColor: gi.color }}>
          {(sc.summary ? `${sc.summary} — ` : '') + gi.desc}
        </div>
        <div className={styles.hint}><IconLabel name="chevronDown" size={11}>항목 클릭 시 이유 및 최적화 방법</IconLabel></div>
      </div>

      {tot < 60 && (
        <div className={styles.optWrap}>
          <div className={styles.optWarn}><IconLabel name="alert" size={12}>60점 미만 — AI가 자동으로 코드를 최적화해드립니다</IconLabel></div>
          <button
            type="button"
            className={styles.optBtn}
            disabled={optimizeBusy}
            onClick={onOptimize}
          >
            {optimizeBusy ? <span className="spin" /> : null}
            <IconLabel name="rocket" size={13}>AI 자동 최적화 실행</IconLabel>
          </button>
        </div>
      )}

      <div className={styles.scGrid}>
        {CARD_DEFS.map((def) => {
          const val = Math.min(100, Math.max(0, Math.round(Number(sc[def.key]) || 0)))
          const det = sd[def.key] || {}
          const sc2 = val >= 80 ? '#3fb950' : val >= 60 ? '#d29922' : '#f85149'
          const open = openCard === def.key
          return (
            <div
              key={def.key}
              className={`${styles.scCard} ${open ? styles.scActive : ''}`}
              style={{ ['--cc' as string]: def.color }}
              onClick={() => setOpenCard(open ? null : def.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setOpenCard(open ? null : def.key)}
            >
              <div className={styles.scTop}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div className={styles.scIco} style={{ background: def.bg, color: def.color }}>
                    <Icon name={def.ico} size={13} />
                  </div>
                  <div className={styles.scLbl}>{def.lbl}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={styles.scVal} style={{ color: sc2 }}>
                    {val}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--tx2)' }}>/100</div>
                </div>
              </div>
              <div className={styles.scBar}>
                <div
                  className={styles.scFill}
                  style={{ width: `${val}%`, background: def.color }}
                />
              </div>
              {open && (
                <div className={styles.scInner}>
                  {det.reason && <div className={styles.scReason}>{det.reason}</div>}
                  {(det.problems || []).map((p, i) => (
                    <div key={i} className={styles.prob}>
                      <span style={{ color: def.color }}>•</span>
                      <span>{p}</span>
                    </div>
                  ))}
                  {(det.tips || []).length > 0 && (
                    <>
                      <div className={styles.tipLbl}>최적화 방법</div>
                      {(det.tips || []).map((t, i) => (
                        <div key={i} className={styles.scTip} style={{ borderLeftColor: def.color }}>
                          <Icon name="lightbulb" size={12} />
                          <div>
                            <strong>{t.title}</strong>
                            <br />
                            {t.desc}
                            {t.code ? <pre className={styles.tipCode}>{t.code}</pre> : null}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className={styles.rv}>
        <div className={styles.rsec}>
          <div className={styles.rsh} onClick={() => toggle('cx')}>
            <div className={styles.rst}>
              <div className={`${styles.ri} ${styles.riC}`}><Icon name="chart" size={12} /></div>
              <span className={styles.rtt}>시간/공간 복잡도</span>
              <span className={styles.bx}>{cx.time || '-'}</span>
            </div>
            <span className={`${styles.chv} ${openSections.cx ? styles.op : ''}`}><Icon name="chevronRight" size={12} /></span>
          </div>
          {openSections.cx && (
            <div className={styles.sbd}>
              <div className={styles.cxv}>
                <div className={styles.bigoRow}>
                  <span className={`${styles.bigo} ${bgc}`}>⏱ {cx.time || '-'}</span>
                  <span className={`${styles.bigo} ${styles.bgOk}`}>💾 {cx.space || '-'}</span>
                </div>
                <div className={styles.cxExp}>{cx.explanation || ''}</div>
              </div>
              <Items items={cx.items || []} />
            </div>
          )}
        </div>

        {secs.map((s) => (
          <div key={s.id} className={styles.rsec}>
            <div className={styles.rsh} onClick={() => toggle(s.id)}>
              <div className={styles.rst}>
                <div className={`${styles.ri} ${s.ic}`}><Icon name={s.ico} size={12} /></div>
                <span className={styles.rtt}>{s.title}</span>
                <span className={styles.cnt}>{s.items.length}</span>
              </div>
              <span className={`${styles.chv} ${openSections[s.id] ? styles.op : ''}`}><Icon name="chevronRight" size={12} /></span>
            </div>
            {openSections[s.id] && (
              <div className={styles.sbd}>
                <Items items={s.items} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
