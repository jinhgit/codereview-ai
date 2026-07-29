export type MergeRules = {
  requireApproval: boolean
  minApprovals: number
  requireCI: boolean
  deleteBranch: boolean
}

export type Repo = {
  id: string
  name: string
  desc: string
  owner: string
  members: string[]
  color: string
  emoji: string
  mergeRules: MergeRules
  createdAt: number
}

export type Branch = {
  id: string
  repoId: string
  name: string
  isDefault: boolean
  author: string
  commits: number
  lastCommit: string
  updatedAt: number
}

export type ReactionMap = Record<string, string[]>

export type PrComment = {
  id: string
  lineNum: number
  content: string
  author: string
  reactions: ReactionMap
  createdAt: number
}

export type PrActivity = {
  type: string
  author: string
  desc: string
  time: number
}

export type AiReviewItem = {
  id: string
  category?: string
  severity?: string
  title?: string
  description?: string
  line?: number | null
  suggestion?: string
  hd?: 'accept' | 'reject' | 'discuss' | ''
}

export type AiReview = {
  id: string
  model: string
  score: number
  bugScore: number
  perfScore: number
  styleScore: number
  secScore: number
  testScore: number
  summary: string
  items: AiReviewItem[]
  humanApproved: boolean
  createdAt: number
}

export type PullRequest = {
  id: string
  repoId: string
  title: string
  desc: string
  src: string
  tgt: string
  author: string
  reviewers: string[]
  status: 'open' | 'merged' | 'closed'
  approvals: string[]
  before: string
  after: string
  comments: PrComment[]
  activity: PrActivity[]
  aiReviews: AiReview[]
  createdAt: number
}

export type ActivityLog = {
  id: string
  repoId: string
  type: string
  author: string
  desc: string
  time: number
}

export type CollabState = {
  repos: Repo[]
  branches: Branch[]
  prs: PullRequest[]
  log: ActivityLog[]
}

export type CollabView = 'overview' | 'branches' | 'prs' | 'activity' | 'aireview'
export type PrSubTab = 'diff' | 'desc' | 'review' | 'aireview' | 'log'

export type DiffLine = { t: 'add' | 'del' | 'ctx'; text: string }

export const ME = 'me'
