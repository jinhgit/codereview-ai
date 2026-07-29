import { useState } from 'react'
import { isValidGroqKey, setGroqKey } from '../services/keyStore'
import styles from './KeyBanner.module.css'

type Props = {
  visible: boolean
  serverKeyMode?: boolean
  onSaved: (key: string) => void
  onDismiss?: () => void
}

export function KeyBanner({
  visible,
  serverKeyMode,
  onSaved,
  onDismiss,
}: Props) {
  const [value, setValue] = useState('')

  if (!visible || serverKeyMode) return null

  const save = () => {
    const k = value.trim()
    if (!isValidGroqKey(k)) {
      alert(
        '올바른 Groq API 키가 아닙니다.\ngsk_ 로 시작하는 키를 입력해주세요.\n발급: https://console.groq.com/keys',
      )
      return
    }
    setGroqKey(k)
    onSaved(k)
  }

  return (
    <div className={styles.banner}>
      <span className={styles.hint}>⚡ Groq API Key (클라이언트 폴백):</span>
      <input
        className={styles.input}
        type="password"
        placeholder="gsk_..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
      />
      <button type="button" className={styles.btn} onClick={save}>
        저장
      </button>
      <span className={styles.hint}>
        권장: 서버 <code>GROQ_API_KEY</code> · 무료 발급 →{' '}
        <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
          console.groq.com/keys
        </a>
      </span>
      {onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss}>
          ✕
        </button>
      )}
    </div>
  )
}
