# CodeReview AI

**AI 기반 코드 리뷰 · 오류 수정 · 실행 · 챗봇 · 협업 하이브리드 리뷰 플랫폼**

브라우저 한 화면에서 코드를 분석하고, 고치고, 실행하고, 대화하며, 팀 PR 워크플로까지 검증할 수 있는 프로토타입입니다.  
현재는 **단일 HTML SPA**로 동작하며, 정식 웹 서비스로 확장하기 위한 제품 문서(PRD / 기능명세 / API명세)를 함께 제공합니다.

| 항목 | 내용 |
|------|------|
| 상태 | Prototype (Vanilla JS SPA) |
| 메인 파일 | [`codereview-ai.html`](./codereview-ai.html) |
| 제품 문서 | [`docs/CodeReview_AI_PRD_기능명세서_API명세서.pdf`](./docs/CodeReview_AI_PRD_기능명세서_API명세서.pdf) |
| 저장소 | https://github.com/jinhgit/codereview-ai |

---

## 목차

1. [한 줄 소개](#한-줄-소개)
2. [주요 기능](#주요-기능)
3. [데모 시나리오](#데모-시나리오)
4. [화면 구성](#화면-구성)
5. [시스템 아키텍처](#시스템-아키텍처)
6. [기술 스택](#기술-스택)
7. [모듈 상세](#모듈-상세)
8. [외부 API 연동](#외부-api-연동)
9. [데이터 저장 구조](#데이터-저장-구조)
10. [지원 언어](#지원-언어)
11. [시작하기](#시작하기)
12. [프로젝트 구조](#프로젝트-구조)
13. [제품 문서](#제품-문서)
14. [보안 · 제약 · 로드맵](#보안--제약--로드맵)
15. [기여 / 커밋 규칙](#기여--커밋-규칙)

---

## 한 줄 소개

> 코드를 붙이면, **AI가 리뷰·고치고·돌리고·설명**하고, 팀과 **PR로 합의**한다.

CodeReview AI는 다음 문제를 한 제품 안에서 줄이는 것을 목표로 합니다.

| 문제 | 접근 |
|------|------|
| 코드 리뷰 대기 시간 | Groq LLM으로 즉시 다축 리뷰 |
| 문법·로직 오류 디버깅 | 오류 수정 + Before/After + 전체 수정본 |
| 실행 환경 불일치 | Piston 원격 샌드박스 실행 |
| AI 도구 파편화 | 리뷰 / 수정 / 실행 / 챗 / 협업 통합 UI |
| 팀 리뷰에서 AI 단절 | AI 1차 분석 + 사람 승인 하이브리드 워크플로 |

---

## 주요 기능

### 1) AI 코드 리뷰
- 총점(0–100), 등급(A–F), 한 줄 요약
- 4축 점수 카드: **스타일 / 성능 / 안전성 / 가독성** (클릭 시 이유·팁)
- 섹션: 시간·공간 복잡도, 스타일, 버그, 리팩토링, 알고리즘, 자료구조
- 총점 **60점 미만** 시 AI 자동 최적화 버튼 노출

### 2) AI 오류 수정
- Syntax / Logic / Runtime / Security / Type 오류 분류
- 오류별 Before · After, 수정 방법 설명
- 수정된 전체 코드 복사 또는 **에디터 적용**

### 3) AI 자동 최적화
- 보안 취약점 제거, 하드코딩 제거, 성능·스타일·가독성 개선
- 최적화 전/후 점수, 변경 목록, 결과 코드 모달

### 4) 코드 실행 (컴파일러 패널)
- [Piston](https://github.com/engineer-man/piston) API로 원격 실행
- stdin 입력, stdout / stderr / 컴파일 오류, 종료 코드, 소요 시간
- 결과 복사 · 패널 초기화 · 접기

### 5) GitHub 파일 로드
- `github.com/.../blob/...` URL을 raw URL로 변환 후 파일 본문 로드
- (선택) GitHub Token 지원

### 6) AI 챗봇
- 프로젝트 단위 채팅 폴더, 다중 세션
- 현재 에디터 코드를 컨텍스트로 첨부
- 마크다운 코드블록 추출 → **에디터에 적용**
- `localStorage` 영속화

### 7) 협업 시스템 (로컬 시뮬레이션)
- 저장소 · 브랜치 · Pull Request · 활동 로그
- LCS 기반 Unified Diff + Side-by-Side
- 라인 인라인 코멘트, 리액션, 승인, 머지 규칙
- **AI + 사람 하이브리드 리뷰**
  - AI: 버그·성능·스타일·보안·테스트 점수 및 항목 제안
  - 사람: 항목별 수락 / 무시 / 논의 → 최종 승인 · 수정 요청 · 강제 승인

---

## 데모 시나리오

### A. 첫 코드 리뷰 (약 1분)
1. `codereview-ai.html` 을 브라우저에서 연다  
2. [Groq Console](https://console.groq.com/keys)에서 API Key 발급 (`gsk_...`)  
3. 상단 배너에 키 저장  
4. 샘플 칩 `버그코드` 또는 본인 코드 입력  
5. **코드 리뷰** → 우측 점수·섹션 확인  
6. (선택) **오류 수정** / **실행** / **자동 최적화**

### B. 협업 하이브리드 리뷰
1. 헤더 **협업** 클릭  
2. `demo-project` 또는 새 저장소 선택  
3. PR 상세 → **AI 리뷰** 탭에서 분석 실행  
4. 항목별 수락·무시·논의 후 사람 최종 승인  
5. 승인 수 충족 시 **Merge**

---

## 화면 구성

```
┌─────────────────────────────────────────────────────────────┐
│ Header  ⚡ CodeReview AI   [Model] [Ready] [🤝 협업]        │
├─────────────────────────────────────────────────────────────┤
│ Key Banner  (API Key 미등록 시에만 표시)                     │
├────────────────────────────┬────────────────────────────────┤
│ LEFT                       │ RIGHT                          │
│  Tabs: Editor | GitHub |   │  Tabs: 코드 리뷰 | 오류 수정   │
│         Chat               │                                │
│  ┌ Editor / GitHub / Chat ┐│  등급 · 총점 · 점수 카드      │
│  │                        ││  복잡도 · 버그 · 리팩토링 …   │
│  └────────────────────────┘│  또는 오류 수정 결과           │
│  [코드 리뷰][오류 수정][실행]│                                │
│  ┌ 실행 결과 패널 ────────┐│                                │
│  │ stdin / stdout / err   ││                                │
│  └────────────────────────┘│                                │
└────────────────────────────┴────────────────────────────────┘

[협업 패널] — 전체 화면 오버레이
  사이드바: 저장소 목록
  본문: 개요 | 브랜치 | PRs | 활동 로그 | AI 리뷰 허브
```

- 데스크톱: 2컬럼 그리드  
- `≤720px`: 상·하 스택 레이아웃  
- 테마: GitHub Dark 계열 CSS 변수 (`--bg`, `--ac`, `--gn` …)

---

## 시스템 아키텍처

### As-Is (현재)

백엔드 없이 **브라우저가 UI · 상태 · 외부 API 호출**을 모두 담당합니다.

```
┌──────────────────────────────────────────┐
│              Browser (SPA)               │
│  codereview-ai.html                      │
│  ┌────────────┐  ┌─────────────────────┐ │
│  │ Script 1   │  │ Script 2 (IIFE)     │ │
│  │ Review/Fix │  │ Collab + PR AI      │ │
│  │ Exec/Chat  │  │ Diff / Merge        │ │
│  └─────┬──────┘  └──────────┬──────────┘ │
│        │                    │            │
│  sessionStorage (groq_key)               │
│  localStorage (chats, collab)            │
└────────┼────────────────────┼────────────┘
         │                    │
         ▼                    ▼
   Groq Chat API        Piston Execute
   (LLM 리뷰·챗)        (코드 실행)
         │
         ▼
   GitHub Raw (선택)
```

### To-Be (웹 정식 구현 권고)

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│ Web Client  │────▶│ BFF / Backend    │────▶│ Groq /      │
│ (SPA/SSR)   │◀────│ - API Key 보호   │◀────│ Piston /    │
│             │     │ - 프롬프트 관리  │     │ GitHub      │
└─────────────┘     │ - Rate limit     │     └─────────────┘
                    │ - Auth / DB      │
                    └──────────────────┘
```

상세 계약은 PDF 문서 **PART C §6 향후 백엔드 API 초안**을 참고하세요.

### 논리 모듈

| 모듈 | 책임 | 구현 위치 |
|------|------|-----------|
| Editor | 코드 입력, 줄번호, Tab, 샘플, 언어 | Script 1 |
| Review | AI 리뷰 요청 · 점수 · 섹션 렌더 | `doAnalyze` / `renderReview` |
| Fix | 오류 수정 · 적용 | `doFix` / `renderFix` |
| Optimize | 저점수 자동 최적화 모달 | `doOptimize` |
| Execute | Piston 실행 패널 | `runCode` |
| Chat | 프로젝트/채팅/히스토리 | `sendChat` + store |
| GitHub | 원격 파일 로드 | `loadGH` |
| LLM Gateway | 모델 폴백 · JSON 파싱 | `callGroq` / `parseJSON` |
| Collab | 저장소·PR·Diff·AI 하이브리드 | Script 2 |

---

## 기술 스택

### 현재 (Prototype)

| 영역 | 기술 | 비고 |
|------|------|------|
| 언어 | HTML5, CSS3, **Vanilla JavaScript (ES5 스타일)** | 프레임워크 없음 |
| UI | 커스텀 CSS, CSS Variables, Flex/Grid | GitHub Dark 톤 |
| LLM | **Groq** OpenAI-compatible Chat Completions | 브라우저 직접 호출 |
| 코드 실행 | **Piston** (`emkc.org` public instance) | 다국어 샌드박스 |
| 원격 파일 | GitHub Raw Content | Optional token |
| 영속성 | `sessionStorage`, `localStorage` | 서버 DB 없음 |
| 문서 PDF | Python **ReportLab** | `docs/generate_specs.py` |
| 버전 관리 | Git + GitHub | |

### LLM 모델 폴백 (Rate Limit 대응)

1. `llama-3.3-70b-versatile` (Llama 3.3 70B)  
2. `llama-3.1-8b-instant` (Llama 3.1 8B)  
3. `gemma2-9b-it` (Gemma 2 9B)  
4. `mixtral-8x7b-32768` (Mixtral 8x7B) — 메인 리뷰/챗 경로  

HTTP **429** 시 다음 모델로 자동 전환 후 재시도합니다.  
`temperature` 기본 `0.1`, 리뷰 `max_tokens` 최대 `8192`.

### 향후 웹 스택 (권장 예시)

문서·로드맵 기준 권고이며, 구현 단계에서 확정합니다.

| 영역 | 후보 |
|------|------|
| Frontend | Vite + React (또는 Vue) |
| Editor | Monaco / CodeMirror |
| Backend | Node (Fastify/Nest) 또는 Python (FastAPI) BFF |
| Auth | JWT / OAuth (GitHub 로그인 등) |
| DB | PostgreSQL + Prisma/SQLAlchemy |
| Realtime (선택) | WebSocket — 협업 알림 |

---

## 모듈 상세

### 에디터
- 줄번호 동기 스크롤, Tab → 스페이스 2칸  
- 입력 후 800ms 디바운스 **언어 자동 감지** (`detectLang`)  
- 샘플: split, 버블정렬, 피보나치, 이진탐색, 연결리스트, 버그코드, 문법오류  

### 리뷰 JSON 계약 (요약)

```json
{
  "scores": {
    "total": 0,
    "style": 0,
    "performance": 0,
    "safety": 0,
    "readability": 0,
    "grade": "A|B|C|D|F",
    "summary": "한줄평가"
  },
  "score_details": { "...": { "reason": "", "problems": [], "tips": [] } },
  "style": [],
  "complexity": { "time": "O(?)", "space": "O(?)", "rating": "good|ok|bad" },
  "bugs": [],
  "refactoring": [],
  "algorithms": [],
  "datastructures": []
}
```

### 실행 런타임 매핑 (Piston)

| UI 언어 | Piston language | version | 파일명 |
|---------|-----------------|---------|--------|
| Python | python | 3.10.0 | main.py |
| JavaScript | javascript | 18.15.0 | main.js |
| TypeScript | typescript | 5.0.3 | main.ts |
| Java | java | 15.0.2 | Main.java |
| C | c | 10.2.0 | main.c |
| C++ | c++ | 10.2.0 | main.cpp |
| Go | go | 1.16.2 | main.go |
| Rust | rust | 1.50.0 | main.rs |
| SQL | sqlite3 | 3.36.0 | main.sql |

### 협업 PR 상태

```
open ──(merge, 승인 조건 충족)──▶ merged
open ──(close)──────────────────▶ closed
```

- 머지 조건(As-Is): `approvals.length ≥ mergeRules.minApprovals`  
- `mergeRules`: `requireApproval`, `minApprovals`, `requireCI`(UI만), `deleteBranch`  
- Diff: LCS 기반 unified + side-by-side  

---

## 외부 API 연동

| API | Endpoint | 용도 | 인증 |
|-----|----------|------|------|
| Groq Chat | `POST https://api.groq.com/openai/v1/chat/completions` | 리뷰·수정·최적화·챗·PR AI | `Bearer {groq_key}` |
| Piston | `POST https://emkc.org/api/v2/piston/execute` | 코드 실행 | 없음 |
| GitHub Raw | `GET https://raw.githubusercontent.com/...` | 파일 본문 | Optional `token` |

### 호출 흐름 예 (코드 리뷰)

```
User → [코드 리뷰 버튼]
     → needKey() 검사
     → callGroq(system + user prompt, jsonMode=true)
     → parseJSON (펜스 제거·중괄호 슬라이스 폴백)
     → renderReview()
```

### JSON 파싱 폴백 순서
1. `JSON.parse(raw)`  
2. ` ```json ` 펜스 제거 후 parse  
3. 일반 펜스 제거 후 parse  
4. 첫 `{` ~ 마지막 `}` 슬라이스  
5. 기능별 필드 휴리스틱 (`fixed_full_code`, `optimized_code` 등)

---

## 데이터 저장 구조

### sessionStorage
| Key | 값 |
|-----|-----|
| `groq_key` | Groq API Key (`gsk_...`) — 탭 세션 단위 |

### localStorage

**채팅** — `cr_chats_v3`

```
Store {
  projects: [{ id, name, color, chatIds[], collapsed }],
  chats: [{
    id, title, projectId,
    history: [{ role, content }],      // LLM 컨텍스트 (최대 20턴 유지)
    messages: [{ role, html, time, code }],
    createdAt, updatedAt
  }],
  activeChatId
}
```

**협업** — `codereview_collab_v2`

```
{
  repos:    [{ id, name, desc, owner, members[], mergeRules, ... }],
  branches: [{ id, repoId, name, isDefault, author, commits, ... }],
  prs:      [{ id, repoId, title, src, tgt, status, approvals[],
               before, after, comments[], activity[], aiReviews[] }],
  log:      [{ id, repoId, type, author, desc, time }]
}
```

최초 로드 시 시드 데이터: `demo-project` + `feature/ai-review` 샘플 PR.

> ⚠️ 로컬 스토리지는 **브라우저·기기 단위**입니다. 공유·동기화·백업은 향후 서버 영속이 필요합니다.

---

## 지원 언어

에디터 선택 및 자동 감지:

`Python` · `JavaScript` · `TypeScript` · `Java` · `C` · `C++` · `Go` · `Rust` · `SQL`

UI·프롬프트·기본 응답 언어: **한국어**

---

## 시작하기

### 1. 클론

```bash
git clone https://github.com/jinhgit/codereview-ai.git
cd codereview-ai
```

### 2. BFF + 웹 앱 실행 (권장)

```bash
# 의존성 (최초 1회)
npm run install:all

# 터미널 1 — BFF
cd server
cp .env.example .env   # GROQ_API_KEY=gsk_... 설정
npm run dev            # http://localhost:8787

# 터미널 2 — 프론트
cd web
npm run dev            # http://localhost:5173  ( /api → BFF 프록시 )
```

- **권장**: `server/.env` 의 `GROQ_API_KEY` (브라우저에 키 미노출)
- **개발 폴백**: 서버 키가 없으면 UI 배너에 클라이언트 키 입력 (`X-Groq-Key`)

프로덕션 빌드:

```bash
npm run build:server
npm run build:web
npm run start:server
```

### 3. 단일 HTML (`codereview-ai.html`)

`web/` 최종 React 앱을 **단일 파일로 번들**한 산출물입니다. (선형 SVG 아이콘 · 전체 기능 포함)

```bash
# 재생성
npm run build:html --prefix web
# → 루트 codereview-ai.html 갱신

# 실행 (정적 서버 권장)
python3 -m http.server 8080
# → http://localhost:8080/codereview-ai.html

# macOS 직접 열기
open codereview-ai.html
```

- **BFF 있음**: `/api`로 서버 연동  
- **BFF 없음**: 브라우저에서 Groq/Piston 직접 호출 (상단 API Key 입력)

### 4. Groq API Key

1. https://console.groq.com/keys 에서 키 발급  
2. 앱 상단 배너에 `gsk_...` 입력 후 **저장**  
3. 키는 `sessionStorage`에만 저장됩니다 (새로고침 시 같은 탭에서는 유지, 탭 종료 시 삭제될 수 있음)

### 5. 제품 PDF 재생성 (선택)

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install reportlab
python docs/generate_specs.py
# → docs/CodeReview_AI_PRD_기능명세서_API명세서.pdf
```

macOS에서 한글 폰트는 기본적으로  
`/System/Library/Fonts/Supplemental/AppleGothic.ttf` 를 사용합니다.

---

## 프로젝트 구조

```
codereview-ai/
├── README.md
├── package.json                       # monorepo scripts
├── codereview-ai.html                 # 레거시 단일 HTML 프로토타입
├── docs/
├── server/                            # ⭐ BFF (Express + TS)
│   ├── .env.example
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/  (ai, execute, github)
│   │   ├── services/(groq, piston)
│   │   └── prompts.ts
│   └── README.md
└── web/                               # ⭐ 웹 앱 (Vite + React + TS)
    ├── vite.config.ts                 # /api → :8787 proxy
    └── src/
        ├── components/                # UI + Toast + Collab
        └── services/                  # apiClient → BFF
```

| 구간 (대략) | 내용 |
|-------------|------|
| L1–333 | 메인 스타일 |
| L335–569 | 메인 DOM · 모달 |
| L572–1297 | 메인 비즈니스 로직 |
| L1304–1468 | 협업 UI · 스타일 |
| L1471–2579 | 협업 · PR AI 로직 |

---

## 제품 문서

상세 요구사항은 아래 통합 PDF에 정리되어 있습니다.

📄 **[CodeReview_AI_PRD_기능명세서_API명세서.pdf](./docs/CodeReview_AI_PRD_기능명세서_API명세서.pdf)**

| Part | 내용 |
|------|------|
| **A. PRD** | 비전, 페르소나, In/Out of Scope, KPI, 여정, NFR, 리스크·로드맵 |
| **B. 기능명세서** | F-01 ~ F-22, 흐름·UI·비즈니스 규칙, 데이터 모델, 예외 |
| **C. API명세서** | Groq / Piston / GitHub, 프롬프트 JSON 계약, To-Be BFF REST |

---

## 보안 · 제약 · 로드맵

### 보안 (현재 주의)

- API Key가 **브라우저에 존재**하고 Groq로 직접 전송됩니다.  
  → 공용 PC·스크린 공유 시 키 노출 주의. 정식 서비스에서는 **BFF 프록시** 필수.  
- LLM/사용자 출력은 `esc()` / `E()` 로 HTML 이스케이프합니다.  
- 실행 코드는 **공개 Piston 인스턴스**로 전송됩니다. 비밀·개인정보를 넣지 마세요.

### 제약

- 협업은 **localStorage 시뮬레이션** (실 Git/실시간 멀티유저 아님)  
- Groq·Piston 쿼터·가용성에 의존  
- LLM 환각으로 잘못된 수정 가능 → **사람 검토** 권장  
- `requireCI` 머지 규칙은 UI 토글만 존재 (CI 연동 없음)

### 로드맵 (요약)

| Phase | 내용 |
|-------|------|
| **P0** | 단일 HTML 프로토타입 |
| **P1** | 제품 문서 · README |
| **P2** | 웹 앱 핵심 루프 (에디터·리뷰·수정·실행) |
| **P2.1** | 챗봇 (프로젝트/세션 · 에디터 컨텍스트) — **완료** |
| **P2.2** | GitHub 로드 · 협업 패널 — **완료** |
| **P2.3** | BFF (API Key 서버 보관) + UI 개선 — **완료** |
| **P3** | 계정 · 서버 저장 채팅/협업 |
| **P4** | 실 Git 연동 · 팀 워크스페이스 |

---

## 기여 / 커밋 규칙

이 저장소는 기능 업데이트·큰 변화가 있을 때마다 GitHub에 push합니다.

- **커밋 메시지 기본 언어: 한국어**  
- 영문이 더 자연스러울 때만 영어 (짧은 fix / chore 등)  
- 예:
  - `docs: README에 아키텍처·기술스택 상세 작성`
  - `feat: 코드 리뷰 점수 카드 접기/펼치기 개선`
  - `fix: Piston stderr 미표시 문제 수정`

이슈·PR 환영합니다. 큰 기능은 PDF 명세(F-ID, API 경로)와 맞춰 제안해 주세요.

---

## 라이선스

별도 라이선스 파일이 추가되기 전까지는 저장소 소유자 정책에 따릅니다.  
외부 API(Groq, Piston, GitHub) 이용 시 각 서비스 약관을 준수해야 합니다.

---

## 링크

- 저장소: https://github.com/jinhgit/codereview-ai  
- Groq Keys: https://console.groq.com/keys  
- Piston: https://github.com/engineer-man/piston  
- 제품 명세 PDF: [docs/](./docs/)

---

<p align="center">
  <b>CodeReview AI</b> — Write · Review · Fix · Run · Collaborate
</p>
