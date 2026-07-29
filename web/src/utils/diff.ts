import type { DiffLine } from '../types/collab'

/** LCS 기반 unified diff (프로토타입과 동일) */
export function computeDiff(before: string, after: string): DiffLine[] {
  const bL = before.split('\n')
  const aL = after.split('\n')
  const M = bL.length
  const N = aL.length
  const dp: number[][] = Array.from({ length: M + 1 }, () =>
    new Array(N + 1).fill(0),
  )
  for (let i = 1; i <= M; i++) {
    for (let j = 1; j <= N; j++) {
      dp[i][j] =
        bL[i - 1] === aL[j - 1]
          ? dp[i - 1][j - 1] + 1
          : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  const res: DiffLine[] = []
  let ii = M
  let jj = N
  while (ii > 0 || jj > 0) {
    if (ii > 0 && jj > 0 && bL[ii - 1] === aL[jj - 1]) {
      res.unshift({ t: 'ctx', text: bL[ii - 1] })
      ii--
      jj--
    } else if (jj > 0 && (ii === 0 || dp[ii][jj - 1] >= dp[ii - 1][jj])) {
      res.unshift({ t: 'add', text: aL[jj - 1] })
      jj--
    } else {
      res.unshift({ t: 'del', text: bL[ii - 1] })
      ii--
    }
  }
  return res
}
