# CodeReview AI — 컨텍스트 핸드오프 문서

> **목적**: 세션 전환·컨텍스트 스위칭 시 프로젝트 상태와 결정 사항을 빠르게 복구하기 위한 문서  
> **최종 갱신**: 2026-07-30  
> **저장소**: https://github.com/jinhgit/codereview-ai  
> **브랜치**: `main`

---

## 1. 한 줄 요약

**CodeReview AI** = 브라우저에서 코드 **리뷰 · 오류 수정 · 실행 · 챗 · GitHub 로드 · PR 협업(하이브리드 AI)** 를 하는 앱.

- **현재 본체**: `web/` (Vite + React 19 + TypeScript)
- **BFF**: `server/` (Express + TS) — Groq 키 서버 보관·프록시
- **단일 HTML**: `codereview-ai.html` — `web/` 최종본 번들 (수동 수정 금지, 빌드로 생성)
- **레거시 아님**: 예전 Vanilla 프로토타입 내용은 이미 단일 HTML로 교체됨

---

## 2. 지금까지 한 일 (시간순)

| 단계 | 내용 | 비고 |
|------|------|------|
| 0 | 단일 `codereview-ai.html` 프로토타입 학습 | Vanilla JS, Groq 직접 호출, Piston, 협업 localStorage |
| 1 | PRD · 기능명세 · API명세 PDF | `docs/CodeReview_AI_PRD_기능명세서_API명세서.pdf` |
| 2 | Git 초기화 + GitHub push | `jinhgit/codereview-ai` |
| 3 | README 상세 작성 | 아키텍처·스택·로드맵 |
| 4 | **Vite+React+TS** 웹 이식 | 핵심 루프: 에디터·리뷰·수정·실행·최적화 |
| 5 | 챗봇 | 프로젝트/세션, 에디터 컨텍스트, `cr_chats_v3` |
| 6 | GitHub 파일 로드 | raw URL 변환, 토큰 옵션 |
| 7 | 협업 패널 | 저장소·브랜치·PR·Diff·AI 하이브리드, `codereview_collab_v2` |
| 8 | **BFF** | `/api/v1/*`, rate limit, 서버 `GROQ_API_KEY` |
| 9 | UI 개선 | Toast, BFF/Server Key 뱃지, 포커스·그라데이션 |
| 10 | **이모지 → 선형 SVG** | `web/src/components/icons/` |
| 11 | HTML = web 최종 번들 | `vite-plugin-singlefile` + `build:html` |
| 12 | **실행 엔진 수정** | emkc Piston 화이트리스트 차단 → **Judge0 CE** |

---

## 3. 로컬 실행 방법

### 권장 (BFF + 웹)

```bash
# 의존성 (최초)
cd /Users/macbook/Desktop/SoloProject/codereview-ai
npm run install:all

# 터미널 1 — BFF
cd server
cp .env.example .env   # GROQ_API_KEY=gsk_... 설정
npm run dev            # http://localhost:8787

# 터미널 2 — 웹
cd web
npm run dev            # http://localhost:5173  (/api → 8787 프록시)
```

브라우저: **http://localhost:5173**

### 단일 HTML

```bash
# 재생성
npm run build:html --prefix web
# → 루트 codereview-ai.html

python3 -m http.server 8080
# http://localhost:8080/codereview-ai.html
```

- BFF 있음 → `/api` 사용  
- BFF 없음 → 브라우저에서 Groq/Judge0 직접 호출 (sessionStorage API Key)

### 환경 변수 (server/.env)

| 변수 | 의미 |
|------|------|
| `GROQ_API_KEY` | 서버 보관 Groq 키 (권장) |
| `PORT` | 기본 8787 |
| `CORS_ORIGIN` | 기본 `http://localhost:5173` |
| `ALLOW_CLIENT_KEY` | 서버 키 없을 때 `X-Groq-Key` 허용 |
| `JUDGE0_URL` | 기본 `https://ce.judge0.com` |
| `PISTON_URL` | 자체 Piston만 (emkc 공개 API 사용 불가) |

---

## 4. 아키텍처 (As-Is)

```
Browser (web/ or codereview-ai.html)
  ├─ UI: React + CSS Modules + 선형 SVG Icon
  ├─ 상태: React state + localStorage/sessionStorage
  └─ API
       ├─ 우선: BFF http://localhost:8787/api/v1/*
       │         ├─ /ai/review|fix|optimize|chat|pr-review  → Groq
       │         ├─ /execute                                  → Judge0 (fallback Wandbox)
       │         └─ /github/fetch                             → raw.githubusercontent.com
       └─ 폴백 (BFF 다운 시): 브라우저 → Groq / Judge0 직접
```

