import type {
  ActivityLog,
  Branch,
  CollabState,
  PullRequest,
  Repo,
} from '../types/collab'
import { ME } from '../types/collab'

const CKEY = 'codereview_collab_v2'
const COLORS = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#bc8cff', '#39d2c0', '#ff8c42']
const EMOJIS = ['rocket', 'lightbulb', 'zap', 'flame', 'star', 'hammer', 'target', 'building']

export function gid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

function seed(): CollabState {
  const rid = gid()
  const bid1 = gid()
  const bid2 = gid()
  const pid = gid()
  return {
    repos: [
      {
        id: rid,
        name: 'demo-project',
        desc: '협업 데모 저장소',
        owner: ME,
        members: [ME, 'alice', 'bob'],
        color: '#58a6ff',
        emoji: 'rocket',
        mergeRules: {
          requireApproval: true,
          minApprovals: 1,
          requireCI: false,
          deleteBranch: true,
        },
        createdAt: Date.now() - 86400000 * 3,
      },
    ],
    branches: [
      {
        id: bid1,
        repoId: rid,
        name: 'main',
        isDefault: true,
        author: ME,
        commits: 12,
        lastCommit: '초기 커밋',
        updatedAt: Date.now() - 7200000,
      },
      {
        id: bid2,
        repoId: rid,
        name: 'feature/ai-review',
        isDefault: false,
        author: 'alice',
        commits: 5,
        lastCommit: 'AI 리뷰 기능 추가',
        updatedAt: Date.now() - 1800000,
      },
    ],
    prs: [
      {
        id: pid,
        repoId: rid,
        title: 'AI 코드 리뷰 기능 추가',
        desc:
          'Groq API를 활용한 자동 코드 리뷰 기능입니다.\n\n- 버그 탐지\n- 성능 분석\n- 스타일 검사',
        src: 'feature/ai-review',
        tgt: 'main',
        author: 'alice',
        reviewers: [ME, 'bob'],
        status: 'open',
        approvals: ['bob'],
        before: 'def review(code):\n    pass',
        after:
          'def review(code):\n    # AI 기반 분석\n    result = analyze(code)\n    return result\n\ndef analyze(code):\n    return {"score": 85, "issues": []}',
        comments: [
          {
            id: gid(),
            lineNum: 2,
            content: 'analyze 함수 분리가 깔끔합니다!',
            author: 'bob',
            reactions: { '👍': [ME], '👎': [], '🎉': [], '❓': [] },
            createdAt: Date.now() - 3600000,
          },
        ],
        activity: [
          { type: 'created', author: 'alice', desc: 'PR 오픈', time: Date.now() - 7200000 },
          { type: 'approved', author: 'bob', desc: '승인', time: Date.now() - 3600000 },
        ],
        aiReviews: [],
        createdAt: Date.now() - 7200000,
      },
    ],
    log: [
      {
        id: gid(),
        repoId: rid,
        type: 'repo_created',
        author: ME,
        desc: '저장소 생성',
        time: Date.now() - 86400000 * 3,
      },
      {
        id: gid(),
        repoId: rid,
        type: 'branch_created',
        author: 'alice',
        desc: 'feature/ai-review 생성',
        time: Date.now() - 7200000,
      },
      {
        id: gid(),
        repoId: rid,
        type: 'pr_opened',
        author: 'alice',
        desc: 'PR: AI 코드 리뷰 기능 추가',
        time: Date.now() - 7200000,
      },
      {
        id: gid(),
        repoId: rid,
        type: 'pr_approved',
        author: 'bob',
        desc: 'PR 승인',
        time: Date.now() - 3600000,
      },
    ],
  }
}

export function loadCollab(): CollabState {
  try {
    const raw = localStorage.getItem(CKEY)
    if (!raw) return seed()
    const s = JSON.parse(raw) as CollabState
    if (!s.repos) return seed()
    return s
  } catch {
    return seed()
  }
}

export function saveCollab(cs: CollabState): void {
  try {
    localStorage.setItem(CKEY, JSON.stringify(cs))
  } catch {
    /* ignore */
  }
}

export function addLog(
  cs: CollabState,
  repoId: string,
  type: string,
  author: string,
  desc: string,
): CollabState {
  const entry: ActivityLog = {
    id: gid(),
    repoId,
    type,
    author,
    desc,
    time: Date.now(),
  }
  return { ...cs, log: [...cs.log, entry] }
}

