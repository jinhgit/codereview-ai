import type { StatusKind } from '../types'
import { Icon, IconLabel } from './icons'
import styles from './Header.module.css'

type Props = {
  modelLabel: string
  status: StatusKind
  bffOnline?: boolean
  serverKey?: boolean
  onCollab?: () => void
}

const STATUS: Record<StatusKind, { text: string; cls: string }> = {
  ready: { text: 'Ready', cls: styles.ready },
  analyzing: { text: 'Analyzing', cls: styles.busy },
  fixing: { text: 'Fixing', cls: styles.busy },
  running: { text: 'Running', cls: styles.busy },
  error: { text: 'Error', cls: styles.err },
}

export function Header({
  modelLabel,
  status,
  bffOnline,
  serverKey,
  onCollab,
}: Props) {
  const s = STATUS[status]
  return (
    <header className={styles.hdr}>
      <div className={styles.logo}>
        <div className={styles.logoIco}>
          <Icon name="zap" size={14} />
        </div>
        <span>CodeReview AI</span>
        <span className={styles.sub}>BFF · 리뷰 · 챗 · 협업</span>
      </div>
      <div className={styles.right}>
        <span
          className={`${styles.bx} ${bffOnline ? styles.bffOn : styles.bffOff}`}
          title={bffOnline ? 'BFF 연결됨' : 'BFF 오프라인 — proxy 대상 확인'}
        >
          <IconLabel name={bffOnline ? 'circleDot' : 'circle'} size={10}>
            BFF
          </IconLabel>
        </span>
        {serverKey && (
          <span
            className={`${styles.bx} ${styles.serverKey}`}
            title="서버 GROQ_API_KEY 사용"
          >
            <IconLabel name="lock" size={11}>
              Server Key
            </IconLabel>
          </span>
        )}
        <span className={`${styles.bx} ${styles.model}`}>{modelLabel}</span>
        <span className={`${styles.bx} ${s.cls}`}>
          <IconLabel name="circleDot" size={10}>
            {s.text}
          </IconLabel>
        </span>
        {onCollab && (
          <button type="button" className={styles.collab} onClick={onCollab}>
            <IconLabel name="users" size={13}>
              협업
            </IconLabel>
          </button>
        )}
      </div>
    </header>
  )
}
