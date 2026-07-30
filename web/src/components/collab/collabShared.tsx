import type { ReactNode } from 'react'
import { IconLabel } from '../icons'
import styles from './CollabPanel.module.css'

const COLS = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff', '#39d2c0']

export function Avatar({ name, size = 22 }: { name: string; size?: number }) {
  const c = COLS[(name || '?').charCodeAt(0) % COLS.length]
  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: Math.floor(size * 0.44),
        background: c,
      }}
    >
      {(name || '?').slice(0, 1).toUpperCase()}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  if (status === 'open')
    return (
      <span className={`${styles.badge} ${styles.badgeOpen}`}>
        <IconLabel name="circleDot" size={9}>Open</IconLabel>
      </span>
    )
  if (status === 'merged')
    return (
      <span className={`${styles.badge} ${styles.badgeMerged}`}>
        <IconLabel name="check" size={9}>Merged</IconLabel>
      </span>
    )
  return (
    <span className={`${styles.badge} ${styles.badgeClosed}`}>
      <IconLabel name="x" size={9}>Closed</IconLabel>
    </span>
  )
}

export function Card({
  title,
  children,
  action,
}: {
  title: ReactNode
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHdr}>
        <span className={styles.cardTitle}>{title}</span>
        {action}
      </div>
      <div className={styles.cardBody}>{children}</div>
    </div>
  )
}
