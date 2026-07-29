import { useState } from 'react'
import { isValidGroqKey, setGroqKey } from '../services/keyStore'
import styles from './KeyBanner.module.css'

type Props = {
  visible: boolean
  onSaved: (key: string) => void
}

export function KeyBanner({ visible, onSaved }: Props) {
  const [value, setValue] = useState('')

  if (!visible) return null

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
      <span className={styles.hint}>⚡ Groq API Key:</span>
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
        무료 발급 →{' '}
        <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
          console.groq.com/keys
        </a>
      </span>
    </div>
  )
}
