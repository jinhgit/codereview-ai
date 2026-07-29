import type { StatusKind } from '../types'
import styles from './Header.module.css'

type Props = {
  modelLabel: string
  status: StatusKind
}

const STATUS: Record<StatusKind, { text: string; cls: string }> = {
  ready: { text: '● Ready', cls: styles.ready },
  analyzing: { text: '● Analyzing', cls: styles.busy },
  fixing: { text: '● Fixing', cls: styles.busy },
  running: { text: '● Running', cls: styles.busy },
  error: { text: '● Error', cls: styles.err },
}

export function Header({ modelLabel, status }: Props) {
  const s = STATUS[status]
  return (
    <header className={styles.hdr}>
      <div className={styles.logo}>
        <div className={styles.logoIco}>⚡</div>
        <span>CodeReview AI</span>
        <span className={styles.sub}>+ 오류수정 + 실행</span>
      </div>
      <div className={styles.right}>
        <span className={`${styles.bx} ${styles.model}`}>{modelLabel}</span>
        <span className={`${styles.bx} ${s.cls}`}>{s.text}</span>
      </div>
    </header>
  )
}