export function createRepo(
  cs: CollabState,
  name: string,
  desc: string,
  membersCsv: string,
): CollabState {
  const mems = membersCsv
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
  if (!mems.includes(ME)) mems.unshift(ME)
  const repo: Repo = {
    id: gid(),
    name,
    desc: desc || `${name} 프로젝트`,
    owner: ME,
    members: mems,
    color: COLORS[cs.repos.length % COLORS.length],
    emoji: EMOJIS[cs.repos.length % EMOJIS.length],
    mergeRules: {
      requireApproval: true,
      minApprovals: 1,
      requireCI: false,
      deleteBranch: true,
    },
    createdAt: Date.now(),
  }
  const branch: Branch = {
    id: gid(),
    repoId: repo.id,
    name: 'main',
    isDefault: true,
    author: ME,
    commits: 0,
    lastCommit: '초기 커밋',
    updatedAt: Date.now(),
  }
  let next = {
    ...cs,
    repos: [...cs.repos, repo],
    branches: [...cs.branches, branch],
  }
  next = addLog(next, repo.id, 'repo_created', ME, `저장소 생성: ${name}`)
  return next
}

export function createBranch(cs: CollabState, repoId: string, name: string): CollabState {
  const branch: Branch = {
    id: gid(),
    repoId,
    name,
    isDefault: false,
    author: ME,
    commits: 0,
    lastCommit: '초기 커밋',
    updatedAt: Date.now(),
  }
  let next = { ...cs, branches: [...cs.branches, branch] }
  next = addLog(next, repoId, 'branch_created', ME, `${name} 브랜치 생성`)
  return next
}

export function deleteBranch(cs: CollabState, branchId: string): CollabState {
  return {
    ...cs,
    branches: cs.branches.filter((b) => b.id !== branchId),
  }
}

export function createPR(
  cs: CollabState,
  pr: Omit<PullRequest, 'id' | 'createdAt' | 'activity' | 'comments' | 'aiReviews' | 'approvals' | 'status'>,
): CollabState {
  const full: PullRequest = {
    ...pr,
    id: gid(),
    status: 'open',
    approvals: [],
    comments: [],
    activity: [{ type: 'created', author: ME, desc: 'PR 오픈', time: Date.now() }],
    aiReviews: [],
    createdAt: Date.now(),
  }
  let next = { ...cs, prs: [full, ...cs.prs] }
  next = addLog(next, pr.repoId, 'pr_opened', ME, `PR: ${pr.title}`)
  return next
}

export function updatePR(
  cs: CollabState,
  prId: string,
  updater: (pr: PullRequest) => PullRequest,
): CollabState {
  return {
    ...cs,
    prs: cs.prs.map((p) => (p.id === prId ? updater(p) : p)),
  }
}

export function mergePR(cs: CollabState, prId: string, repo: Repo): CollabState {
  const pr = cs.prs.find((p) => p.id === prId)
  if (!pr) return cs
  let next = updatePR(cs, prId, (p) => ({
    ...p,
    status: 'merged',
    activity: [...p.activity, { type: 'merged', author: ME, desc: '머지 완료', time: Date.now() }],
  }))
  next = addLog(next, repo.id, 'pr_merged', ME, `PR 머지: ${pr.title}`)
  if (repo.mergeRules.deleteBranch) {
    next = {
      ...next,
      branches: next.branches.filter(
        (b) => !(b.repoId === repo.id && b.name === pr.src),
      ),
    }
  }
  return next
}

export function closePR(cs: CollabState, prId: string, repoId: string): CollabState {
  const pr = cs.prs.find((p) => p.id === prId)
  if (!pr) return cs
  let next = updatePR(cs, prId, (p) => ({
    ...p,
    status: 'closed',
    activity: [...p.activity, { type: 'closed', author: ME, desc: 'PR 닫힘', time: Date.now() }],
  }))
  next = addLog(next, repoId, 'pr_closed', ME, `PR 닫힘: ${pr.title}`)
  return next
}

export function updateRepo(
  cs: CollabState,
  repoId: string,
  updater: (r: Repo) => Repo,
): CollabState {
  return {
    ...cs,
    repos: cs.repos.map((r) => (r.id === repoId ? updater(r) : r)),
  }
}
