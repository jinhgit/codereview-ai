export type Lang =
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'java'
  | 'c'
  | 'cpp'
  | 'go'
  | 'rust'
  | 'sql'

export type Severity = 'error' | 'warning' | 'info' | 'success'

export type ReviewItem = {
  severity?: Severity
  title?: string
  description?: string
  suggestion?: string
}

export type ScoreDetail = {
  reason?: string
  problems?: string[]
  tips?: { title?: string; desc?: string; code?: string }[]
}

export type ReviewResult = {
  scores?: {
    total?: number
    style?: number
    performance?: number
    safety?: number
    readability?: number
    grade?: string
    summary?: string
  }
  score_details?: Record<string, ScoreDetail>
  style?: ReviewItem[]
  complexity?: {
    time?: string
    space?: string
    rating?: 'good' | 'ok' | 'bad' | string
    explanation?: string
    items?: ReviewItem[]
  }
  bugs?: ReviewItem[]
  refactoring?: ReviewItem[]
  algorithms?: ReviewItem[]
  datastructures?: ReviewItem[]
}

export type FixError = {
  type?: string
  line?: number
  original?: string
  problem?: string
  fix?: string
  fixed_code?: string
}

export type FixResult = {
  has_errors?: boolean
  error_count?: number
  summary?: string
  errors?: FixError[]
  fixed_full_code?: string
}

export type OptimizeResult = {
  summary?: string
  score_before?: number
  score_after?: number
  changes?: { type?: string; title?: string; detail?: string }[]
  optimized_code?: string
}

export type ExecResult = {
  ok: boolean
  stdout: string
  stderr: string
  compileStdout: string
  compileStderr: string
  exitCode: number
  elapsed: string
  language: string
  error?: string
}

export type RightTab = 'review' | 'fix'
export type StatusKind = 'ready' | 'analyzing' | 'fixing' | 'running' | 'error'

export const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
]