### 저장소 키

| Key | 위치 | 용도 |
|-----|------|------|
| `groq_key` | sessionStorage | 클라이언트 폴백 API 키 |
| `cr_chats_v3` | localStorage | 챗봇 프로젝트/세션 |
| `codereview_collab_v2` | localStorage | 협업 시뮬 데이터 |

---

## 5. 디렉터리 구조

```
codereview-ai/
├── README.md
├── package.json                 # monorepo scripts (install:all, build:html, …)
├── codereview-ai.html           # ⚠️ 빌드 산출물 (web 최종본 번들)
├── docs/
│   ├── CONTEXT_HANDOFF.md       # ← 이 문서
│   ├── CodeReview_AI_PRD_기능명세서_API명세서.pdf
│   └── generate_specs.py
├── server/                      # BFF
│   ├── .env.example
│   ├── src/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── prompts.ts
│   │   ├── middleware/ (auth, error)
│   │   ├── routes/ (ai, execute, github)
│   │   └── services/ (groq, executeEngine)
│   └── README.md
└── web/                         # 본체 프론트
    ├── package.json
    ├── vite.config.ts           # proxy /api, singlefile 빌드
    ├── scripts/export-html.mjs  # dist → 루트 codereview-ai.html
    └── src/
        ├── App.tsx
        ├── components/          # UI + collab/ + icons/
        ├── services/
        │   ├── apiClient.ts     # BFF 호출 + health
        │   ├── executeEngine.ts # Judge0/Wandbox
        │   ├── ai.ts / chatAi.ts / prAi.ts
        │   ├── standalone.ts    # BFF 없을 때 직접 호출
        │   ├── chatStore.ts / collabStore.ts
        │   └── keyStore.ts
        ├── types/
        ├── utils/
        └── data/samples.ts
```

---

## 6. 핵심 기능 체크리스트

| 기능 | 상태 | 진입점 |
|------|------|--------|
| API Key (세션/서버) | ✅ | KeyBanner / `GROQ_API_KEY` |
| 코드 에디터 · 샘플 · 언어 | ✅ | Editor 탭 |
| AI 코드 리뷰 (점수·4축·섹션) | ✅ | 코드 리뷰 버튼 |
| AI 오류 수정 · 에디터 적용 | ✅ | 오류 수정 탭 |
| 60점 미만 자동 최적화 | ✅ | 리뷰 결과 버튼 |
| 코드 실행 | ✅ | **Judge0 CE** (구 Piston 공개 API 폐기) |
| 챗봇 · 프로젝트/세션 | ✅ | Chat 탭 |
| GitHub 파일 로드 | ✅ | GitHub 탭 |
| 협업 PR · Diff · AI 하이브리드 | ✅ | 헤더 협업 (로컬 시뮬레이션) |
| 선형 SVG 아이콘 | ✅ | `components/icons` |
| BFF | ✅ | `server/` |
| 단일 HTML 배포 | ✅ | `npm run build:html` |

---

## 7. 중요 결정 · 이슈 (나중에 헷갈리기 쉬운 것)

### 7.1 코드 실행 (2026-07 수정)

- **문제**: `https://emkc.org/api/v2/piston/execute` 가 **화이트리스트 전용** (2026-02-15~)
- **해결**: **Judge0 CE** (`https://ce.judge0.com`) 기본 사용
- **요청 시** `User-Agent` 필요 (없으면 403 나는 경우 있음)
- language_id 예: python=100, js=93, ts=94, java=91, c=103, cpp=105, go=106, rust=108, sql=82
- 폴백: Wandbox (일부 언어), 자체 `PISTON_URL`

### 7.2 언어 자동 감지 vs 실행

- 짧은 코드가 잘못 python 등으로 감지되면 실행 실패 가능
- **현재**: 실행 시 **사용자가 선택한 언어 우선** (`App.tsx` handleRun)

### 7.3 아이콘

- UI 이모지 전면 제거 → **stroke 선형 SVG**
- `Icon` / `IconLabel` (`web/src/components/icons/`)
- 협업 리액션 데이터 키는 호환을 위해 `👍` 등 유지, **표시만 SVG**

### 7.4 단일 HTML

