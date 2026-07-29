# CodeReview AI — Web Client

Vite + React + TypeScript 웹 클라이언트입니다.

## 1차 구현 범위

| 기능 | 상태 |
|------|------|
| Groq API Key (sessionStorage) | ✅ |
| 코드 에디터 · 샘플 · 언어 자동 감지 | ✅ |
| AI 코드 리뷰 | ✅ |
| AI 오류 수정 · 에디터 적용 | ✅ |
| 코드 실행 (Piston) | ✅ |
| 60점 미만 AI 최적화 모달 | ✅ |
| 챗봇 (프로젝트/세션 · 에디터 컨텍스트) | ✅ |
| GitHub 파일 로드 | ✅ |
| 협업 PR / AI 하이브리드 | ✅ |
| BFF 프록시 | ✅ (`/api` → server:8787) |
| Toast · BFF 상태 뱃지 · UI 폴리시 | ✅ |

## 실행

BFF를 먼저 띄운 뒤 프론트를 실행하세요.

```bash
# server/
cp .env.example .env   # GROQ_API_KEY 설정
npm run dev            # :8787

# web/
npm install
npm run dev            # :5173, proxy /api → BFF
```

```bash
npm run build
npm run preview
```

## 구조

- `src/components` — UI · Toast · Collab
- `src/services/apiClient.ts` — BFF 호출
- `src/services` — review/fix/chat/execute/github 래퍼
- `src/types` · `utils` · `data` — 타입, 파서, 샘플

상세 제품 명세는 저장소 루트 `docs/` PDF와 루트 `README.md`를 참고하세요.
