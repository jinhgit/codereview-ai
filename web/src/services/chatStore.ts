import type { ChatProject, ChatSession, ChatStore, LlmTurn, UiChatMessage } from '../types/chat'

const SKEY = 'cr_chats_v3'
const PCOLS = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff', '#39d2c0']

function ls(k: string): ChatStore | null {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null') as ChatStore | null
  } catch {
    return null
  }
}

function ss(k: string, v: ChatStore) {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* quota */
  }
}

export function gid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

export function nowT(): string {
  return new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export function loadStore(): ChatStore {
  const s = ls(SKEY)
  if (s && Array.isArray(s.chats)) return s
  return { projects: [], chats: [], activeChatId: null }
}

export function saveStore(store: ChatStore): void {
  ss(SKEY, store)
}

export function ensureDefaultChat(store: ChatStore): ChatStore {
  if (store.chats.length === 0) {
    const c = makeChat(null, '새 채팅')
    return {
      ...store,
      chats: [c],
      activeChatId: c.id,
    }
  }
  if (!store.activeChatId || !store.chats.some((x) => x.id === store.activeChatId)) {
    return { ...store, activeChatId: store.chats[0].id }
  }
  return store
}

function makeChat(projectId: string | null, title = '새 채팅'): ChatSession {
  return {
    id: gid(),
    title,
    projectId,
    history: [],
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function createChat(store: ChatStore, projectId: string | null = null, title = '새 채팅'): ChatStore {
  const c = makeChat(projectId, title)
  const projects = store.projects.map((p) =>
    p.id === projectId ? { ...p, chatIds: [c.id, ...p.chatIds] } : p,
  )
  return {
    ...store,
    projects,
    chats: [c, ...store.chats],
    activeChatId: c.id,
  }
}

export function deleteChat(store: ChatStore, id: string): ChatStore {
  const chats = store.chats.filter((c) => c.id !== id)
  const projects = store.projects.map((p) => ({
    ...p,
    chatIds: p.chatIds.filter((x) => x !== id),
  }))
  let activeChatId = store.activeChatId
  if (activeChatId === id) {
    activeChatId = chats[0]?.id ?? null
  }
  let next: ChatStore = { ...store, chats, projects, activeChatId }
  if (next.chats.length === 0) {
    next = createChat(next, null, '새 채팅')
  }
  return next
}

export function createProject(store: ChatStore, name: string): ChatStore {
  const p: ChatProject = {
    id: gid(),
    name,
    color: PCOLS[store.projects.length % PCOLS.length],
    chatIds: [],
    collapsed: false,
  }
  return { ...store, projects: [...store.projects, p] }
}

export function deleteProject(store: ChatStore, id: string): ChatStore {
  const p = store.projects.find((x) => x.id === id)
  if (!p) return store
  const remove = new Set(p.chatIds)
  const chats = store.chats.filter((c) => !remove.has(c.id) && c.projectId !== id)
  const projects = store.projects.filter((x) => x.id !== id)
  let activeChatId = store.activeChatId
  if (!chats.find((c) => c.id === activeChatId)) {
    activeChatId = chats[0]?.id ?? null
  }
  let next: ChatStore = { ...store, projects, chats, activeChatId }
  if (next.chats.length === 0) {
    next = createChat(next, null, '새 채팅')
  }
  return next
}

export function toggleProject(store: ChatStore, id: string): ChatStore {
  return {
    ...store,
    projects: store.projects.map((p) =>
      p.id === id ? { ...p, collapsed: !p.collapsed } : p,
    ),
  }
}

export function getActiveChat(store: ChatStore): ChatSession | null {
  return store.chats.find((c) => c.id === store.activeChatId) || null
}

export function setActiveChat(store: ChatStore, id: string): ChatStore {
  return { ...store, activeChatId: id }
}

export function appendMessage(
  store: ChatStore,
  chatId: string,
  msg: UiChatMessage,
): ChatStore {
  return {
    ...store,
    chats: store.chats.map((c) =>
      c.id === chatId
        ? {
            ...c,
            messages: [...c.messages, msg],
            updatedAt: Date.now(),
          }
        : c,
    ),
  }
}

export function setChatHistory(
  store: ChatStore,
  chatId: string,
  history: LlmTurn[],
): ChatStore {
  return {
    ...store,
    chats: store.chats.map((c) =>
      c.id === chatId ? { ...c, history, updatedAt: Date.now() } : c,
    ),
  }
}

export function renameChatIfFirst(
  store: ChatStore,
  chatId: string,
  firstUserMsg: string,
): ChatStore {
  return {
    ...store,
    chats: store.chats.map((c) => {
      if (c.id !== chatId) return c
      if (c.messages.filter((m) => m.role === 'user').length > 1) return c
      const title =
        firstUserMsg.slice(0, 22).trim() + (firstUserMsg.length > 22 ? '...' : '')
      return { ...c, title: title || c.title, updatedAt: Date.now() }
    }),
  }
}

export function trimHistory(history: LlmTurn[], max = 20): LlmTurn[] {
  return history.length > max ? history.slice(-max) : history
}
