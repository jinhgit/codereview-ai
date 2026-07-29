import { useCallback, useEffect, useState } from 'react'
import { ChatPane } from './components/ChatPane'
import { CollabPanel } from './components/collab/CollabPanel'
import { EditorPane } from './components/EditorPane'
import { ExecPanel } from './components/ExecPanel'
import { FixPanel } from './components/FixPanel'
import { GitHubPane } from './components/GitHubPane'
import { Header } from './components/Header'
import { KeyBanner } from './components/KeyBanner'
import { OptimizeModal } from './components/OptimizeModal'
import { ReviewPanel } from './components/ReviewPanel'
import { ToastStack } from './components/Toast'
import { SAMPLES } from './data/samples'
import { useToast } from './hooks/useToast'
import { analyzeCode, fixCode, optimizeCode } from './services/ai'
import {
  fetchBffConfig,
  needsClientKey,
  type BffConfig,
} from './services/apiClient'
import { getGroqKey } from './services/keyStore'
import { DEFAULT_MODEL_LABEL } from './services/models'
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
  const toast = useToast()
  const [code, setCode] = useState(SAMPLES.buggy)
  const [lang, setLang] = useState<Lang>('python')
  const [activeSample, setActiveSample] = useState('buggy')
  const [bffConfig, setBffConfig] = useState<BffConfig | null>(null)
  const [bffOnline, setBffOnline] = useState(false)
  const [showKeyBanner, setShowKeyBanner] = useState(false)
  const [modelLabel, setModelLabel] = useState(DEFAULT_MODEL_LABEL)
  const [status, setStatus] = useState<StatusKind>('ready')
  const [leftTab, setLeftTab] = useState<LeftTab>('editor')
  const [rightTab, setRightTab] = useState<RightTab>('review')
  const [collabOpen, setCollabOpen] = useState(false)

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
  const hasAuth =
    !!bffConfig?.hasServerKey || (!!getGroqKey() && !!bffConfig?.allowClientKey)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/v1/health')
        if (!cancelled) setBffOnline(res.ok)
      } catch {
        if (!cancelled) setBffOnline(false)
      }
      const cfg = await fetchBffConfig()
      if (cancelled) return
      setBffConfig(cfg)
      // 서버 키가 있으면 배너 숨김. 없으면 클라이언트 키 필요
      setShowKeyBanner(!cfg.hasServerKey && cfg.allowClientKey && !getGroqKey())
      if (cfg.hasServerKey) {
        toast.info('BFF 서버 키 모드 — API Key는 서버에서 관리됩니다')
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const needKey = useCallback(() => {
    if (!needsClientKey()) return false
    setShowKeyBanner(true)
    toast.error('Groq API 키를 입력해주세요')
    return true
  }, [toast])

  const onModelChange = useCallback((label: string) => {
    setModelLabel(label)
  }, [])

  const handleReview = async () => {
    if (needKey()) return
    const c = code.trim()
    if (!c) {
      toast.error('코드를 입력해주세요.')
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
      toast.success('코드 리뷰 완료')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '분석 실패'
      setReviewError(msg)
      toast.error(msg)
    } finally {
      setReviewLoading(false)
      setStatus('ready')
    }
  }

  const handleFix = async () => {
    if (needKey()) return
    const c = code.trim()
    if (!c) {
      toast.error('코드를 입력해주세요.')
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
      toast.success(
        r.has_errors ? '오류 수정 완료' : '오류가 없습니다',
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : '수정 실패'
      setFixError(msg)
      toast.error(msg)
    } finally {
      setFixLoading(false)
      setStatus('ready')
    }
  }

  const handleRun = async () => {
    const c = code.trim()
    if (!c) {
      toast.error('실행할 코드를 입력해주세요.')
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
      if (r.error) toast.error(r.error)
      else if (r.ok) toast.success('실행 완료')
      else toast.error('실행 중 오류가 발생했습니다')
    } finally {
      setExecRunning(false)
      setStatus('ready')
    }
  }

  const handleOptimize = async () => {
    if (needKey()) return
    const c = code.trim()
    if (!c) {
      toast.error('코드를 입력해주세요.')
      return
    }
    setOptOpen(true)
    setOptLoading(true)
    setOptError(null)
    setOptResult(null)
    try {
      const r = await optimizeCode(c, lang, onModelChange)
      setOptResult(r)
      toast.success('최적화 완료')
    } catch (e) {
      const msg = e instanceof Error ? e.message : '최적화 실패'
      setOptError(msg)
      toast.error(msg)
    } finally {
      setOptLoading(false)
    }
  }

  const applyCode = (next: string) => {
    setCode(next)
    setActiveSample('')
    setFixDot(false)
    toast.success('에디터에 코드를 적용했습니다')
  }

  const applyFromChat = (next: string) => {
    applyCode(next)
    setLeftTab('editor')
  }

  return (
    <div className={styles.appShell}>
      <Header
        modelLabel={modelLabel}
        status={status}
        bffOnline={bffOnline}
        serverKey={!!bffConfig?.hasServerKey}
        onCollab={() => setCollabOpen(true)}
      />
      <KeyBanner
        visible={showKeyBanner}
        serverKeyMode={!!bffConfig?.hasServerKey}
        onSaved={() => {
          setShowKeyBanner(false)
          toast.success('API 키가 저장되었습니다')
        }}
        onDismiss={() => setShowKeyBanner(false)}
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
              className={`${styles.ltab} ${leftTab === 'github' ? styles.lactive : ''}`}
              onClick={() => setLeftTab('github')}
            >
              ⬡ GitHub
            </button>
            <button
              type="button"
              className={`${styles.ltab} ${leftTab === 'chat' ? styles.lactive : ''}`}
              onClick={() => setLeftTab('chat')}
            >
              💬 Chat
            </button>
          </div>

          {leftTab === 'editor' && (
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
          )}
          {leftTab === 'github' && (
            <GitHubPane
              onLoaded={(text, guessed) => {
                setCode(text)
                setActiveSample('')
                if (guessed) setLang(guessed)
                else {
                  const d = detectLang(text)
                  if (d) setLang(d)
                }
                setLeftTab('editor')
                toast.success('GitHub 코드를 불러왔습니다')
              }}
            />
          )}
          {leftTab === 'chat' && (
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
                  hasAuth
                    ? '코드를 입력하고 ⚡ 코드 리뷰를 누르세요'
                    : 'BFF 서버 키 또는 Groq API 키 설정 후 시작'
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

      <CollabPanel
        open={collabOpen}
        onClose={() => setCollabOpen(false)}
        needKey={needKey}
        onModelChange={onModelChange}
      />

      <ToastStack toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  )
}
