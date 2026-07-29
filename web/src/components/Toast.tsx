import { useEffect } from 'react'
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

  return (
    <div
      className={`${styles.toast} ${styles[item.type]}`}
      role="status"
      onClick={() => onDismiss(item.id)}
    >
      <span className={styles.ico}>
        {item.type === 'success' ? '✓' : item.type === 'error' ? '!' : 'i'}
      </span>
      <span className={styles.msg}>{item.message}</span>
    </div>
  )
}
