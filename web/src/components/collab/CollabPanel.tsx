import { useMemo, useState } from 'react'
import {
  addLog,
  closePR,
  createBranch,
  createPR,
  createRepo,
  deleteBranch,
  gid,
  loadCollab,
  mergePR,
  saveCollab,
  updatePR,
  updateRepo,
} from '../../services/collabStore'
import { runPrAiReview } from '../../services/prAi'
import type {
  AiReview,
  CollabState,
  CollabView,
  PrSubTab,
  PullRequest,
  Repo,
} from '../../types/collab'
import { ME } from '../../types/collab'
import { computeDiff } from '../../utils/diff'
import { ago } from '../../utils/time'
import { Avatar, Card, StatusBadge } from './collabShared'
import { Icon, IconLabel, type IconName } from '../icons'
import styles from './CollabPanel.module.css'

const REPO_ICONS: IconName[] = ['rocket', 'lightbulb', 'zap', 'flame', 'star', 'hammer', 'target', 'building']

function RepoIcon({ name, size = 16 }: { name?: string; size?: number }) {
  const n = (REPO_ICONS.includes(name as IconName) ? name : 'rocket') as IconName
  return <Icon name={n} size={size} />
}

const REACT_ICONS: Record<string, IconName> = {
  '👍': 'thumbsUp',
  '👎': 'thumbsDown',
  '🎉': 'sparkles',
  '❓': 'help',
}

const LOG_CLR: Record<string, string> = {
  repo_created: '#58a6ff',
  branch_created: '#3fb950',
  pr_opened: '#58a6ff',
  pr_approved: '#3fb950',
  pr_merged: '#bc8cff',
  pr_closed: '#f85149',
  commented: '#d29922',
  ai_reviewed: '#bc8cff',
  change_requested: '#d29922',
}

type Props = {
  open: boolean
  onClose: () => void
  needKey: () => boolean
  onModelChange?: (label: string) => void
}

