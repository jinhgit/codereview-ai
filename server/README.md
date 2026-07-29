# CodeReview AI — BFF

Express 기반 Backend-for-Frontend.

## 역할

- Groq / Piston / GitHub 요청 프록시
- 프롬프트·모델 폴백·JSON 파싱 서버 측 처리
- `GROQ_API_KEY` 서버 보관 (브라우저 노출 최소화)
- Rate limit · Helmet · CORS · 입력 크기 제한

## 실행

```bash
cd server
cp .env.example .env
# .env 에 GROQ_API_KEY=gsk_... 설정
npm install
npm run dev
# → http://localhost:8787
```

## 주요 API

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/health` | 헬스체크 |
| GET | `/api/v1/config` | `hasServerKey`, `allowClientKey` |
| POST | `/api/v1/ai/review` | 코드 리뷰 |
| POST | `/api/v1/ai/fix` | 오류 수정 |
| POST | `/api/v1/ai/optimize` | 최적화 |
| POST | `/api/v1/ai/chat` | 챗봇 |
| POST | `/api/v1/ai/pr-review` | PR AI 리뷰 |
| POST | `/api/v1/execute` | Piston 실행 |
| GET | `/api/v1/execute/runtimes` | 런타임 목록 |
| POST | `/api/v1/github/fetch` | GitHub raw 로드 |

### 인증

1. **권장**: 서버 `GROQ_API_KEY`
2. **개발 폴백**: `ALLOW_CLIENT_KEY=true` 이고 서버 키가 없을 때 클라이언트 `X-Groq-Key` 헤더 허용

에러 포맷:

```json
{ "error": { "code": "HTTP_ERROR", "message": "..." } }
```
