export function reviewPrompt(lang: string, code: string): {
  system: string
  user: string
  jsonMode: boolean
} {
  return {
    system: '수석 소프트웨어 엔지니어. 순수 JSON만 반환.',
    jsonMode: true,
    user:
      `아래 ${lang} 코드를 분석하고 JSON만 반환하세요.\n코드:\`\`\`${lang}\n${code}\n\`\`\`\n` +
      `{"scores":{"total":0-100,"style":0-100,"performance":0-100,"safety":0-100,"readability":0-100,"grade":"A/B/C/D/F","summary":"한줄평가"},` +
      `"score_details":{"style":{"reason":"이유","problems":["문제"],"tips":[{"title":"팁","desc":"설명","code":""}]},` +
      `"performance":{"reason":"이유","problems":["문제"],"tips":[{"title":"팁","desc":"설명","code":""}]},` +
      `"safety":{"reason":"이유","problems":["문제"],"tips":[{"title":"팁","desc":"설명","code":""}]},` +
      `"readability":{"reason":"이유","problems":["문제"],"tips":[{"title":"팁","desc":"설명","code":""}]}},` +
      `"style":[{"severity":"info|warning|error","title":"제목","description":"설명","suggestion":"예시"}],` +
      `"complexity":{"time":"O(?)","space":"O(?)","rating":"good|ok|bad","explanation":"설명","items":[{"severity":"info","title":"제목","description":"설명"}]},` +
      `"bugs":[{"severity":"error","title":"제목","description":"설명","suggestion":"예시"}],` +
      `"refactoring":[{"severity":"warning","title":"제목","description":"설명","suggestion":"예시"}],` +
      `"algorithms":[{"severity":"info","title":"제목","description":"설명","suggestion":"예시"}],` +
      `"datastructures":[{"severity":"info","title":"제목","description":"설명","suggestion":"예시"}]}\n한국어,JSON만`,
  }
}

export function fixPrompt(lang: string, code: string) {
  return {
    system: '코드 오류 수정 전문가. 순수 JSON만 반환. 마크다운 절대 금지.',
    jsonMode: false,
    user:
      `아래 ${lang} 코드의 오류를 찾아 수정하세요. JSON만 반환.\n\n코드:\n${code}` +
      `\n\n형식: {"has_errors":true,"error_count":2,"summary":"요약","errors":[{"type":"SyntaxError","line":3,"original":"오류줄","problem":"문제설명","fix":"수정방법","fixed_code":"수정줄"}],"fixed_full_code":"수정된 전체 코드"}\n` +
      `오류없으면: {"has_errors":false,"error_count":0,"summary":"정상","errors":[],"fixed_full_code":"원본코드"}`,
  }
}

export function optimizePrompt(lang: string, code: string) {
  return {
    system: '수석 소프트웨어 엔지니어. 유효한 JSON만 반환. 마크다운 금지.',
    jsonMode: false,
    user:
      `아래 ${lang} 코드를 최적화해주세요.\n[원본]\n${code}\n[형식] JSON만. 마크다운 없음.\n` +
      `{"summary":"개선 요약","score_before":점수,"score_after":점수,"changes":[{"type":"fix","title":"제목","detail":"설명"}],"optimized_code":"최적화된 전체 코드"}\n` +
      `최적화: 보안취약점 제거, 하드코딩 제거, 성능개선, 스타일, 가독성, 한국어주석`,
  }
}

export function chatSystem(): string {
  return '전문 코드 AI 어시스턴트. 코드 요청 시 완전하고 실행 가능한 코드 제공. 마크다운 코드블록 사용. 한국어 답변. 한국어 주석.'
}

export function prReviewPrompt(title: string, before: string, after: string) {
  return {
    system: '코드 리뷰 전문 AI. 순수 JSON만 반환. 마크다운 금지.',
    jsonMode: false,
    user:
      `PR 코드 변경을 분석하고 JSON만 반환하세요. 마크다운 없음.\n\n` +
      `PR 제목: ${title}\n` +
      `변경 전:\n\`\`\`\n${before || '(없음)'}\n\`\`\`\n` +
      `변경 후:\n\`\`\`\n${after || '(없음)'}\n\`\`\`\n\n` +
      `{"score":0-100,"bugScore":0-100,"perfScore":0-100,"styleScore":0-100,"secScore":0-100,"testScore":0-100,` +
      `"summary":"AI 종합 평가 한 문장","items":[{"id":"1","category":"bug|performance|style|security|test",` +
      `"severity":"error|warning|info|suggestion","title":"제목","description":"설명",` +
      `"line":줄번호또는null,"suggestion":"개선코드또는빈문자열"}]}\n` +
      `items 2~6개, 실제 발견된 문제 위주, 한국어, JSON만 반환`,
  }
}
