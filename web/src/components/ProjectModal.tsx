import { useEffect, useRef, useState } from 'react'
import styles from './ProjectModal.module.css'

type Props = {
  open: boolean
  title?: string
  onClose: () => void
  onConfirm: (name: string) => void
}

export function ProjectModal({
  open,
  title = '📁 새 프로젝트',
  onClose,
  onConfirm,
}: Props) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null

  const submit = () => {
    const n = name.trim()
    if (!n) {
      inputRef.current?.focus()
      return
    }
    onConfirm(n)
    onClose()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.box}>
        <h3>{title}</h3>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder="프로젝트 이름..."
          maxLength={30}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') onClose()
          }}
        />
        <div className={styles.btns}>
          <button type="button" className={styles.cancel} onClick={onClose}>
            취소
          </button>
          <button type="button" className={styles.ok} onClick={submit}>
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
