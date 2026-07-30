import { useEffect } from 'react'
import { Icon } from './icons'
import styles from './Toast.module.css'

export type ToastItem = {
  id: string
  type: 'info' | 'success' | 'error'
  message: string
}

type Props = {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export function ToastStack({ toasts, onDismiss }: Props) {
  return (
    <div className={styles.stack} aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function Toast({
  item,
  onDismiss,
}: {
  item: ToastItem
  onDismiss: (id: string) => void
}) {
  useEffect(() => {
    const id = setTimeout(() => onDismiss(item.id), 3200)
    return () => clearTimeout(id)
  }, [item.id, onDismiss])

  const icon =
    item.type === 'success'
      ? 'check'
      : item.type === 'error'
        ? 'alertCircle'
        : 'info'

  return (
    <div
      className={`${styles.toast} ${styles[item.type]}`}
      role="status"
      onClick={() => onDismiss(item.id)}
    >
      <span className={styles.ico}>
        <Icon name={icon} size={12} />
      </span>
      <span className={styles.msg}>{item.message}</span>
    </div>
  )
}
