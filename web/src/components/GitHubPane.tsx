import { useState } from 'react'
import { fetchGitHubFile, guessLangFromPath } from '../services/github'
import type { Lang } from '../types'
import { LANG_OPTIONS } from '../types'
import styles from './GitHubPane.module.css'

type Props = {
  onLoaded: (code: string, lang?: Lang) => void
}

export function GitHubPane({ onLoaded }: Props) {
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    setOkMsg(null)
    if (!url.trim()) {
      setError('GitHub 파일 URL을 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      const text = await fetchGitHubFile(url, token)
      const guess = guessLangFromPath(url)
      const lang = LANG_OPTIONS.find((o) => o.value === guess)?.value
      onLoaded(text, lang)
      setOkMsg(`불러오기 완료 (${text.split('\n').length} lines) → Editor 탭으로 전환됨`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오기 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.pane}>
      <div className={styles.inner}>
        <div className={styles.title}>GitHub 파일 URL</div>
        <p className={styles.desc}>
          공개 저장소 파일 페이지 URL을 넣으면 raw 주소로 변환해 에디터에 불러옵니다.
        </p>

        <div className={styles.row}>
          <input
            className={styles.input}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/user/repo/blob/main/file.py"
            onKeyDown={(e) => e.key === 'Enter' && void load()}
          />
          <button
            type="button"
            className={styles.secondary}
            disabled={loading}
            onClick={() => void load()}
          >
            불러오기
          </button>
        </div>

        <input
          className={styles.inputFull}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          type="password"
          placeholder="GitHub Token (비공개 저장소 시 선택)"
        />

        <button
          type="button"
          className={styles.primary}
          disabled={loading}
          onClick={() => void load()}
        >
          {loading ? (
            <>
              <span className="spin" /> 불러오는 중...
            </>
          ) : (
            '📥 GitHub 코드 불러오기'
          )}
        </button>

        {error && <div className={styles.err}>❌ {error}</div>}
        {okMsg && <div className={styles.ok}>✅ {okMsg}</div>}

        <div className={styles.hintBox}>
          <div className={styles.hintTitle}>예시</div>
          <code className={styles.code}>
            https://github.com/python/cpython/blob/main/Lib/bisect.py
          </code>
          <div className={styles.hintNote}>
            · 공개 파일은 토큰 없이 가능합니다
            <br />
            · 비공개 저장소는 Personal Access Token이 필요합니다
            <br />· CORS: 브라우저에서 raw.githubusercontent.com 직접 요청
          </div>
        </div>
      </div>
    </div>
  )
}
