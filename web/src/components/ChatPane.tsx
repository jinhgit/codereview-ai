import { useEffect, useRef, useState } from 'react'
import { buildUserPayload, sendChatCompletion } from '../services/chatAi'
import {
  appendMessage,
  createChat,
  createProject,
  deleteChat,
  deleteProject,
  ensureDefaultChat,
  getActiveChat,
  loadStore,
  nowT,
  renameChatIfFirst,
  saveStore,
  setActiveChat,
  setChatHistory,
  toggleProject,
  trimHistory,
} from '../services/chatStore'
import type { Lang } from '../types'
import type { ChatStore, LlmTurn } from '../types/chat'
import { extractCode, fmtBot } from '../utils/fmtBot'
import { esc } from '../utils/escape'
import { ProjectModal } from './ProjectModal'
import styles from './ChatPane.module.css'

const SUGGESTS = [
  { q: '버블정렬 구현해줘', label: '버블정렬' },
  { q: '현재 코드 설명해줘', label: '코드 설명' },
  { q: '이 코드를 더 빠르게 최적화해줘', label: '최적화' },
  { q: '이진탐색 구현해줘', label: '이진탐색' },
  { q: 'LinkedList 클래스 구현해줘', label: 'LinkedList' },
]

type Props = {
  code: string
  lang: Lang
  needKey: () => boolean
  onModelChange?: (label: string) => void
  onApplyCode: (code: string) => void
  onGoEditor: () => void
}

