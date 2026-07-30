import { copyText } from '../hooks/useClipboard'
import type { ExecResult } from '../types'
import { Icon, IconLabel } from './icons'
import styles from './ExecPanel.module.css'

type Props = {
  open: boolean
  running: boolean
  stdin: string
  result: ExecResult | null
  onStdin: (v: string) => void
  onClose: () => void
  onClear: () => void
}

export function ExecPanel({
  open,
  running,
  stdin,
  result,
  onStdin,
  onClose,
  onClear,
}: Props) {
  let statusCls = styles.idle
  let statusTxt = '대기'
  if (running) {
    statusCls = styles.running
    statusTxt = '실행 중'
  } else if (result) {
    if (result.error || !result.ok) {
      statusCls = styles.error
      statusTxt = result.error ? '실패' : '오류'
    } else {
      statusCls = styles.success
      statusTxt = '완료'
    }
  }

  return (
    <div className={`${styles.panel} ${open ? styles.open : styles.closed}`}>
      <div className={styles.hdr}>
        <div className={styles.hdrLeft}>
          <span className={styles.icon}>
            <Icon name="play" size={11} />
          </span>
          <span className={styles.title}>실행 결과</span>
          <span className={`${styles.status} ${statusCls}`}>
            <IconLabel
              name={running ? 'loader' : result?.ok ? 'check' : result ? 'x' : 'circle'}
              size={10}
            >
              {statusTxt}
            </IconLabel>
          </span>
          {result?.elapsed && <span className={styles.time}>{result.elapsed}s</span>}
        </div>
        <div className={styles.hdrRight}>
          <button
            type="button"
            className={styles.tool}
            title="결과 복사"
            onClick={() => {
              if (!result) return
              const parts = [
                result.compileStderr && `컴파일 오류:\n${result.compileStderr}`,
                result.stdout && `출력:\n${result.stdout}`,
                result.stderr && `오류:\n${result.stderr}`,
                result.error && result.error,
              ].filter(Boolean)
              void copyText(parts.join('\n\n'))
            }}
          >
            <Icon name="copy" size={13} />
          </button>
          <button type="button" className={styles.tool} title="지우기" onClick={onClear}>
            <Icon name="trash" size={13} />
          </button>
          <button type="button" className={styles.tool} title="닫기" onClick={onClose}>
            <Icon name="x" size={13} />
          </button>
        </div>
      </div>

      <div className={styles.stdin}>
        <label className={styles.stdinLabel} htmlFor="stdin-input">
          stdin
        </label>
        <input
          id="stdin-input"
          className={styles.stdinInput}
          placeholder="표준 입력값 (input() 등에 사용)"
          value={stdin}
          onChange={(e) => onStdin(e.target.value)}
        />
      </div>

      <div className={styles.output}>
        {running && (
          <div className={styles.loading}>
            <div className={styles.outSpin} />
            <div>
              <div className={styles.loadTitle}>컴파일 및 실행 중...</div>
              <div className={styles.loadSub}>Judge0 / 실행 엔진에 요청 중</div>
            </div>
          </div>
        )}

        {!running && !result && (
          <span className={styles.outEmpty}>
            <IconLabel name="play" size={12}>
              실행 버튼을 누르면 여기에 결과가 출력됩니다
            </IconLabel>
          </span>
        )}

        {!running && result?.error && (
          <div className={`${styles.section} ${styles.sectionErr}`}>
            <div className={styles.secTitle}>
              <IconLabel name="xCircle" size={11}>
                실행 실패
              </IconLabel>
            </div>
            <div className={`${styles.secBody} ${styles.stderr}`}>{result.error}</div>
          </div>
        )}

        {!running && result && !result.error && (
          <>
            {result.compileStderr && (
              <div className={`${styles.section} ${styles.sectionWarn}`}>
                <div className={styles.secTitle}>
                  <IconLabel name="alert" size={11}>
                    컴파일 오류
                  </IconLabel>
                </div>
                <div className={`${styles.secBody} ${styles.stderr}`}>
                  {result.compileStderr}
                </div>
              </div>
            )}
            {result.compileStdout && (
              <div className={styles.section}>
                <div className={styles.secTitle}>
                  <IconLabel name="clipboard" size={11}>
                    컴파일 출력
                  </IconLabel>
                </div>
                <div className={`${styles.secBody} ${styles.stdout}`}>
                  {result.compileStdout}
                </div>
              </div>
            )}
            {result.stdout && (
              <div
                className={`${styles.section} ${result.ok ? styles.sectionOk : styles.sectionErr}`}
              >
                <div className={styles.secTitle}>
                  <IconLabel name={result.ok ? 'checkCircle' : 'xCircle'} size={11}>
                    실행 결과
                  </IconLabel>
                </div>
                <div className={`${styles.secBody} ${styles.stdout}`}>{result.stdout}</div>
              </div>
            )}
            {result.stderr && (
              <div className={`${styles.section} ${styles.sectionErr}`}>
                <div className={styles.secTitle}>
                  <IconLabel name="xCircle" size={11}>
                    런타임 오류
                  </IconLabel>
                </div>
                <div className={`${styles.secBody} ${styles.stderr}`}>{result.stderr}</div>
              </div>
            )}
            {!result.stdout && !result.stderr && !result.compileStderr && (
              <div className={styles.emptyResult}>
                <Icon
                  name={result.ok ? 'checkCircle' : 'xCircle'}
                  size={20}
                  style={{ color: result.ok ? 'var(--gn)' : 'var(--rd)' }}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {result.ok ? '정상 종료' : '오류 종료'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--tx2)' }}>출력 없음</div>
                </div>
              </div>
            )}
            <div className={styles.footer}>
              <Icon
                name="circleDot"
                size={10}
                style={{ color: result.ok ? 'var(--gn)' : 'var(--rd)' }}
              />
              종료 코드 <strong>{result.exitCode}</strong>
              &nbsp;·&nbsp;
              <span className={styles.badge}>{result.language}</span>
              &nbsp;·&nbsp; {result.elapsed}s
            </div>
          </>
        )}
      </div>
    </div>
  )
}
