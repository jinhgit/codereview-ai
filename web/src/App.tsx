import { useCallback, useEffect, useState } from 'react'
import { ChatPane } from './components/ChatPane'
import { EditorPane } from './components/EditorPane'
import { ExecPanel } from './components/ExecPanel'
import { FixPanel } from './components/FixPanel'
import { Header } from './components/Header'
import { KeyBanner } from './components/KeyBanner'
import { OptimizeModal } from './components/OptimizeModal'
import { ReviewPanel } from './components/ReviewPanel'
import { SAMPLES } from './data/samples'
import { analyzeCode, fixCode, optimizeCode } from './services/ai'
import { getCurrentModelLabel } from './services/groq'
import { getGroqKey } from './services/keyStore'
import { runOnPiston } from './services/piston'
import type {
  ExecResult,
  FixResult,
  Lang,
  OptimizeResult,
  ReviewResult,
  RightTab,
  StatusKind,
} from './types'
import type { LeftTab } from './types/chat'
import { detectLang } from './utils/detectLang'
import styles from './App.module.css'

export default function App() {
  const [code, setCode] = useState(SAMPLES.buggy)
  const [lang, setLang] = useState<Lang>('python')
  const [activeSample, setActiveSample] = useState('buggy')
  const [hasKey, setHasKey] = useState(() => !!getGroqKey())
  const [showKeyBanner, setShowKeyBanner] = useState(() => !getGroqKey())
  const [modelLabel, setModelLabel] = useState(getCurrentModelLabel)
  const [status, setStatus] = useState<StatusKind>('ready')
  const [leftTab, setLeftTab] = useState<LeftTab>('editor')
  const [rightTab, setRightTab] = useState<RightTab>('review')

  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [review, setReview] = useState<ReviewResult | null>(null)

  const [fixLoading, setFixLoading] = useState(false)
  const [fixError, setFixError] = useState<string | null>(null)
  const [fixResult, setFixResult] = useState<FixResult | null>(null)
  const [fixedCode, setFixedCode] = useState('')
  const [fixDot, setFixDot] = useState(false)

  const [execOpen, setExecOpen] = useState(false)
  const [execRunning, setExecRunning] = useState(false)
  const [stdin, setStdin] = useState('')
  const [execResult, setExecResult] = useState<ExecResult | null>(null)

  const [optOpen, setOptOpen] = useState(false)
  const [optLoading, setOptLoading] = useState(false)
  const [optError, setOptError] = useState<string | null>(null)
  const [optResult, setOptResult] = useState<OptimizeResult | null>(null)

  const busy = reviewLoading || fixLoading || execRunning || optLoading

  useEffect(() => {
    const id = setInterval(() => {
      const k = getGroqKey()
      if (k && !hasKey) {
        setHasKey(true)
        setShowKeyBanner(false)
      }
    }, 500)
    return () => clearInterval(id)
  }, [hasKey])

  const needKey = useCallback(() => {
    if (!getGroqKey()) {
      setShowKeyBanner(true)
      return true
    }
    return false
  }, [])

  const onModelChange = useCallback((label: string) => {
    setModelLabel(label)
  }, [])

  const handleReview = async () => {
    if (needKey()) return
    const c = code.trim()
    if (!c) {
      alert('코드를 입력해주세요.')
      return
    }
    setRightTab('review')
    setReviewLoading(true)
    setReviewError(null)
    setReview(null)
    setStatus('analyzing')
    try {
      const r = await analyzeCode(c, lang, onModelChange)
      setReview(r)
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : '분석 실패')
    } finally {
      setReviewLoading(false)
      setStatus('ready')
    }
  }

  const handleFix = async () => {
    if (needKey()) return
    const c = code.trim()
    if (!c) {
      alert('코드를 입력해주세요.')
      return
    }
    setRightTab('fix')
    setFixLoading(true)
    setFixError(null)
    setFixResult(null)
    setFixedCode('')
    setStatus('fixing')
    try {
      const r = await fixCode(c, lang, onModelChange)
      setFixResult(r)
      setFixedCode(r.fixed_full_code || '')
      setFixDot(!!(r.has_errors && (r.error_count || 0) > 0))
    } catch (e) {
      setFixError(e instanceof Error ? e.message : '수정 실패')
    } finally {
      setFixLoading(false)
      setStatus('ready')
    }
  }

  const handleRun = async () => {
    const c = code.trim()
    if (!c) {
      alert('실행할 코드를 입력해주세요.')
      return
    }
    const detected = detectLang(c)
    const useLang = detected || lang
    if (detected && detected !== lang) setLang(detected)

    setExecOpen(true)
    setExecRunning(true)
    setExecResult(null)
    setStatus('running')
    try {
      const r = await runOnPiston(c, useLang, stdin)
      setExecResult(r)
    } finally {
      setExecRunning(false)
      setStatus('ready')
    }
  }

  const handleOptimize = async () => {
    if (needKey()) return
    const c = code.trim()
    if (!c) {
      alert('코드를 입력해주세요.')
      return
    }
    setOptOpen(true)
    setOptLoading(true)
    setOptError(null)
    setOptResult(null)
    try {
      const r = await optimizeCode(c, lang, onModelChange)
      setOptResult(r)
    } catch (e) {
      setOptError(e instanceof Error ? e.message : '최적화 실패')
    } finally {
      setOptLoading(false)
    }
  }

  const applyCode = (next: string) => {
    setCode(next)
    setActiveSample('')
    setFixDot(false)
  }

  const applyFromChat = (next: string) => {
    applyCode(next)
    // 적용 직후 에디터 하이라이트 느낌
    setLeftTab('editor')
  }

  return (
    <div className={styles.appShell}>
      <Header modelLabel={modelLabel} status={status} />
      <KeyBanner
        visible={showKeyBanner}
        onSaved={() => {
          setHasKey(true)
          setShowKeyBanner(false)
        }}
      />

      <div className={styles.app}>
        <div className={styles.left}>
          <div className={styles.ltabs}>
            <button
              type="button"
              className={`${styles.ltab} ${leftTab === 'editor' ? styles.lactive : ''}`}
              onClick={() => setLeftTab('editor')}
            >
              📄 Editor
            </button>
            <button
              type="button"
              className={`${styles.ltab} ${leftTab === 'chat' ? styles.lactive : ''}`}
              onClick={() => setLeftTab('chat')}
            >
              💬 Chat
            </button>
          </div>

          {leftTab === 'editor' ? (
            <EditorPane
              code={code}
              lang={lang}
              activeSample={activeSample}
              busy={busy}
              onCodeChange={(v) => {
                setCode(v)
                setActiveSample('')
              }}
              onLangChange={setLang}
              onSample={setActiveSample}
              onReview={handleReview}
              onFix={handleFix}
              onRun={handleRun}
            />
          ) : (
            <ChatPane
              code={code}
              lang={lang}
              needKey={needKey}
              onModelChange={onModelChange}
              onApplyCode={applyFromChat}
              onGoEditor={() => setLeftTab('editor')}
            />
          )}

          <ExecPanel
            open={execOpen}
            running={execRunning}
            stdin={stdin}
            result={execResult}
            onStdin={setStdin}
            onClose={() => setExecOpen(false)}
            onClear={() => setExecResult(null)}
          />
        </div>

        <div className={styles.right}>
          <div className={styles.rtabs}>
            <button
              type="button"
              className={`${styles.rtab} ${rightTab === 'review' ? styles.active : ''}`}
              onClick={() => setRightTab('review')}
            >
              📋 코드 리뷰
            </button>
            <button
              type="button"
              className={`${styles.rtab} ${rightTab === 'fix' ? styles.active : ''}`}
              onClick={() => setRightTab('fix')}
            >
              🔧 오류 수정
              <span className={`${styles.rdot} ${fixDot ? styles.show : ''}`} />
            </button>
          </div>

          <div className={styles.rbody}>
            {rightTab === 'review' ? (
              <ReviewPanel
                loading={reviewLoading}
                error={reviewError}
                result={review}
                emptyHint={
                  hasKey
                    ? '코드를 입력하고 ⚡ 코드 리뷰를 누르세요'
                    : 'Groq API 키 입력 후 시작'
                }
                onOptimize={handleOptimize}
                optimizeBusy={optLoading}
              />
            ) : (
              <FixPanel
                loading={fixLoading}
                error={fixError}
                result={fixResult}
                fixedCode={fixedCode}
                onApply={applyCode}
              />
            )}
          </div>
        </div>
      </div>

      <OptimizeModal
        open={optOpen}
        loading={optLoading}
        error={optError}
        result={optResult}
        onClose={() => setOptOpen(false)}
        onApply={applyCode}
      />
    </div>
  )
}