- **소스 오브 트루스 = `web/`**
- `codereview-ai.html`은 `npm run build:html --prefix web` 산출물
- 손으로 HTML 수정하지 말 것

### 7.5 협업

- 백엔드 없는 **localStorage 시뮬레이션** (`ME = 'me'`)
- 실 Git/실시간 멀티유저 아님

### 7.6 커밋 메시지 규칙 (사용자 요청)

- 기능/큰 변화 시 **commit + push**
- **기본 한국어**, 영문이 자연스러울 때만 영어

---

## 8. BFF API 요약

| Method | Path | 용도 |
|--------|------|------|
| GET | `/api/v1/health` | 헬스 |
| GET | `/api/v1/config` | hasServerKey, allowClientKey |
| POST | `/api/v1/ai/review` | 코드 리뷰 |
| POST | `/api/v1/ai/fix` | 오류 수정 |
| POST | `/api/v1/ai/optimize` | 최적화 |
| POST | `/api/v1/ai/chat` | 챗봇 |
| POST | `/api/v1/ai/pr-review` | PR AI |
| POST | `/api/v1/execute` | 코드 실행 (Judge0) |
| GET | `/api/v1/execute/runtimes` | 지원 언어 |
| POST | `/api/v1/github/fetch` | GitHub raw |

에러 포맷: `{ "error": { "code", "message" } }`

---

## 9. 최근 커밋 (참고)

```
aecb1fa  build: 실행 엔진 수정 반영한 단일 HTML 재생성
585e9fd  fix: 코드 실행 엔진을 Judge0 CE로 교체
9b38788  build: codereview-ai.html을 web 최종본 단일 파일로 교체
bc3fc87  refactor: UI 이모지를 선형 SVG 아이콘으로 전면 교체
4ebcd23  feat: BFF 서버 도입 및 UI 개선
23b52d7  feat: GitHub 파일 로드 및 협업 패널 구현
52a6303  feat: 챗봇 구현 (프로젝트/세션 · 에디터 컨텍스트)
b360568  feat: Vite+React+TS 웹 앱 핵심 루프 구현
```

`git log --oneline` 으로 최신 확인.

---

## 10. 아직 안 한 것 (다음 후보)

우선순위 제안:

1. **배포** (Docker / Railway·Render + 정적 호스팅)
2. **로그인 + DB 영속** (채팅·협업 동기화)
3. **에디터 고도화** (Monaco/CodeMirror, 라인 연동)
4. **테스트** (BFF/실행 스모크)
5. **실 Git 협업** (현재는 로컬 시뮬)
6. 프로덕션에서 `ALLOW_CLIENT_KEY=false`

포트폴리오/로컬 데모 기준으로는 **핵심 기능은 완료** 상태.

---

## 11. 재개 시 체크리스트

```text
[ ] git pull
[ ] server/.env 에 GROQ_API_KEY 있는지
[ ] cd server && npm run dev
[ ] cd web && npm run dev
[ ] http://localhost:5173 접속
[ ] 헤더 ● BFF / 🔐 Server Key 확인
[ ] Python print 실행 → 출력 확인 (Judge0)
[ ] 코드 리뷰 1회 스모크
[ ] 이 문서(docs/CONTEXT_HANDOFF.md) 읽기
```

---

## 12. 관련 문서

| 파일 | 내용 |
|------|------|
| `README.md` | 사용자용 프로젝트 설명 |
| `docs/CodeReview_AI_PRD_기능명세서_API명세서.pdf` | PRD + 기능 + API 명세 |
| `docs/generate_specs.py` | PDF 재생성 (ReportLab, venv) |
| `server/README.md` | BFF 전용 |
| `web/README.md` | 프론트 기능 표 |
| **`docs/CONTEXT_HANDOFF.md`** | **이 문서 (인수인계)** |

---

## 13. 에이전트/개발자 메모

- 구현 범위 크게 잡을 때: **web 소스 수정 → 필요 시 BFF → `build:html`로 HTML 동기화 → commit/push**
- `codereview-ai.html`만 고치면 다음 빌드에 덮어씌워짐
- Groq 키를 클라이언트에 넣지 않으려면 반드시 BFF + `GROQ_API_KEY`
- Judge0 공개 인스턴스는 가용성·쿼터 변동 가능 → 장애 시 Wandbox/자체 Piston

---

*문서 끝. 컨텍스트 복구용. 기능 추가·아키텍처 변경 시 이 파일을 함께 갱신할 것.*