export function ChatPane({
  code,
  lang,
  needKey,
  onModelChange,
  onApplyCode,
  onGoEditor,
}: Props) {
  const [store, setStore] = useState<ChatStore>(() =>
    ensureDefaultChat(loadStore()),
  )
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [projModal, setProjModal] = useState(false)
  const msgsRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const persist = (next: ChatStore) => {
    saveStore(next)
    setStore(next)
  }

  useEffect(() => {
    const s = ensureDefaultChat(loadStore())
    saveStore(s)
    setStore(s)
  }, [])

  const active = getActiveChat(store)

  useEffect(() => {
    const el = msgsRef.current
    if (!el) return
    setTimeout(() => {
      el.scrollTop = el.scrollHeight
    }, 40)
  }, [active?.messages, typing, active?.id])

  const projectOf = (projectId: string | null) =>
    projectId ? store.projects.find((p) => p.id === projectId) : null

  const handleNewChat = (projectId: string | null = null) => {
    persist(createChat(store, projectId))
    taRef.current?.focus()
  }

  const handleDeleteChat = (id: string, title: string) => {
    if (!confirm(`"${title}" 채팅을 삭제할까요?`)) return
    persist(deleteChat(store, id))
  }

  const handleDeleteProj = (id: string, name: string) => {
    if (!confirm(`"${name}" 프로젝트와 모든 채팅을 삭제할까요?`)) return
    persist(deleteProject(store, id))
  }

  const applyToEditor = (c: string) => {
    if (!confirm('에디터의 코드를 교체할까요?')) return
    onApplyCode(c)
    onGoEditor()
  }

  const send = async (raw?: string) => {
    if (needKey()) return
    const msg = (raw ?? input).trim()
    if (!msg || sending) return

    setInput('')
    if (taRef.current) taRef.current.style.height = 'auto'
    setSending(true)

    let s = store
    if (!getActiveChat(s)) {
      s = createChat(s, null)
    }
    const chat = getActiveChat(s)!
    const chatId = chat.id

    const userUi = {
      role: 'user' as const,
      html: esc(msg),
      time: nowT(),
    }
    s = appendMessage(s, chatId, userUi)
    s = renameChatIfFirst(s, chatId, msg)

    const payload = buildUserPayload(msg, code, lang)
    let history: LlmTurn[] = [
      ...chat.history,
      { role: 'user', content: payload },
    ]
    history = trimHistory(history, 20)
    s = setChatHistory(s, chatId, history)
    persist(s)

    setTyping(true)
    try {
      const rawAns = await sendChatCompletion(history, onModelChange)
      history = trimHistory(
        [...history, { role: 'assistant', content: rawAns }],
        20,
      )
      const codeBlock = extractCode(rawAns)
      let next = setChatHistory(s, chatId, history)
      next = appendMessage(next, chatId, {
        role: 'bot',
        html: fmtBot(rawAns),
        time: nowT(),
        code: codeBlock || undefined,
      })
      persist(next)
    } catch (e) {
      const err = e instanceof Error ? e.message : '오류'
      // drop last user history turn on failure
      const failedHist = history.slice(0, -1)
      let next = setChatHistory(s, chatId, failedHist)
      next = appendMessage(next, chatId, {
        role: 'bot',
        html: `❌ 오류: ${esc(err)}`,
        time: nowT(),
      })
      persist(next)
    } finally {
      setTyping(false)
      setSending(false)
    }
  }

  const generalChats = store.chats.filter((c) => !c.projectId)

  return (
    <div className={styles.pane}>
      <div className={styles.sb}>
        <div className={styles.sbTop}>
          <button
            type="button"
            className={styles.newChat}
            onClick={() => handleNewChat(null)}
          >
            ✚ 새 채팅
          </button>
          <button
            type="button"
            className={styles.newProj}
            onClick={() => setProjModal(true)}
          >
            📁 + 프로젝트
          </button>
        </div>
        <div className={styles.sbBody}>
          {store.projects.length > 0 && (
            <>
              <div className={styles.sbLbl}>📁 프로젝트</div>
              {store.projects.map((proj) => {
                const chats = store.chats.filter((c) => c.projectId === proj.id)
                const open = !proj.collapsed
                return (
                  <div key={proj.id}>
                    <div
                      className={styles.projHdr}
                      onClick={() => persist(toggleProject(store, proj.id))}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && persist(toggleProject(store, proj.id))
                      }
                    >
                      <span className={styles.projLbl}>
                        <span
                          className={styles.dot}
                          style={{ background: proj.color }}
                        />
                        <span className={styles.projName}>{proj.name}</span>
                        <span className={styles.cnt}>({chats.length})</span>
                      </span>
                      <span className={`${styles.arr} ${open ? styles.op : ''}`}>
                        ›
                      </span>
                    </div>
                    {open && (
                      <div className={styles.projItems}>
                        <div className={styles.projActs}>
                          <button
                            type="button"
                            className={styles.projAct}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleNewChat(proj.id)
                            }}
                          >
                            + 채팅
                          </button>
                          <button
                            type="button"
                            className={`${styles.projAct} ${styles.danger}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteProj(proj.id, proj.name)
                            }}
                          >
                            삭제
                          </button>
                        </div>
                        {chats.map((c) => (
                          <ChatItem
                            key={c.id}
                            title={c.title}
                            active={c.id === store.activeChatId}
                            onSelect={() => persist(setActiveChat(store, c.id))}
                            onDelete={() => handleDeleteChat(c.id, c.title)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {generalChats.length > 0 && (
            <>
              <div className={styles.sbLbl} style={{ marginTop: 6 }}>
                💬 채팅
              </div>
              {generalChats.map((c) => (
                <ChatItem
                  key={c.id}
                  title={c.title}
                  active={c.id === store.activeChatId}
                  onSelect={() => persist(setActiveChat(store, c.id))}
                  onDelete={() => handleDeleteChat(c.id, c.title)}
                />
              ))}
            </>
          )}

          {store.chats.length === 0 && (
            <div className={styles.emptySb}>채팅이 없습니다</div>
          )}
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.mainHdr}>
          <span className={styles.mainTitle}>{active?.title || '새 채팅'}</span>
          {active?.projectId && projectOf(active.projectId) && (
            <span
              className={styles.projBadge}
              style={{ color: projectOf(active.projectId)!.color }}
            >
              {projectOf(active.projectId)!.name}
            </span>
          )}
        </div>

        <div className={styles.msgs} ref={msgsRef}>
          {(!active || active.messages.length === 0) && !typing && (
            <div className={`${styles.cmsg} ${styles.bot}`}>
              <div className={`${styles.cbub} ${styles.botBub}`}>
                👋 안녕하세요! 코드 AI 어시스턴트입니다.
                <br />
                <br />• <code>버블정렬 구현해줘</code>
                <br />• <code>현재 코드 설명해줘</code>
                <br />• <code>이 코드를 최적화해줘</code>
                <br />
                <br />
                <span className={styles.ctxHint}>
                  에디터에 코드가 있으면 질문과 함께 컨텍스트로 전달됩니다.
                </span>
              </div>
              <div className={styles.ctime}>{nowT()}</div>
            </div>
          )}

          {active?.messages.map((m, i) => (
            <div
              key={`${m.time}-${i}`}
              className={`${styles.cmsg} ${m.role === 'user' ? styles.user : styles.bot}`}
            >
              <div
                className={`${styles.cbub} ${m.role === 'user' ? styles.userBub : styles.botBub}`}
                dangerouslySetInnerHTML={{ __html: m.html }}
              />
              {m.code ? (
                <button
                  type="button"
                  className={styles.apply}
                  onClick={() => applyToEditor(m.code!)}
                >
                  ↩ 에디터에 적용
                </button>
              ) : null}
              <div className={styles.ctime}>{m.time}</div>
            </div>
          ))}

          {typing && (
            <div className={`${styles.cmsg} ${styles.bot}`}>
              <div className={styles.typing}>
                <span className={styles.cdot} />
                <span className={styles.cdot} />
                <span className={styles.cdot} />
              </div>
            </div>
          )}
        </div>

        <div className={styles.iw}>
          <div className={styles.suggs}>
            {SUGGESTS.map((s) => (
              <button
                key={s.q}
                type="button"
                className={styles.sugg}
                disabled={sending}
                onClick={() => void send(s.q)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className={styles.ir}>
            <textarea
              ref={taRef}
              className={styles.ta}
              rows={1}
              placeholder="코드 구현 요청이나 질문을 입력하세요..."
              value={input}
              disabled={sending}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send()
                }
              }}
            />
            <button
              type="button"
              className={styles.send}
              disabled={sending || !input.trim()}
              onClick={() => void send()}
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      <ProjectModal
        open={projModal}
        onClose={() => setProjModal(false)}
        onConfirm={(name) => persist(createProject(store, name))}
      />
    </div>
  )
}

function ChatItem({
  title,
  active,
  onSelect,
  onDelete,
}: {
  title: string
  active: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={`${styles.chatItem} ${active ? styles.chatActive : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      title={title}
    >
      <span className={styles.chatTitle}>{title}</span>
      <button
        type="button"
        className={styles.chatDel}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        ✕
      </button>
    </div>
  )
}