export function CollabPanel({ open, onClose, needKey, onModelChange }: Props) {
  const [cs, setCs] = useState<CollabState>(() => loadCollab())
  const [repoId, setRepoId] = useState<string | null>(
    () => loadCollab().repos[0]?.id ?? null,
  )
  const [view, setView] = useState<CollabView>('overview')
  const [prId, setPrId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [repoModal, setRepoModal] = useState(false)
  const [prModal, setPrModal] = useState<{ open: boolean; src?: string }>({
    open: false,
  })

  if (!open) return null

  const persist = (next: CollabState) => {
    saveCollab(next)
    setCs(next)
  }

  const repo = cs.repos.find((r) => r.id === repoId) || null
  const pr = cs.prs.find((p) => p.id === prId) || null

  const reposFiltered = cs.repos.filter(
    (r) => !search || r.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className={styles.overlay}>
      <div className={styles.hdr}>
        <div className={styles.hdrLeft}>
          <div className={styles.logo}><Icon name="users" size={14} /></div>
          <span className={styles.hdrTitle}>협업 시스템</span>
          <div className={styles.bc}>
            {repo && (
              <button
                type="button"
                className={styles.bcLink}
                onClick={() => {
                  setPrId(null)
                  setView('overview')
                }}
              >
                {repo.name}
              </button>
            )}
            {pr && (
              <>
                <span> › </span>
                <span>{pr.title.slice(0, 28)}…</span>
              </>
            )}
          </div>
        </div>
        <div className={styles.hdrRight}>
          <span className={styles.connected}><IconLabel name="circleDot" size={10}>연결됨</IconLabel></span>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <IconLabel name="x" size={12}>닫기</IconLabel>
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sbTop}>
            <button
              type="button"
              className={styles.newRepo}
              onClick={() => setRepoModal(true)}
            >
              + 새 저장소
            </button>
            <input
              className={styles.search}
              placeholder="저장소 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.repoList}>
            {reposFiltered.length === 0 && (
              <div style={{ padding: 16, fontSize: 10, color: '#8b949e', textAlign: 'center' }}>
                저장소 없음
              </div>
            )}
            {reposFiltered.map((r) => {
              const openPrs = cs.prs.filter(
                (p) => p.repoId === r.id && p.status === 'open',
              ).length
              return (
                <button
                  key={r.id}
                  type="button"
                  className={`${styles.repoItem} ${r.id === repoId ? styles.repoActive : ''}`}
                  onClick={() => {
                    setRepoId(r.id)
                    setView('overview')
                    setPrId(null)
                  }}
                >
                  <div
                    className={styles.repoIco}
                    style={{ background: `${r.color}22` }}
                  >
                    <RepoIcon name={r.emoji} size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.repoName}>{r.name}</div>
                    <div className={styles.repoMeta}>
                      {r.members.length}명
                      {openPrs ? ` · PR ${openPrs}` : ''}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <div className={styles.main}>
          {!prId && (
            <div className={styles.nav}>
              {(
                [
                  ['overview', 'clipboard', '개요'],
                  ['branches', 'branch', '브랜치'],
                  ['prs', 'gitMerge', 'Pull Requests'],
                  ['activity', 'chart', '활동 로그'],
                  ['aireview', 'bot', 'AI 리뷰'],
                ] as [CollabView, IconName, string][]
              ).map(([k, icon, label]) => (
                <button
                  key={k}
                  type="button"
                  className={`${styles.navTab} ${view === k ? styles.navActive : ''}`}
                  onClick={() => {
                    setView(k)
                    setPrId(null)
                  }}
                >
                  <IconLabel name={icon} size={12}>{label}</IconLabel>
                </button>
              ))}
            </div>
          )}

          <div className={styles.content}>
            {!repo ? (
              <div className={styles.emptyCenter}>
                저장소를 선택하거나 새로 만드세요
              </div>
            ) : prId && pr ? (
              <PrDetail
                cs={cs}
                repo={repo}
                pr={pr}
                persist={persist}
                needKey={needKey}
                onModelChange={onModelChange}
                onBack={() => setPrId(null)}
              />
            ) : view === 'overview' ? (
              <Overview
                cs={cs}
                repo={repo}
                persist={persist}
                onNewBranch={() => {
                  const name = prompt('새 브랜치 이름:', 'feature/')
                  if (!name?.trim()) return
                  persist(createBranch(cs, repo.id, name.trim()))
                }}
                onNewPr={() => setPrModal({ open: true })}
              />
            ) : view === 'branches' ? (
              <BranchesView
                cs={cs}
                repo={repo}
                persist={persist}
                onNewPr={(src) => setPrModal({ open: true, src })}
              />
            ) : view === 'prs' ? (
              <PrListView
                cs={cs}
                repo={repo}
                persist={persist}
                onOpen={(id) => setPrId(id)}
                onNewPr={() => setPrModal({ open: true })}
              />
            ) : view === 'activity' ? (
              <ActivityView cs={cs} repo={repo} />
            ) : (
              <AiHubView
                cs={cs}
                repo={repo}
                persist={persist}
                needKey={needKey}
                onModelChange={onModelChange}
                onOpenPr={(id) => setPrId(id)}
              />
            )}
          </div>
        </div>
      </div>

      {repoModal && (
        <RepoModal
          onClose={() => setRepoModal(false)}
          onCreate={(name, desc, members) => {
            const next = createRepo(cs, name, desc, members)
            persist(next)
            setRepoId(next.repos[next.repos.length - 1].id)
            setRepoModal(false)
          }}
        />
      )}

      {prModal.open && repo && (
        <PrCreateModal
          repo={repo}
          branches={cs.branches.filter((b) => b.repoId === repo.id)}
          defaultSrc={prModal.src}
          onClose={() => setPrModal({ open: false })}
          onCreate={(data) => {
            const next = createPR(cs, { ...data, repoId: repo.id, author: ME })
            persist(next)
            setPrModal({ open: false })
            setView('prs')
            setPrId(next.prs[0].id)
          }}
        />
      )}
    </div>
  )
}

/* ── Overview ── */
function Overview({
  cs,
  repo,
  persist,
  onNewBranch,
  onNewPr,
}: {
  cs: CollabState
  repo: Repo
  persist: (s: CollabState) => void
  onNewBranch: () => void
  onNewPr: () => void
}) {
  const brs = cs.branches.filter((b) => b.repoId === repo.id)
  const prs = cs.prs.filter((p) => p.repoId === repo.id)
  const logs = cs.log
    .filter((a) => a.repoId === repo.id)
    .slice(-6)
    .reverse()

  return (
    <div className={styles.wrap}>
      <div className={styles.repoHeader}>
        <div className={styles.repoBigIco} style={{ background: `${repo.color}22` }}>
          <RepoIcon name={repo.emoji} size={28} />
        </div>
        <div style={{ flex: 1 }}>
          <div className={styles.repoBigName}>{repo.name}</div>
          <div className={styles.repoDesc}>{repo.desc}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className={styles.btnGhost} onClick={onNewBranch}>
            <IconLabel name="branch" size={12}>새 브랜치</IconLabel>
          </button>
          <button type="button" className={styles.btnPrimary} onClick={onNewPr}>
            <IconLabel name="gitMerge" size={12}>PR 생성</IconLabel>
          </button>
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIco}><Icon name="branch" size={18} /></div>
          <div className={styles.statVal}>{brs.length}</div>
          <div className={styles.statLbl}>브랜치</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIco}><Icon name="gitMerge" size={18} /></div>
          <div className={styles.statVal}>
            {prs.filter((p) => p.status === 'open').length}
          </div>
          <div className={styles.statLbl}>열린 PR</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIco}><Icon name="users" size={18} /></div>
          <div className={styles.statVal}>{repo.members.length}</div>
          <div className={styles.statLbl}>멤버</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIco}><Icon name="checkCircle" size={18} /></div>
          <div className={styles.statVal}>
            {prs.filter((p) => p.status === 'merged').length}
          </div>
          <div className={styles.statLbl}>머지됨</div>
        </div>
      </div>

      <Card title={<IconLabel name="settings" size={13}>머지 규칙</IconLabel>}>
        {(
          [
            ['requireApproval', '승인 필수', '머지 전 리뷰어 승인 필요'],
            ['requireCI', 'CI 통과 필수', '자동화 테스트 통과 필요'],
            ['deleteBranch', '머지 후 브랜치 삭제', '소스 브랜치 자동 삭제'],
          ] as const
        ).map(([key, label, desc]) => (
          <div key={key} className={styles.mrRow}>
            <div>
              <div className={styles.mrLabel}>{label}</div>
              <div className={styles.mrDesc}>{desc}</div>
            </div>
            <input
              type="checkbox"
              checked={!!repo.mergeRules[key]}
              onChange={(e) =>
                persist(
                  updateRepo(cs, repo.id, (r) => ({
                    ...r,
                    mergeRules: { ...r.mergeRules, [key]: e.target.checked },
                  })),
                )
              }
            />
          </div>
        ))}
      </Card>

      <Card
        title={<IconLabel name="users" size={13}>멤버 ({repo.members.length})</IconLabel>}
        action={
          <button
            type="button"
            className={styles.btnSm}
            onClick={() => {
              const n = prompt('멤버 이름:')
              if (n?.trim() && !repo.members.includes(n.trim())) {
                persist(
                  updateRepo(cs, repo.id, (r) => ({
                    ...r,
                    members: [...r.members, n.trim()],
                  })),
                )
              }
            }}
          >
            <IconLabel name="plus" size={10}>추가</IconLabel>
          </button>
        }
      >
        <div className={styles.memberRow}>
          {repo.members.map((m) => (
            <div key={m} className={styles.member}>
              <Avatar name={m} size={20} />
              {m}
              {m === repo.owner && (
                <span style={{ fontSize: 9, color: '#d29922', fontWeight: 600 }}>
                  owner
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card title={<IconLabel name="chart" size={13}>최근 활동</IconLabel>}>
        {logs.length === 0 ? (
          <div style={{ padding: 14, textAlign: 'center', color: '#8b949e', fontSize: 11 }}>
            활동 없음
          </div>
        ) : (
          logs.map((a) => (
            <div key={a.id} className={styles.logRow}>
              <div
                className={styles.logDot}
                style={{ background: LOG_CLR[a.type] || '#58a6ff' }}
              />
              <div style={{ flex: 1 }}>
                <Avatar name={a.author} size={15} />{' '}
                <strong style={{ color: '#e6edf3' }}>{a.author}</strong> {a.desc}
              </div>
              <span style={{ fontSize: 9, whiteSpace: 'nowrap' }}>{ago(a.time)}</span>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}

/* ── Branches ── */
function BranchesView({
  cs,
  repo,
  persist,
  onNewPr,
}: {
  cs: CollabState
  repo: Repo
  persist: (s: CollabState) => void
  onNewPr: (src: string) => void
}) {
  const brs = cs.branches.filter((b) => b.repoId === repo.id)
  return (
    <div className={styles.wrap}>
      <div className={styles.rowBetween}>
        <h2 className={styles.h2}><IconLabel name="branch" size={16}>브랜치 ({brs.length})</IconLabel></h2>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => {
            const name = prompt('새 브랜치 이름:', 'feature/')
            if (!name?.trim()) return
            persist(createBranch(cs, repo.id, name.trim()))
          }}
        >
          <IconLabel name="plus" size={12}>새 브랜치</IconLabel>
        </button>
      </div>
      {brs.map((b) => {
        const bPRs = cs.prs.filter(
          (p) => p.repoId === repo.id && p.src === b.name && p.status === 'open',
        ).length
        return (
          <div key={b.id} className={styles.branchCard}>
            <div style={{ fontSize: 20 }}><Icon name={b.isDefault ? 'tree' : 'branch'} size={20} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                <span className={styles.branchName}>{b.name}</span>
                {b.isDefault && (
                  <span className={`${styles.badge} ${styles.badgeMain}`}>default</span>
                )}
                {bPRs > 0 && (
                  <span className={`${styles.badge} ${styles.badgeOpen}`}>PR {bPRs}</span>
                )}
              </div>
              <div style={{ fontSize: 10, color: '#8b949e' }}>
                <Avatar name={b.author} size={14} /> {b.author} · 커밋 {b.commits}개 ·{' '}
                {b.lastCommit} · {ago(b.updatedAt)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className={styles.btnSm} onClick={() => onNewPr(b.name)}>
                PR 생성
              </button>
              {!b.isDefault && (
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={() => {
                    if (!confirm('브랜치를 삭제할까요?')) return
                    persist(deleteBranch(cs, b.id))
                  }}
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── PR List ── */
function PrListView({
  cs,
  repo,
  persist,
  onOpen,
  onNewPr,
}: {
  cs: CollabState
  repo: Repo
  persist: (s: CollabState) => void
  onOpen: (id: string) => void
  onNewPr: () => void
}) {
  const all = cs.prs.filter((p) => p.repoId === repo.id)
  const open = all.filter((p) => p.status === 'open')
  const done = all.filter((p) => p.status !== 'open')
  const req = repo.mergeRules.minApprovals || 1

  return (
    <div className={styles.wrap}>
      <div className={styles.rowBetween}>
        <h2 className={styles.h2}><IconLabel name="gitMerge" size={16}>Pull Requests</IconLabel></h2>
        <button type="button" className={styles.btnPrimary} onClick={onNewPr}>
          <IconLabel name="plus" size={12}>PR 생성</IconLabel>
        </button>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid #30363d', marginBottom: 16 }}>
        <span style={{ padding: '7px 16px', fontSize: 11, color: '#3fb950', borderBottom: '2px solid #3fb950' }}>
          열린 PR ({open.length})
        </span>
        <span style={{ padding: '7px 16px', fontSize: 11, color: '#8b949e' }}>
          닫힌 PR ({done.length})
        </span>
      </div>
      {open.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#8b949e', fontSize: 12 }}>
          열린 PR이 없습니다
        </div>
      ) : (
        open.map((pr) => {
          const app = (pr.approvals || []).length
          const canM = app >= req && pr.status === 'open'
          const lastAI = pr.aiReviews[pr.aiReviews.length - 1]
          return (
            <div key={pr.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button type="button" className={styles.prCard} onClick={() => onOpen(pr.id)}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                  <StatusBadge status={pr.status} />
                  <span className={styles.prTitle}>{pr.title}</span>
                </div>
                <div className={styles.prMeta}>
                  <Avatar name={pr.author} size={15} /> {pr.author} ·
                  <code className={styles.codeChip}>{pr.src}</code> →
                  <code className={styles.codeChip}>{pr.tgt}</code> · {ago(pr.createdAt)}
                </div>
                <div style={{ fontSize: 10, display: 'flex', gap: 10 }}>
                  <span style={{ color: canM ? '#3fb950' : '#d29922' }}>
                    <IconLabel name="check" size={10}>승인 {app}/{req}</IconLabel>
                  </span>
                  <span style={{ color: '#8b949e' }}><IconLabel name="message" size={10}>{pr.comments.length}</IconLabel></span>
                  {lastAI ? (
                    <span style={{ color: '#bc8cff' }}><IconLabel name="bot" size={10}>AI {lastAI.score}/100</IconLabel></span>
                  ) : (
                    <span style={{ color: '#8b949e' }}><IconLabel name="bot" size={10}>AI 미분석</IconLabel></span>
                  )}
                </div>
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                {canM && (
                  <button
                    type="button"
                    className={styles.btnMerge}
                    onClick={() => {
                      if (confirm('PR을 머지할까요?')) persist(mergePR(cs, pr.id, repo))
                    }}
                  >
                    Merge
                  </button>
                )}
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => persist(closePR(cs, pr.id, repo.id))}
                >
                  닫기
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

/* ── PR Detail ── */
function PrDetail({
  cs,
  repo,
  pr,
  persist,
  needKey,
  onModelChange,
  onBack,
}: {
  cs: CollabState
  repo: Repo
  pr: PullRequest
  persist: (s: CollabState) => void
  needKey: () => boolean
  onModelChange?: (label: string) => void
  onBack: () => void
}) {
  const [tab, setTab] = useState<PrSubTab>('diff')
  const [commentLine, setCommentLine] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiErr, setAiErr] = useState<string | null>(null)
  const [humanNote, setHumanNote] = useState('')

  const app = (pr.approvals || []).length
  const req = repo.mergeRules.minApprovals || 1
  const canM = app >= req && pr.status === 'open'
  const iAmRev = (pr.reviewers || []).includes(ME)
  const iApp = (pr.approvals || []).includes(ME)
  const lastAI = pr.aiReviews[pr.aiReviews.length - 1]
  const diff = useMemo(
    () => computeDiff(pr.before || '', pr.after || ''),
    [pr.before, pr.after],
  )
  const adds = diff.filter((l) => l.t === 'add').length
  const dels = diff.filter((l) => l.t === 'del').length
  const pct = (adds / (adds + dels || 1)) * 100

  const runAi = async () => {
    if (needKey()) return
    setAiLoading(true)
    setAiErr(null)
    try {
      const ai = await runPrAiReview(pr, onModelChange)
      let next = updatePR(cs, pr.id, (p) => ({
        ...p,
        aiReviews: [...p.aiReviews, ai],
        activity: [
          ...p.activity,
          {
            type: 'ai_reviewed',
            author: 'AI',
            desc: `AI 분석 완료 · 점수: ${ai.score}`,
            time: Date.now(),
          },
        ],
      }))
      next = addLog(next, repo.id, 'ai_reviewed', 'AI', `PR AI 분석: ${pr.title}`)
      persist(next)
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : 'AI 분석 실패')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.btnGhost}
        style={{ marginBottom: 12 }}
        onClick={onBack}
      >
        <IconLabel name="arrowLeft" size={12}>PR 목록</IconLabel>
      </button>

      <div className={styles.rowBetween}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <StatusBadge status={pr.status} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{pr.title}</span>
          </div>
          <div className={styles.prMeta}>
            <Avatar name={pr.author} size={18} />
            <strong style={{ color: '#e6edf3' }}>{pr.author}</strong> · {ago(pr.createdAt)} ·
            <code className={styles.codeChip}>{pr.src}</code> →
            <code className={styles.codeChip}>{pr.tgt}</code>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {iAmRev && !iApp && pr.status === 'open' && (
            <button
              type="button"
              className={styles.btnPrimary}
              style={{ background: 'rgba(63,185,80,.15)', color: '#3fb950', border: '1px solid rgba(63,185,80,.4)' }}
              onClick={() => {
                let next = updatePR(cs, pr.id, (p) => ({
                  ...p,
                  approvals: [...(p.approvals || []), ME],
                  activity: [
                    ...p.activity,
                    { type: 'approved', author: ME, desc: '승인', time: Date.now() },
                  ],
                }))
                next = addLog(next, repo.id, 'pr_approved', ME, `PR 승인: ${pr.title}`)
                persist(next)
              }}
            >
              <IconLabel name="check" size={12}>승인</IconLabel>
            </button>
          )}
          {iApp && (
            <span style={{ padding: '6px 16px', color: '#3fb950', fontSize: 11, fontWeight: 600 }}>
              <IconLabel name="check" size={12}>승인됨</IconLabel>
            </span>
          )}
          {canM && (
            <button
              type="button"
              className={styles.btnMerge}
              onClick={() => {
                if (confirm('PR을 머지할까요?')) persist(mergePR(cs, pr.id, repo))
              }}
            >
              <IconLabel name="sparkles" size={12}>Merge PR</IconLabel>
            </button>
          )}
          {pr.status === 'open' && (
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => persist(closePR(cs, pr.id, repo.id))}
            >
              닫기
            </button>
          )}
        </div>
      </div>

      <div className={styles.pdTabs}>
        {(
          [
            ['diff', 'file', 'Diff'],
            ['desc', 'book', '설명'],
            ['review', 'message', `리뷰 (${pr.comments.length})`],
            ['aireview', 'bot', lastAI ? 'AI 리뷰 ✓' : 'AI 리뷰'],
            ['log', 'chart', `활동 (${pr.activity.length})`],
          ] as [PrSubTab, IconName, string][]
        ).map(([k, icon, label]) => (
          <button
            key={k}
            type="button"
            className={`${styles.pdTab} ${tab === k ? styles.pdActive : ''}`}
            onClick={() => setTab(k)}
          >
            <IconLabel name={icon} size={12}>{label}</IconLabel>
          </button>
        ))}
      </div>

      {tab === 'diff' && (
        <div>
          <div className={styles.diffStats}>
            <span className={styles.codeChip}><IconLabel name="file" size={10}>review.py</IconLabel></span>
            <span style={{ color: '#3fb950' }}>+{adds}</span>
            <span style={{ color: '#f85149' }}>-{dels}</span>
            <div className={styles.diffBar}>
              <div className={styles.diffBarFill} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className={styles.diffBox}>
            <div className={styles.diffHdr}>
              Unified Diff · 라인 클릭 → 코멘트 추가
            </div>
            <div style={{ background: '#0d1117' }}>
              {diff.map((l, i) => {
                const coms = pr.comments.filter((c) => c.lineNum === i)
                const sym = l.t === 'add' ? '+' : l.t === 'del' ? '-' : ' '
                const cls =
                  l.t === 'add'
                    ? styles.diffAdd
                    : l.t === 'del'
                      ? styles.diffDel
                      : styles.diffCtx
                return (
                  <div key={i}>
                    <button
                      type="button"
                      className={`${styles.diffLine} ${cls}`}
                      onClick={() =>
                        setCommentLine(commentLine === i ? null : i)
                      }
                    >
                      <span className={styles.diffLn}>{i}</span>
                      <span className={styles.diffSym}>{sym}</span>
                      <span style={{ flex: 1, whiteSpace: 'pre' }}>{l.text}</span>
                    </button>
                    {coms.map((c) => (
                      <div key={c.id} className={styles.commentBox}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
                          <Avatar name={c.author} size={16} />
                          <strong style={{ fontSize: 10.5 }}>{c.author}</strong>
                          <span style={{ fontSize: 9, color: '#8b949e' }}>
                            {ago(c.createdAt)}
                          </span>
                        </div>
                        <div style={{ fontSize: 11 }}>{c.content}</div>
                        <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                          {(['👍', '👎', '🎉', '❓'] as const).map((em) => {
                            const cnt = (c.reactions[em] || []).length
                            const act = (c.reactions[em] || []).includes(ME)
                            return (
                              <button
                                key={em}
                                type="button"
                                className={`${styles.reactBtn} ${act ? styles.reactOn : ''}`}
                                onClick={() => {
                                  persist(
                                    updatePR(cs, pr.id, (p) => ({
                                      ...p,
                                      comments: p.comments.map((x) => {
                                        if (x.id !== c.id) return x
                                        const list = [...(x.reactions[em] || [])]
                                        const idx = list.indexOf(ME)
                                        if (idx !== -1) list.splice(idx, 1)
                                        else list.push(ME)
                                        return {
                                          ...x,
                                          reactions: { ...x.reactions, [em]: list },
                                        }
                                      }),
                                    })),
                                  )
                                }}
                              >
                                <Icon name={REACT_ICONS[em]} size={12} />
                                {cnt ? ` ${cnt}` : ''}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    {commentLine === i && (
                      <div className={styles.commentForm}>
                        <textarea
                          className={styles.commentTa}
                          placeholder="라인 코멘트..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className={styles.btnSm}
                            onClick={() => {
                              setCommentLine(null)
                              setCommentText('')
                            }}
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            className={styles.btnPrimary}
                            onClick={() => {
                              const txt = commentText.trim()
                              if (!txt) return
                              persist(
                                updatePR(cs, pr.id, (p) => ({
                                  ...p,
                                  comments: [
                                    ...p.comments,
                                    {
                                      id: gid(),
                                      lineNum: i,
                                      content: txt,
                                      author: ME,
                                      reactions: { '👍': [], '👎': [], '🎉': [], '❓': [] },
                                      createdAt: Date.now(),
                                    },
                                  ],
                                  activity: [
                                    ...p.activity,
                                    {
                                      type: 'commented',
                                      author: ME,
                                      desc: txt.slice(0, 30),
                                      time: Date.now(),
                                    },
                                  ],
                                })),
                              )
                              setCommentLine(null)
                              setCommentText('')
                            }}
                          >
                            등록
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ fontSize: 10, fontWeight: 600, color: '#8b949e', marginBottom: 8 }}>
            Side-by-Side 비교
          </div>
          <div className={styles.sideBySide}>
            <div className={styles.sidePane}>
              <div className={`${styles.sideHdr} ${styles.sideHdrBefore}`}>− Before</div>
              <div className={styles.sideBody}>
                {(pr.before || '').split('\n').map((l, i) => (
                  <div
                    key={i}
                    className={styles.sideLine}
                    style={{ background: 'rgba(248,81,73,.07)' }}
                  >
                    <span className={styles.diffLn}>{i + 1}</span>
                    <span style={{ color: '#ff7b72', whiteSpace: 'pre' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.sidePane}>
              <div className={`${styles.sideHdr} ${styles.sideHdrAfter}`}>+ After</div>
              <div className={styles.sideBody} style={{ borderLeft: '1px solid #30363d' }}>
                {(pr.after || '').split('\n').map((l, i) => (
                  <div
                    key={i}
                    className={styles.sideLine}
                    style={{ background: 'rgba(63,185,80,.07)' }}
                  >
                    <span className={styles.diffLn}>{i + 1}</span>
                    <span style={{ color: '#7ee787', whiteSpace: 'pre' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'desc' && (
        <div className={styles.card}>
          <div className={styles.cardBody}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <Avatar name={pr.author} size={20} />
              <strong style={{ fontSize: 12 }}>{pr.author}</strong>
              <span style={{ fontSize: 10, color: '#8b949e' }}>{ago(pr.createdAt)}</span>
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {pr.desc || '설명 없음'}
            </div>
          </div>
        </div>
      )}

      {tab === 'review' && (
        <div>
          <Card title={`승인 현황 (${app}/${req})`}>
            {(pr.reviewers || []).map((r) => {
              const ok = (pr.approvals || []).includes(r)
              return (
                <div
                  key={r}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(48,54,61,.4)',
                  }}
                >
                  <Avatar name={r} size={20} />
                  <span style={{ flex: 1, fontSize: 11 }}>{r}</span>
                  <span style={{ fontSize: 10, color: ok ? '#3fb950' : '#d29922' }}>
                    {ok ? <IconLabel name="check" size={10}>승인</IconLabel> : <IconLabel name="clock" size={10}>대기</IconLabel>}
                  </span>
                </div>
              )
            })}
          </Card>
          {pr.comments.map((c) => (
            <div key={c.id} className={styles.commentBox} style={{ margin: '0 0 8px' }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <Avatar name={c.author} size={18} />
                <strong style={{ fontSize: 11 }}>{c.author}</strong>
                {c.lineNum >= 0 && (
                  <span className={styles.codeChip}>Line {c.lineNum}</span>
                )}
                <span style={{ fontSize: 9, color: '#8b949e' }}>{ago(c.createdAt)}</span>
              </div>
              <div style={{ fontSize: 11 }}>{c.content}</div>
            </div>
          ))}
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <textarea
                className={styles.commentTa}
                placeholder="전체 리뷰 코멘트..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                style={{ minHeight: 70 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => {
                    const txt = reviewText.trim()
                    if (!txt) return
                    persist(
                      updatePR(cs, pr.id, (p) => ({
                        ...p,
                        comments: [
                          ...p.comments,
                          {
                            id: gid(),
                            lineNum: -1,
                            content: txt,
                            author: ME,
                            reactions: { '👍': [], '👎': [], '🎉': [], '❓': [] },
                            createdAt: Date.now(),
                          },
                        ],
                        activity: [
                          ...p.activity,
                          {
                            type: 'commented',
                            author: ME,
                            desc: txt.slice(0, 30),
                            time: Date.now(),
                          },
                        ],
                      })),
                    )
                    setReviewText('')
                  }}
                >
                  코멘트 등록
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'aireview' && (
        <AiReviewTab
          lastAI={lastAI}
          aiLoading={aiLoading}
          aiErr={aiErr}
          humanNote={humanNote}
          setHumanNote={setHumanNote}
          onRun={runAi}
          onHd={(itemId, hd) => {
            if (!lastAI) return
            persist(
              updatePR(cs, pr.id, (p) => ({
                ...p,
                aiReviews: p.aiReviews.map((ar, idx) =>
                  idx === p.aiReviews.length - 1
                    ? {
                        ...ar,
                        items: ar.items.map((it) =>
                          it.id === itemId ? { ...it, hd } : it,
                        ),
                      }
                    : ar,
                ),
              })),
            )
          }}
          onApprove={() => {
            let next = updatePR(cs, pr.id, (p) => {
              const approvals = p.approvals.includes(ME)
                ? p.approvals
                : [...p.approvals, ME]
              return {
                ...p,
                approvals,
                activity: [
                  ...p.activity,
                  {
                    type: 'approved',
                    author: ME,
                    desc:
                      'AI 리뷰 검토 후 승인' +
                      (humanNote ? ` — ${humanNote.slice(0, 30)}` : ''),
                    time: Date.now(),
                  },
                ],
                aiReviews: p.aiReviews.map((ar, i) =>
                  i === p.aiReviews.length - 1
                    ? { ...ar, humanApproved: true }
                    : ar,
                ),
              }
            })
            next = addLog(next, repo.id, 'pr_approved', ME, `PR 승인: ${pr.title}`)
            persist(next)
          }}
          onRequest={() => {
            const note = humanNote || '수정이 필요합니다.'
            persist(
              updatePR(cs, pr.id, (p) => ({
                ...p,
                comments: [
                  ...p.comments,
                  {
                    id: gid(),
                    lineNum: -1,
                    content: `[수정 요청] ${note}`,
                    author: ME,
                    reactions: { '👍': [], '👎': [], '🎉': [], '❓': [] },
                    createdAt: Date.now(),
                  },
                ],
                activity: [
                  ...p.activity,
                  {
                    type: 'change_requested',
                    author: ME,
                    desc: `수정 요청: ${note.slice(0, 30)}`,
                    time: Date.now(),
                  },
                ],
              })),
            )
            alert('수정 요청이 등록되었습니다.')
          }}
          onOverride={() => {
            if (!confirm('AI 리뷰를 무시하고 강제 승인할까요?')) return
            let next = updatePR(cs, pr.id, (p) => {
              const approvals = p.approvals.includes(ME)
                ? p.approvals
                : [...p.approvals, ME]
              return {
                ...p,
                approvals,
                activity: [
                  ...p.activity,
                  {
                    type: 'approved',
                    author: ME,
                    desc:
                      'AI 무시·강제 승인' +
                      (humanNote ? ` — ${humanNote.slice(0, 30)}` : ''),
                    time: Date.now(),
                  },
                ],
              }
            })
            next = addLog(next, repo.id, 'pr_approved', ME, `PR 강제 승인: ${pr.title}`)
            persist(next)
          }}
        />
      )}

      {tab === 'log' && (
        <div className={styles.card}>
          <div className={styles.cardBody}>
            {[...pr.activity].reverse().map((a, i) => (
              <div key={i} className={styles.logRow}>
                <div
                  className={styles.logDot}
                  style={{ background: LOG_CLR[a.type] || '#58a6ff' }}
                />
                <div style={{ flex: 1 }}>
                  <Avatar name={a.author} size={15} />{' '}
                  <strong style={{ color: '#e6edf3' }}>{a.author}</strong> {a.desc}
                </div>
                <span style={{ fontSize: 9 }}>{ago(a.time)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AiReviewTab({
  lastAI,
  aiLoading,
  aiErr,
  humanNote,
  setHumanNote,
  onRun,
  onHd,
  onApprove,
  onRequest,
  onOverride,
}: {
  lastAI?: AiReview
  aiLoading: boolean
  aiErr: string | null
  humanNote: string
  setHumanNote: (s: string) => void
  onRun: () => void
  onHd: (id: string, hd: 'accept' | 'reject' | 'discuss') => void
  onApprove: () => void
  onRequest: () => void
  onOverride: () => void
}) {
  const sc = lastAI?.score ?? 0
  const scC = sc >= 80 ? '#3fb950' : sc >= 60 ? '#d29922' : '#f85149'
  const gr = sc >= 90 ? 'A' : sc >= 80 ? 'B' : sc >= 70 ? 'C' : sc >= 60 ? 'D' : 'F'

  return (
    <div>
      <div className={styles.rowBetween}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}><IconLabel name="bot" size={14}>AI 코드 리뷰</IconLabel></div>
          <div style={{ fontSize: 11, color: '#8b949e' }}>
            AI가 코드를 분석하고 사람이 최종 검토합니다
          </div>
        </div>
        <button type="button" className={styles.btnPrimary} disabled={aiLoading} onClick={onRun}>
          {aiLoading ? '분석 중...' : lastAI ? <IconLabel name="bot" size={12}>AI 재분석</IconLabel> : <IconLabel name="bot" size={12}>AI 분석 시작</IconLabel>}
        </button>
      </div>

      {aiLoading && (
        <div style={{ padding: 50, textAlign: 'center', color: '#8b949e' }}>
          <div className="big-sp blue" style={{ margin: '0 auto 14px' }} />
          AI 분석 중...
        </div>
      )}
      {aiErr && (
        <div className={styles.card}>
          <div className={styles.cardBody} style={{ color: '#f85149' }}>
            <IconLabel name="xCircle" size={12}>{aiErr}</IconLabel>
          </div>
        </div>
      )}
      {!aiLoading && !lastAI && !aiErr && (
        <div
          style={{
            border: '2px dashed #30363d',
            borderRadius: 10,
            padding: 50,
            textAlign: 'center',
            color: '#8b949e',
          }}
        >
          <div style={{ opacity: 0.35, marginBottom: 12 }}><Icon name="bot" size={42} /></div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 8 }}>
            AI 분석을 시작하세요
          </div>
          버그 · 성능 · 스타일 · 보안을 자동으로 분석합니다
        </div>
      )}
      {!aiLoading && lastAI && (
        <>
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <div className={styles.aiScore}>
                <div
                  className={styles.gradeBox}
                  style={{ color: scC, borderColor: scC, background: `${scC}22` }}
                >
                  {gr}
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: scC }}>
                    {sc}
                    <span style={{ fontSize: 14, color: '#8b949e' }}> / 100</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#8b949e' }}>
                    {new Date(lastAI.createdAt).toLocaleString('ko-KR')} · {lastAI.model}
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: '#0d1117',
                  borderRadius: 6,
                  padding: '10px 12px',
                  borderLeft: '3px solid #bc8cff',
                  fontSize: 11,
                  lineHeight: 1.6,
                  marginBottom: 10,
                }}
              >
                {lastAI.summary}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 10 }}>
                <span style={{ color: '#8b949e' }}>사람 검토:</span>
                <span style={{ color: '#3fb950' }}>
                  <IconLabel name="check" size={10}>수락 {lastAI.items.filter((i) => i.hd === 'accept').length}</IconLabel>
                </span>
                <span style={{ color: '#f85149' }}>
                  <IconLabel name="x" size={10}>무시 {lastAI.items.filter((i) => i.hd === 'reject').length}</IconLabel>
                </span>
                <span style={{ color: '#d29922' }}>
                  <IconLabel name="message" size={10}>논의 {lastAI.items.filter((i) => i.hd === 'discuss').length}</IconLabel>
                </span>
              </div>
            </div>
          </div>

          {lastAI.items.map((item) => {
            const sevC =
              item.severity === 'error'
                ? '#f85149'
                : item.severity === 'warning'
                  ? '#d29922'
                  : item.severity === 'suggestion'
                    ? '#bc8cff'
                    : '#58a6ff'
            return (
              <div
                key={item.id}
                className={styles.aiItem}
                style={{ borderLeft: `3px solid ${sevC}` }}
              >
                <div
                  className={styles.aiItemHead}
                  style={{ background: `${sevC}0d` }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{item.title}</span>
                    <span
                      style={{
                        fontSize: 9,
                        padding: '1px 7px',
                        borderRadius: 8,
                        background: `${sevC}22`,
                        color: sevC,
                      }}
                    >
                      {item.severity || 'info'}
                    </span>
                  </div>
                  {item.line != null && (
                    <span style={{ fontSize: 9, color: '#8b949e' }}>Line {item.line}</span>
                  )}
                </div>
                <div className={styles.aiItemBody}>
                  <div style={{ fontSize: 11, color: '#8b949e', lineHeight: 1.6 }}>
                    {item.description}
                  </div>
                  {item.suggestion && (
                    <pre
                      style={{
                        background: '#0d1117',
                        borderRadius: 5,
                        padding: 8,
                        fontFamily: 'var(--mono)',
                        fontSize: 10.5,
                        color: '#a5d6ff',
                        whiteSpace: 'pre',
                        overflowX: 'auto',
                        marginTop: 8,
                      }}
                    >
                      {item.suggestion}
                    </pre>
                  )}
                  <div className={styles.hdBtns}>
                    <span style={{ fontSize: 10, color: '#8b949e' }}><IconLabel name="user" size={10}>검토:</IconLabel></span>
                    {(
                      [
                        ['accept', 'check', '수락', '#3fb950'],
                        ['reject', 'x', '무시', '#f85149'],
                        ['discuss', 'message', '논의', '#d29922'],
                      ] as const
                    ).map(([k, ic, label, color]) => (
                      <button
                        key={k}
                        type="button"
                        className={`${styles.hdBtn} ${item.hd === k ? styles.hdOn : ''}`}
                        style={
                          item.hd === k
                            ? {
                                color,
                                borderColor: `${color}66`,
                                background: `${color}22`,
                              }
                            : undefined
                        }
                        onClick={() => onHd(item.id, k)}
                      >
                        <IconLabel name={ic} size={10}>{label}</IconLabel>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}

          <div className={styles.card}>
            <div className={styles.cardBody}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                <IconLabel name="user" size={13}>사람 최종 검토 · 결정</IconLabel>
              </div>
              <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 12 }}>
                AI 피드백을 검토한 후 최종 의견을 남겨주세요
              </div>
              <textarea
                className={styles.commentTa}
                style={{ minHeight: 70, marginBottom: 10 }}
                placeholder="설계 의도 / 도메인 맥락 / 팀 컨벤션 / 리스크 판단..."
                value={humanNote}
                onChange={(e) => setHumanNote(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className={styles.btnPrimary} onClick={onApprove}>
                  <IconLabel name="check" size={12}>검토 완료 · 승인</IconLabel>
                </button>
                <button type="button" className={styles.btnGhost} onClick={onRequest}>
                  <IconLabel name="refresh" size={12}>수정 요청</IconLabel>
                </button>
                <button type="button" className={styles.btnDanger} onClick={onOverride}>
                  <IconLabel name="zap" size={12}>AI 무시 · 강제 승인</IconLabel>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ── AI Hub ── */
function AiHubView({
  cs,
  repo,
  persist,
  needKey,
  onModelChange,
  onOpenPr,
}: {
  cs: CollabState
  repo: Repo
  persist: (s: CollabState) => void
  needKey: () => boolean
  onModelChange?: (label: string) => void
  onOpenPr: (id: string) => void
}) {
  const prs = cs.prs.filter((p) => p.repoId === repo.id)
  const [busyId, setBusyId] = useState<string | null>(null)

  return (
    <div className={styles.wrap}>
      <div style={{ marginBottom: 20 }}>
        <h2 className={styles.h2} style={{ marginBottom: 4 }}>
          <IconLabel name="bot" size={16}>AI + 사람 하이브리드 리뷰</IconLabel>
        </h2>
        <p style={{ fontSize: 11, color: '#8b949e' }}>
          AI가 먼저 분석하고, 사람이 최종 판단하는 2-Step 리뷰 시스템
        </p>
      </div>

      <div className={styles.card} style={{ marginBottom: 20 }}>
        <div className={styles.cardBody}>
          <div className={styles.flow}>
            {[
              ['bot', 'AI 제안', '#bc8cff'],
              ['user', 'Dev 검토', '#58a6ff'],
              ['checkCircle', 'Approve', '#3fb950'],
              ['sparkles', '병합', '#d29922'],
            ].map(([ico, title, color], i) => (
              <div key={title as string} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <div className={styles.flowArrow}><Icon name="chevronRight" size={18} /></div>}
                <div
                  className={styles.flowStep}
                  style={{
                    background: `${color}14`,
                    borderColor: `${color}55`,
                    color: color as string,
                  }}
                >
                  <div style={{ marginBottom: 6 }}><Icon name={ico as IconName} size={22} /></div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
        <IconLabel name="clipboard" size={13}>PR별 AI 리뷰 현황</IconLabel>
      </div>
      {prs.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.cardBody} style={{ textAlign: 'center', color: '#8b949e' }}>
            PR이 없습니다
          </div>
        </div>
      ) : (
        prs.map((pr) => {
          const last = pr.aiReviews[pr.aiReviews.length - 1]
          const app = pr.approvals.length
          const req = repo.mergeRules.minApprovals || 1
          return (
            <div key={pr.id} className={styles.card}>
              <div className={styles.cardBody}>
                <div className={styles.rowBetween} style={{ marginBottom: 0 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                      <StatusBadge status={pr.status} />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{pr.title}</span>
                    </div>
                    <div style={{ fontSize: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {last ? (
                        <>
                          <span style={{ color: '#3fb950' }}><IconLabel name="bot" size={10}>AI {last.score}/100</IconLabel></span>
                          <span style={{ color: app >= req ? '#3fb950' : '#d29922' }}>
                            <IconLabel name="user" size={10}>승인 {app}/{req}</IconLabel>
                          </span>
                        </>
                      ) : (
                        <span style={{ color: '#d29922' }}><IconLabel name="bot" size={10}>AI 미분석</IconLabel></span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {pr.status === 'open' && (
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        disabled={busyId === pr.id}
                        onClick={async () => {
                          if (needKey()) return
                          setBusyId(pr.id)
                          try {
                            const ai = await runPrAiReview(pr, onModelChange)
                            let next = updatePR(cs, pr.id, (p) => ({
                              ...p,
                              aiReviews: [...p.aiReviews, ai],
                              activity: [
                                ...p.activity,
                                {
                                  type: 'ai_reviewed',
                                  author: 'AI',
                                  desc: `AI 분석 완료 · 점수: ${ai.score}`,
                                  time: Date.now(),
                                },
                              ],
                            }))
                            next = addLog(
                              next,
                              repo.id,
                              'ai_reviewed',
                              'AI',
                              `PR AI 분석: ${pr.title}`,
                            )
                            persist(next)
                          } catch (e) {
                            alert(e instanceof Error ? e.message : '실패')
                          } finally {
                            setBusyId(null)
                          }
                        }}
                      >
                        {busyId === pr.id ? '…' : last ? <IconLabel name="bot" size={10}>재분석</IconLabel> : <IconLabel name="bot" size={10}>AI 분석</IconLabel>}
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.btnGhost}
                      onClick={() => onOpenPr(pr.id)}
                    >
                      PR 보기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

function ActivityView({ cs, repo }: { cs: CollabState; repo: Repo }) {
  const acts = cs.log
    .filter((a) => a.repoId === repo.id)
    .slice()
    .reverse()
  return (
    <div className={styles.wrap}>
      <h2 className={styles.h2} style={{ marginBottom: 16 }}>
        <IconLabel name="chart" size={16}>활동 로그</IconLabel>
      </h2>
      <div className={styles.card}>
        <div className={styles.cardBody}>
          {acts.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#8b949e' }}>
              활동 없음
            </div>
          ) : (
            acts.map((a) => (
              <div key={a.id} className={styles.logRow}>
                <div
                  className={styles.logDot}
                  style={{ background: LOG_CLR[a.type] || '#58a6ff' }}
                />
                <div style={{ flex: 1 }}>
                  <Avatar name={a.author} size={15} />{' '}
                  <strong style={{ color: '#e6edf3' }}>{a.author}</strong> {a.desc}
                </div>
                <span style={{ fontSize: 9 }}>{ago(a.time)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Modals ── */
function RepoModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, desc: string, members: string) => void
}) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [members, setMembers] = useState('')
  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.modalSm}`}>
        <div className={styles.modalHdr}>
          <IconLabel name="folder" size={13}>새 저장소 생성</IconLabel>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.field}>
            <label>저장소 이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-project"
            />
          </div>
          <div className={styles.field}>
            <label>설명</label>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="프로젝트 설명..."
            />
          </div>
          <div className={styles.field}>
            <label>멤버 추가 (쉼표 구분)</label>
            <input
              value={members}
              onChange={(e) => setMembers(e.target.value)}
              placeholder="alice, bob"
            />
          </div>
        </div>
        <div className={styles.modalFoot}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => {
              if (!name.trim()) {
                alert('저장소 이름을 입력해주세요.')
                return
              }
              onCreate(name.trim(), desc, members)
            }}
          >
            생성
          </button>
        </div>
      </div>
    </div>
  )
}

function PrCreateModal({
  repo,
  branches,
  defaultSrc,
  onClose,
  onCreate,
}: {
  repo: Repo
  branches: { name: string; isDefault: boolean }[]
  defaultSrc?: string
  onClose: () => void
  onCreate: (data: {
    title: string
    desc: string
    src: string
    tgt: string
    reviewers: string[]
    before: string
    after: string
  }) => void
}) {
  const def = branches.find((b) => b.isDefault)?.name || 'main'
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [src, setSrc] = useState(defaultSrc || branches.find((b) => !b.isDefault)?.name || def)
  const [tgt, setTgt] = useState(def)
  const [before, setBefore] = useState('')
  const [after, setAfter] = useState('')
  const [revs, setRevs] = useState<Record<string, boolean>>({})

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHdr}>
          <IconLabel name="gitMerge" size={13}>Pull Request 생성</IconLabel>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.field}>
            <label>제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="PR 제목 입력..."
            />
          </div>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>소스 브랜치</label>
              <select value={src} onChange={(e) => setSrc(e.target.value)}>
                {branches.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>대상 브랜치</label>
              <select value={tgt} onChange={(e) => setTgt(e.target.value)}>
                {branches.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label>설명</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>리뷰어 지정</label>
            <div className={styles.revList}>
              {repo.members
                .filter((m) => m !== ME)
                .map((m) => (
                  <label key={m} className={styles.revItem}>
                    <input
                      type="checkbox"
                      checked={!!revs[m]}
                      onChange={(e) =>
                        setRevs((r) => ({ ...r, [m]: e.target.checked }))
                      }
                    />
                    <Avatar name={m} size={18} /> {m}
                  </label>
                ))}
            </div>
          </div>
          <div className={styles.field}>
            <label>소스 코드 (before)</label>
            <textarea
              className={styles.mono}
              value={before}
              onChange={(e) => setBefore(e.target.value)}
              placeholder="변경 전 코드..."
            />
          </div>
          <div className={styles.field}>
            <label>변경 후 코드 (after)</label>
            <textarea
              className={styles.mono}
              value={after}
              onChange={(e) => setAfter(e.target.value)}
              placeholder="변경 후 코드..."
            />
          </div>
        </div>
        <div className={styles.modalFoot}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => {
              if (!title.trim()) {
                alert('PR 제목을 입력해주세요.')
                return
              }
              onCreate({
                title: title.trim(),
                desc,
                src,
                tgt,
                reviewers: Object.keys(revs).filter((k) => revs[k]),
                before,
                after,
              })
            }}
          >
            PR 생성
          </button>
        </div>
      </div>
    </div>
  )
}
