#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CodeReview AI — PRD / 기능명세서 / API명세서 PDF 생성기"""

from pathlib import Path
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)

# ── Fonts ──────────────────────────────────────────────────────────
FONT_PATH = "/System/Library/Fonts/Supplemental/AppleGothic.ttf"
pdfmetrics.registerFont(TTFont("AG", FONT_PATH))

# ── Colors ─────────────────────────────────────────────────────────
C_PRIMARY = colors.HexColor("#1f6feb")
C_ACCENT = colors.HexColor("#f55036")
C_DARK = colors.HexColor("#0d1117")
C_TEXT = colors.HexColor("#1a1a1a")
C_MUTED = colors.HexColor("#57606a")
C_BG = colors.HexColor("#f6f8fa")
C_BORDER = colors.HexColor("#d0d7de")
C_HEADER_BG = colors.HexColor("#161b22")
C_WHITE = colors.white
C_OK = colors.HexColor("#1a7f37")
C_WARN = colors.HexColor("#9a6700")

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm

OUT_DIR = Path(__file__).resolve().parent
OUT_PDF = OUT_DIR / "CodeReview_AI_PRD_기능명세서_API명세서.pdf"


def build_styles():
    base = getSampleStyleSheet()
    styles = {}

    styles["cover_title"] = ParagraphStyle(
        "cover_title", fontName="AG", fontSize=26, leading=34,
        textColor=C_WHITE, alignment=TA_CENTER, spaceAfter=8,
    )
    styles["cover_sub"] = ParagraphStyle(
        "cover_sub", fontName="AG", fontSize=13, leading=18,
        textColor=colors.HexColor("#c9d1d9"), alignment=TA_CENTER, spaceAfter=6,
    )
    styles["cover_meta"] = ParagraphStyle(
        "cover_meta", fontName="AG", fontSize=10, leading=14,
        textColor=colors.HexColor("#8b949e"), alignment=TA_CENTER,
    )
    styles["h1"] = ParagraphStyle(
        "h1", fontName="AG", fontSize=16, leading=22,
        textColor=C_DARK, spaceBefore=16, spaceAfter=8,
        borderPadding=3,
    )
    styles["h2"] = ParagraphStyle(
        "h2", fontName="AG", fontSize=13, leading=18,
        textColor=C_PRIMARY, spaceBefore=12, spaceAfter=6,
    )
    styles["h3"] = ParagraphStyle(
        "h3", fontName="AG", fontSize=11, leading=15,
        textColor=C_TEXT, spaceBefore=8, spaceAfter=4,
    )
    styles["body"] = ParagraphStyle(
        "body", fontName="AG", fontSize=9.5, leading=14.5,
        textColor=C_TEXT, alignment=TA_JUSTIFY, spaceAfter=5,
    )
    styles["body_left"] = ParagraphStyle(
        "body_left", fontName="AG", fontSize=9.5, leading=14.5,
        textColor=C_TEXT, alignment=TA_LEFT, spaceAfter=5,
    )
    styles["bullet"] = ParagraphStyle(
        "bullet", fontName="AG", fontSize=9.5, leading=14,
        textColor=C_TEXT, leftIndent=12, spaceAfter=2,
    )
    styles["small"] = ParagraphStyle(
        "small", fontName="AG", fontSize=8, leading=11,
        textColor=C_MUTED, spaceAfter=2,
    )
    styles["th"] = ParagraphStyle(
        "th", fontName="AG", fontSize=8.5, leading=11,
        textColor=C_WHITE, alignment=TA_CENTER,
    )
    styles["td"] = ParagraphStyle(
        "td", fontName="AG", fontSize=8, leading=11,
        textColor=C_TEXT, alignment=TA_LEFT,
    )
    styles["td_c"] = ParagraphStyle(
        "td_c", fontName="AG", fontSize=8, leading=11,
        textColor=C_TEXT, alignment=TA_CENTER,
    )
    styles["code"] = ParagraphStyle(
        "code", fontName="AG", fontSize=7.5, leading=10.5,
        textColor=colors.HexColor("#24292f"), backColor=C_BG,
        leftIndent=4, rightIndent=4, spaceBefore=2, spaceAfter=2,
    )
    styles["toc"] = ParagraphStyle(
        "toc", fontName="AG", fontSize=10, leading=16,
        textColor=C_TEXT, spaceAfter=3,
    )
    styles["footer"] = ParagraphStyle(
        "footer", fontName="AG", fontSize=7.5, leading=10,
        textColor=C_MUTED, alignment=TA_CENTER,
    )
    styles["caption"] = ParagraphStyle(
        "caption", fontName="AG", fontSize=8, leading=11,
        textColor=C_MUTED, alignment=TA_CENTER, spaceBefore=2, spaceAfter=8,
    )
    styles["callout"] = ParagraphStyle(
        "callout", fontName="AG", fontSize=9, leading=13,
        textColor=C_TEXT, leftIndent=6, rightIndent=6, spaceBefore=4, spaceAfter=4,
    )
    styles["part"] = ParagraphStyle(
        "part", fontName="AG", fontSize=18, leading=24,
        textColor=C_WHITE, alignment=TA_CENTER,
    )
    return styles


def P(text, style):
    return Paragraph(str(text).replace("\n", "<br/>"), style)


def hr():
    return HRFlowable(width="100%", thickness=0.6, color=C_BORDER, spaceBefore=4, spaceAfter=8)


def spacer(h=6):
    return Spacer(1, h)


def make_table(headers, rows, col_widths, styles):
    th, td, td_c = styles["th"], styles["td"], styles["td_c"]
    data = [[P(h, th) for h in headers]]
    for row in rows:
        cells = []
        for i, cell in enumerate(row):
            # center short columns when content looks like status/method
            s = td_c if i == 0 and len(str(cell)) < 12 and " " not in str(cell)[:8] else td
            cells.append(P(cell, s))
        data.append(cells)

    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), C_HEADER_BG),
        ("TEXTCOLOR", (0, 0), (-1, 0), C_WHITE),
        ("BACKGROUND", (0, 1), (-1, -1), C_WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [C_WHITE, C_BG]),
        ("GRID", (0, 0), (-1, -1), 0.4, C_BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def bullet_list(items, styles):
    flows = []
    for it in items:
        flows.append(P(f"• {it}", styles["bullet"]))
    return flows


def numbered_list(items, styles):
    flows = []
    for i, it in enumerate(items, 1):
        flows.append(P(f"{i}. {it}", styles["bullet"]))
    return flows


def part_banner(title, subtitle, styles):
    """Full-width colored section divider as a table."""
    data = [[
        P(f"<b>{title}</b><br/><font size='9' color='#c9d1d9'>{subtitle}</font>", styles["part"])
    ]]
    t = Table(data, colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), C_DARK),
        ("TOPPADDING", (0, 0), (-1, -1), 18),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def add_page_number(canvas, doc):
    canvas.saveState()
    page = doc.page
    canvas.setFont("AG", 7.5)
    canvas.setFillColor(C_MUTED)
    canvas.drawCentredString(PAGE_W / 2, 10 * mm, f"CodeReview AI · Spec Document · {page}")
    canvas.setStrokeColor(C_BORDER)
    canvas.setLineWidth(0.4)
    canvas.line(MARGIN, 14 * mm, PAGE_W - MARGIN, 14 * mm)
    # header line
    if page > 1:
        canvas.drawString(MARGIN, PAGE_H - 12 * mm, "CodeReview AI")
        canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 12 * mm, "PRD · 기능명세서 · API명세서")
        canvas.line(MARGIN, PAGE_H - 14 * mm, PAGE_W - MARGIN, PAGE_H - 14 * mm)
    canvas.restoreState()


# ═══════════════════════════════════════════════════════════════════
# CONTENT
# ═══════════════════════════════════════════════════════════════════

def build_cover(styles, story):
    # dark cover block
    cover_data = [[
        P(
            "<br/><br/>"
            "<font size='11' color='#f55036'>PRODUCT DOCUMENTATION</font><br/><br/>"
            "<font size='24'><b>CodeReview AI</b></font><br/><br/>"
            "<font size='12' color='#c9d1d9'>프로젝트 상세 PRD · 기능명세서 · API명세서</font><br/><br/>"
            "<font size='9' color='#8b949e'>AI 기반 코드 리뷰 · 오류 수정 · 실행 · 챗봇 · 협업 하이브리드 리뷰 플랫폼</font>"
            "<br/><br/><br/>"
            f"<font size='9' color='#8b949e'>문서 버전 1.0  |  작성일 {date.today().isoformat()}  |  상태: Draft for Web Implementation</font>"
            "<br/><br/>",
            styles["cover_title"],
        )
    ]]
    t = Table(cover_data, colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), C_DARK),
        ("TOPPADDING", (0, 0), (-1, -1), 40),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 40),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    story.append(t)
    story.append(spacer(20))

    meta_rows = [
        ["문서 구분", "PRD + 기능명세서 + API명세서 (통합 산출물)"],
        ["제품명", "CodeReview AI"],
        ["현재 구현", "단일 HTML SPA (Vanilla JS, 약 2,583 LOC)"],
        ["목표", "웹 애플리케이션으로 구조화·확장 구현"],
        ["외부 연동", "Groq Chat Completions API, Piston Execute API, GitHub Raw"],
        ["저장소", "sessionStorage (API Key), localStorage (채팅·협업)"],
    ]
    story.append(make_table(
        ["항목", "내용"],
        meta_rows,
        [40 * mm, 132 * mm],
        styles,
    ))
    story.append(PageBreak())


def build_toc(styles, story):
    story.append(P("목차", styles["h1"]))
    story.append(hr())
    toc = [
        "PART A. 프로젝트 상세 PRD (Product Requirements Document)",
        "    1. 제품 개요 및 비전",
        "    2. 문제 정의 및 기회",
        "    3. 목표 사용자 및 페르소나",
        "    4. 제품 목표 / 비목표 (In / Out of Scope)",
        "    5. 성공 지표 (KPI)",
        "    6. 시스템 아키텍처 개요",
        "    7. 사용자 여정 (User Journey)",
        "    8. 정보 구조 및 화면 구성",
        "    9. 비기능 요구사항",
        "    10. 제약사항 · 리스크 · 로드맵",
        "PART B. 기능명세서 (Functional Specification)",
        "    1. 기능 목록 총괄",
        "    2. 모듈별 상세 기능 명세",
        "    3. 데이터 모델 (클라이언트)",
        "    4. 권한 · 상태 전이",
        "    5. 예외 및 오류 처리",
        "PART C. API명세서 (API Specification)",
        "    1. 외부 API 연동 개요",
        "    2. Groq Chat Completions",
        "    3. Piston Code Execution",
        "    4. GitHub Raw Content",
        "    5. 프롬프트 계약 (JSON Schema)",
        "    6. 향후 백엔드 API 설계 초안",
        "부록. 용어집 · 참고",
    ]
    for line in toc:
        story.append(P(line, styles["toc"]))
    story.append(PageBreak())


# ── PART A: PRD ────────────────────────────────────────────────────

def build_prd(styles, story):
    story.append(part_banner("PART A", "프로젝트 상세 PRD (Product Requirements Document)", styles))
    story.append(spacer(12))

    # 1
    story.append(P("1. 제품 개요 및 비전", styles["h1"]))
    story.append(hr())
    story.append(P(
        "<b>CodeReview AI</b>는 개발자가 작성한 소스 코드를 브라우저에서 즉시 분석·수정·실행하고, "
        "대화형 어시스턴트와 팀 협업(PR 기반 AI+사람 하이브리드 리뷰)까지 한 화면에서 수행하는 "
        "<b>AI 네이티브 코드 품질 플랫폼</b>이다.",
        styles["body"],
    ))
    story.append(P(
        "현재 산출물은 Vanilla JS 단일 HTML 프로토타입이며, 본 문서는 이를 정식 웹 서비스로 "
        "확장·재구현하기 위한 제품 요구사항의 기준 문서(Source of Truth)로 사용한다.",
        styles["body"],
    ))

    story.append(P("1.1 제품 한 줄 정의", styles["h2"]))
    story.append(P(
        "「코드를 붙이면, AI가 리뷰·고치고·돌리고·설명하고, 팀과 PR로 합의한다.」",
        styles["body"],
    ))

    story.append(P("1.2 핵심 가치 제안 (Value Proposition)", styles["h2"]))
    for it in [
        "<b>즉시성</b>: 설치 없이 브라우저에서 리뷰·수정·실행 완료",
        "<b>다기능 통합</b>: 리뷰 / 오류수정 / 실행 / 챗봇 / 협업을 한 제품에 통합",
        "<b>하이브리드 리뷰</b>: AI 1차 분석 + 사람 최종 승인으로 품질·책임 균형",
        "<b>학습 친화</b>: 점수·등급·샘플 코드·적용 버튼으로 초급자도 개선 루프 학습",
        "<b>비용 효율</b>: Groq 무료 티어 수준의 LLM + 공개 샌드박스 실행(Piston) 활용",
    ]:
        story.append(P(f"• {it}", styles["bullet"]))

    # 2
    story.append(P("2. 문제 정의 및 기회", styles["h1"]))
    story.append(hr())
    story.append(P("2.1 현재 문제", styles["h2"]))
    story.append(make_table(
        ["문제", "영향", "기존 대안의 한계"],
        [
            ["코드 리뷰 대기 시간 김", "피드백 루프 지연, 학습 속도 저하", "동료 리뷰·CI 도구는 셋업/비용 부담"],
            ["문법·런타임 오류 디버깅 어려움", "초보 이탈, 생산성 저하", "검색/StackOverflow는 컨텍스트 불일치"],
            ["실행 환경 불일치", "\"내 컴에선 되는데\" 문제", "로컬 설치·컨테이너 장벽"],
            ["AI 도구 파편화", "Chat / 리뷰 / 실행 앱 분리", "컨텍스트 복사 반복, UX 단절"],
            ["팀 리뷰에서 AI 활용 미흡", "단순 코멘트 수준", "AI 결과를 승인 워크플로에 연결 부족"],
        ],
        [42 * mm, 55 * mm, 75 * mm],
        styles,
    ))

    story.append(P("2.2 기회", styles["h2"]))
    story.append(P(
        "LLM API의 저지연·저비용화와 브라우저 기반 코드 샌드박스의 성숙으로, "
        "교육·부트캠프·사이드 프로젝트·소규모 팀에서 \"가벼운 AI 코드 리뷰 허브\" 수요가 증가하고 있다. "
        "CodeReview AI는 이 구간에 <b>풀스택 품질 루프(작성→분석→수정→실행→협의)</b>를 제공한다.",
        styles["body"],
    ))

    # 3
    story.append(P("3. 목표 사용자 및 페르소나", styles["h1"]))
    story.append(hr())
    story.append(make_table(
        ["페르소나", "니즈", "주요 기능"],
        [
            ["학습자 / 부트캠프생", "빠른 피드백, 오류 원인 이해", "리뷰 점수, 오류 수정, 샘플, 챗봇"],
            ["개인 개발자", "혼자 작업 시 2차 검토", "리뷰, 최적화, 실행, GitHub 로드"],
            ["팀 리드 / 멘토", "일관된 1차 스크리닝", "협업 PR, AI 하이브리드 리뷰"],
            ["소규모 스타트업 팀", "가벼운 PR 프로세스", "브랜치·PR·승인·머지 규칙"],
        ],
        [40 * mm, 55 * mm, 77 * mm],
        styles,
    ))

    # 4
    story.append(P("4. 제품 목표 / 비목표", styles["h1"]))
    story.append(hr())
    story.append(P("4.1 In Scope (현재 프로토타입 + 웹 전환 1차)", styles["h2"]))
    for it in [
        "다국어 코드 에디터(입력·샘플·줄번호·언어 선택/자동감지)",
        "AI 코드 리뷰(점수·등급·스타일/성능/안전/가독성·복잡도·버그·리팩토링 등)",
        "AI 오류 수정 및 수정본 에디터 적용",
        "60점 미만 시 AI 자동 최적화 모달",
        "코드 실행(Piston) + stdin + stdout/stderr 표시",
        "GitHub 파일 URL 불러오기",
        "프로젝트 단위 챗봇(로컬 영속, 코드 컨텍스트 첨부)",
        "협업 패널: 저장소·브랜치·PR·Diff·코멘트·승인·머지·AI 리뷰",
        "Groq API Key 사용자 입력(sessionStorage)",
    ]:
        story.append(P(f"• {it}", styles["bullet"]))

    story.append(P("4.2 Out of Scope (1차 웹 구현에서 제외 권고)", styles["h2"]))
    for it in [
        "실제 Git 서버/원격 push·pull (현재는 localStorage 시뮬레이션)",
        "실시간 멀티유저 동시 편집(CRDT/WebSocket)",
        "SSO/OAuth 정식 계정 시스템(향후 로드맵)",
        "유료 결제·구독 빌링",
        "모바일 네이티브 앱",
        "프로덕션급 샌드박스 격리(자체 실행 인프라)",
        "IDE 플러그인(VS Code 등)",
    ]:
        story.append(P(f"• {it}", styles["bullet"]))

    # 5
    story.append(P("5. 성공 지표 (KPI)", styles["h1"]))
    story.append(hr())
    story.append(make_table(
        ["지표", "정의", "1차 목표"],
        [
            ["TTFR (Time to First Review)", "키 입력 후 첫 리뷰 결과까지 시간", "p50 ≤ 15초"],
            ["리뷰 완료율", "리뷰 시작 대비 결과 렌더 성공 비율", "≥ 90%"],
            ["수정 적용률", "오류 수정 후 에디터 적용 비율", "≥ 40%"],
            ["실행 성공률", "지원 언어 실행 요청 중 exit 0 비율", "모니터링"],
            ["AI 하이브리드 사용", "PR 중 AI 리뷰 실행 비율", "데모 시나리오 100%"],
            ["JSON 파싱 성공률", "LLM 응답 파싱 성공", "≥ 95% (폴백 포함)"],
        ],
        [48 * mm, 70 * mm, 54 * mm],
        styles,
    ))

    # 6
    story.append(P("6. 시스템 아키텍처 개요", styles["h1"]))
    story.append(hr())
    story.append(P("6.1 현재(As-Is) 아키텍처", styles["h2"]))
    story.append(P(
        "브라우저 단일 페이지가 UI·상태·API 호출을 모두 담당한다. 서버 백엔드 없음. "
        "LLM·실행은 각각 Groq·Piston 공개 엔드포인트로 직접 호출한다.",
        styles["body"],
    ))
    story.append(P(
        "[Browser SPA] → Groq API (Chat Completions)<br/>"
        "[Browser SPA] → Piston API (Execute)<br/>"
        "[Browser SPA] → GitHub raw.githubusercontent.com<br/>"
        "[Browser SPA] ↔ sessionStorage / localStorage",
        styles["code"],
    ))

    story.append(P("6.2 목표(To-Be) 웹 아키텍처 권고", styles["h2"]))
    story.append(P(
        "프론트엔드(SPA/SSR) + 백엔드 BFF(API Key 보호·프롬프트 관리) + 선택적 DB(사용자·협업 실데이터).",
        styles["body"],
    ))
    story.append(P(
        "[Web Client] → [BFF / Backend] → Groq / Piston / GitHub<br/>"
        "[Web Client] → [Auth] → [DB: users, projects, chats, repos, prs]",
        styles["code"],
    ))

    story.append(P("6.3 논리 모듈", styles["h2"]))
    story.append(make_table(
        ["모듈", "책임", "현재 위치"],
        [
            ["Editor Module", "코드 입력, 샘플, 언어, 줄번호", "메인 Script 1"],
            ["Review Module", "리뷰 요청·점수·섹션 렌더", "doAnalyze / renderReview"],
            ["Fix Module", "오류 수정·적용", "doFix / renderFix"],
            ["Optimize Module", "저점수 자동 최적화 모달", "doOptimize"],
            ["Execute Module", "Piston 실행 패널", "runCode"],
            ["Chat Module", "프로젝트/채팅/히스토리", "sendChat + store"],
            ["GitHub Module", "원격 파일 로드", "loadGH"],
            ["Collab Module", "저장소·PR·Diff·AI 리뷰", "Script 2 IIFE"],
            ["LLM Gateway", "모델 폴백·JSON 파싱", "callGroq / parseJSON"],
        ],
        [38 * mm, 70 * mm, 64 * mm],
        styles,
    ))

    story.append(PageBreak())

    # 7
    story.append(P("7. 사용자 여정 (User Journey)", styles["h1"]))
    story.append(hr())
    story.append(P("7.1 핵심 여정: 첫 코드 리뷰", styles["h2"]))
    for i, step in enumerate([
        "서비스 진입 → Groq API Key 배너 확인",
        "console.groq.com에서 키 발급 후 저장 (sessionStorage)",
        "에디터에 코드 입력 또는 샘플 칩 선택 / GitHub URL 로드",
        "언어 선택 또는 자동 감지",
        "「코드 리뷰」 클릭 → 로딩 스텝 표시",
        "우측 패널에 등급·총점·4축 카드·상세 섹션 표시",
        "(선택) 60점 미만이면 자동 최적화 실행 → 모달에서 적용",
        "(선택) 「오류 수정」 또는 「실행」으로 검증 루프",
    ], 1):
        story.append(P(f"{i}. {step}", styles["bullet"]))

    story.append(P("7.2 협업 여정: AI+사람 하이브리드 PR 리뷰", styles["h2"]))
    for i, step in enumerate([
        "헤더 「협업」 → 전체화면 협업 패널",
        "저장소 선택/생성 → 브랜치 생성",
        "PR 생성(before/after 코드, 리뷰어 지정)",
        "Diff에서 라인 코멘트 / 리뷰 탭 코멘트",
        "AI 리뷰 실행 → 항목별 수락·무시·논의",
        "사람 최종 승인 또는 수정 요청",
        "승인 수 충족 시 Merge (규칙에 따라 소스 브랜치 삭제)",
    ], 1):
        story.append(P(f"{i}. {step}", styles["bullet"]))

    # 8
    story.append(P("8. 정보 구조 및 화면 구성", styles["h1"]))
    story.append(hr())
    story.append(P("8.1 메인 레이아웃", styles["h2"]))
    story.append(make_table(
        ["영역", "구성 요소"],
        [
            ["Header", "로고, 모델 뱃지, Ready 상태, 협업 토글"],
            ["Key Banner", "Groq API Key 입력/저장 (키 있으면 숨김)"],
            ["Left Pane", "Editor / GitHub / Chat 탭 + 하단 실행 패널"],
            ["Right Pane", "코드 리뷰 / 오류 수정 탭"],
            ["Modals", "최적화 결과, 프로젝트명, PR 생성, 저장소 생성"],
            ["Collab Overlay", "저장소 사이드바 + 개요/브랜치/PR/활동/AI 허브"],
        ],
        [40 * mm, 132 * mm],
        styles,
    ))

    story.append(P("8.2 지원 언어", styles["h2"]))
    story.append(P(
        "Python, JavaScript, TypeScript, Java, C, C++, Go, Rust, SQL "
        "(에디터 선택 + detectLang 휴리스틱 + Piston 런타임 매핑).",
        styles["body"],
    ))

    # 9
    story.append(P("9. 비기능 요구사항 (NFR)", styles["h1"]))
    story.append(hr())
    story.append(make_table(
        ["구분", "요구사항"],
        [
            ["성능", "UI 상호작용 100ms 이내 피드백(로딩 표시 포함). LLM 호출은 비동기."],
            ["가용성", "외부 API 장애 시 사용자 메시지 + 모델 폴백(429 시 순환)."],
            ["보안", "API Key는 sessionStorage. XSS 방지를 위해 사용자/LLM 출력 esc() 처리."],
            ["보안(향후)", "서버 프록시로 Key 노출 제거, CSP, Rate limit, 입력 크기 제한."],
            ["호환성", "최신 Chromium/Firefox/Safari. 뷰포트 720px 이하 2단→1단 스택."],
            ["접근성", "버튼 레이블·키보드 Tab 들여쓰기. (향후: ARIA·포커스 트랩 강화)"],
            ["로컬화", "UI·프롬프트·응답 기본 한국어."],
            ["영속성", "채팅/협업 localStorage. 키는 탭 세션 단위."],
            ["확장성", "모듈 분리 가능한 단일 책임 함수 구조 → 프레임워크 이전 용이."],
        ],
        [32 * mm, 140 * mm],
        styles,
    ))

    # 10
    story.append(P("10. 제약사항 · 리스크 · 로드맵", styles["h1"]))
    story.append(hr())
    story.append(P("10.1 제약사항", styles["h2"]))
    for it in [
        "Groq/Piston 쿼터·가용성에 의존",
        "브라우저에서 Key 노출 위험 (As-Is)",
        "협업 데이터는 기기/브라우저 로컬에 한정",
        "LLM 환각으로 잘못된 수정 코드 가능 → 사람 검토 필요",
        "Piston 공개 인스턴스 성능·보안 한계",
    ]:
        story.append(P(f"• {it}", styles["bullet"]))

    story.append(P("10.2 리스크 및 완화", styles["h2"]))
    story.append(make_table(
        ["리스크", "영향", "완화"],
        [
            ["LLM JSON 파싱 실패", "리뷰/수정 불가", "다중 parse 폴백, json_object 모드, 재시도"],
            ["Rate Limit (429)", "기능 중단", "모델 순환 폴백, 안내 메시지"],
            ["Key 유출", "과금·남용", "sessionStorage, 향후 BFF 프록시"],
            ["잘못된 수정 적용", "코드 손상", "confirm 다이얼로그, 복사 분리"],
            ["localStorage 용량", "데이터 손실", "메시지 상한, 향후 서버 저장"],
        ],
        [42 * mm, 40 * mm, 90 * mm],
        styles,
    ))

    story.append(P("10.3 로드맵 (제안)", styles["h2"]))
    story.append(make_table(
        ["Phase", "내용", "산출"],
        [
            ["P0 (현재)", "단일 HTML 프로토타입 완성", "codereview-ai.html"],
            ["P1", "문서화 + 프론트 모듈 분리 (본 문서)", "PRD/기능/API Spec PDF"],
            ["P2", "웹 앱 스캐폴딩 (Vite+React 등) + BFF", "배포 가능한 웹"],
            ["P3", "계정·서버 저장 채팅/협업", "멀티 디바이스 동기화"],
            ["P4", "실 Git 연동 / 팀 워크스페이스", "프로덕션 협업"],
        ],
        [32 * mm, 80 * mm, 60 * mm],
        styles,
    ))

    story.append(PageBreak())


# ── PART B: Functional Spec ────────────────────────────────────────

def build_func_spec(styles, story):
    story.append(part_banner("PART B", "기능명세서 (Functional Specification)", styles))
    story.append(spacer(12))

    story.append(P("1. 기능 목록 총괄", styles["h1"]))
    story.append(hr())
    story.append(make_table(
        ["ID", "기능명", "우선순위", "모듈"],
        [
            ["F-01", "API Key 등록/검증/복원", "P0", "Auth/Key"],
            ["F-02", "코드 에디터 (입력·줄번호·Tab)", "P0", "Editor"],
            ["F-03", "언어 선택 및 자동 감지", "P0", "Editor"],
            ["F-04", "샘플 코드 칩", "P1", "Editor"],
            ["F-05", "AI 코드 리뷰", "P0", "Review"],
            ["F-06", "점수 카드 상세 펼침", "P1", "Review"],
            ["F-07", "AI 오류 수정", "P0", "Fix"],
            ["F-08", "수정 코드 복사/에디터 적용", "P0", "Fix"],
            ["F-09", "AI 자동 최적화 (60점 미만)", "P1", "Optimize"],
            ["F-10", "코드 실행 (Piston)", "P0", "Execute"],
            ["F-11", "stdin / 실행 결과 패널", "P1", "Execute"],
            ["F-12", "GitHub 파일 로드", "P1", "GitHub"],
            ["F-13", "AI 챗봇 + 프로젝트/채팅 관리", "P0", "Chat"],
            ["F-14", "챗봇 코드블록 에디터 적용", "P1", "Chat"],
            ["F-15", "협업 저장소 CRUD", "P1", "Collab"],
            ["F-16", "브랜치 생성/삭제", "P1", "Collab"],
            ["F-17", "PR 생성/닫기/머지", "P0", "Collab"],
            ["F-18", "Diff + 인라인 코멘트/리액션", "P1", "Collab"],
            ["F-19", "PR 승인 및 머지 규칙", "P0", "Collab"],
            ["F-20", "PR AI 하이브리드 리뷰", "P0", "Collab/AI"],
            ["F-21", "활동 로그", "P2", "Collab"],
            ["F-22", "모델 폴백 및 상태 뱃지", "P1", "LLM Gateway"],
        ],
        [18 * mm, 70 * mm, 22 * mm, 62 * mm],
        styles,
    ))
    story.append(P("우선순위: P0=필수, P1=중요, P2=있으면 좋음", styles["caption"]))

    # F-01 detail
    story.append(P("2. 모듈별 상세 기능 명세", styles["h1"]))
    story.append(hr())

    def feature(fid, name, purpose, actors, pre, main_flow, alt, post, ui, rules, styles=styles, story=story):
        story.append(P(f"{fid} {name}", styles["h2"]))
        story.append(P(f"<b>목적</b>: {purpose}", styles["body_left"]))
        story.append(P(f"<b>액터</b>: {actors}", styles["body_left"]))
        story.append(P(f"<b>사전조건</b>: {pre}", styles["body_left"]))
        story.append(P("<b>기본 흐름</b>", styles["h3"]))
        for i, s in enumerate(main_flow, 1):
            story.append(P(f"{i}. {s}", styles["bullet"]))
        if alt:
            story.append(P("<b>대안/예외 흐름</b>", styles["h3"]))
            for s in alt:
                story.append(P(f"• {s}", styles["bullet"]))
        story.append(P(f"<b>사후조건</b>: {post}", styles["body_left"]))
        story.append(P(f"<b>UI</b>: {ui}", styles["body_left"]))
        if rules:
            story.append(P("<b>비즈니스 규칙</b>", styles["h3"]))
            for r in rules:
                story.append(P(f"• {r}", styles["bullet"]))

    feature(
        "F-01", "API Key 등록/검증/복원",
        "Groq API 사용을 위한 사용자 키를 안전하게 세션에 보관하고 인증 실패를 방지한다.",
        "사용자",
        "브라우저 접속",
        [
            "상단 키 배너에 gsk_ 로 시작하는 키 입력",
            "저장 클릭 또는 Enter",
            "형식 검증 후 sessionStorage에 저장",
            "배너 숨김 및 성공 메시지 표시",
        ],
        [
            "gsk_ 미시작 → 알림 후 저장 거부",
            "다른 탭에서 키 변경 시 500ms 폴링으로 동기화",
            "키 없을 때 리뷰/수정/챗/AI 호출 → 배너 재표시 및 포커스",
        ],
        "GROQ_KEY 메모리 변수 및 sessionStorage 동기화",
        "#key-banner, #groq-key, #save-key-btn",
        ["키는 서버로 전송하지 않음(As-Is). 요청 시 Authorization Bearer로만 사용."],
    )

    feature(
        "F-02~F-04", "코드 에디터 · 언어 · 샘플",
        "사용자가 분석 대상 코드를 입력·선택하고 언어 컨텍스트를 설정한다.",
        "사용자",
        "앱 로드 완료",
        [
            "textarea에 코드 입력 → 줄번호 동기 갱신",
            "Tab 키 시 스페이스 2칸 삽입",
            "입력 후 800ms 디바운스로 언어 자동 감지 및 select 갱신",
            "샘플 칩 클릭 시 해당 Python 샘플 로드",
        ],
        ["감지 실패 시 기존 언어 유지"],
        "cta 값, lsel 값, 줄번호 DOM 갱신",
        "#cta, #lnums, #lsel, #chips-wrap",
        [
            "초기 샘플: buggy (보안/성능 이슈 데모 코드)",
            "샘플 목록: split, bubble, fib, bsearch, linked, buggy, syntax",
        ],
    )

    feature(
        "F-05~F-06", "AI 코드 리뷰",
        "코드 품질을 다축 평가하고 실행 가능한 개선 제안을 제공한다.",
        "사용자, Groq LLM",
        "유효 API Key, 비어 있지 않은 코드",
        [
            "「코드 리뷰」 클릭",
            "우측 리뷰 탭 전환, 로딩 스텝 표시",
            "callGroq JSON 모드로 분석 요청",
            "응답 파싱 후 총점·등급·4축 카드·섹션 렌더",
            "카드 클릭 시 reason/problems/tips 펼침",
        ],
        [
            "401 → API 키 오류 메시지",
            "429 → 다음 모델로 재시도",
            "파싱 실패 → err-box",
        ],
        "리뷰 결과 UI 표시. total&lt;60 이면 최적화 버튼 노출",
        "#runbtn, #rp-review, #eval-banner, #score-cards, #rc",
        [
            "등급 매핑: A≥80, B≥70, C≥60, D≥50, else F (응답 grade 우선)",
            "섹션: 복잡도, 스타일, 버그, 리팩토링, 알고리즘, 자료구조",
            "severity: error | warning | info | success",
        ],
    )

    story.append(PageBreak())

    feature(
        "F-07~F-08", "AI 오류 수정",
        "문법·로직·런타임·보안·타입 오류를 탐지하고 수정된 전체 코드를 제공한다.",
        "사용자, Groq LLM",
        "유효 API Key, 코드 존재",
        [
            "「오류 수정」 클릭 → 우측 fix 탭",
            "LLM에 오류 목록+fixed_full_code JSON 요청",
            "파싱 실패 시 fixed_full_code 필드 휴리스틱 추출",
            "오류 카드(Before/After) 및 전체 코드 테이블 렌더",
            "복사 또는 에디터 적용(confirm)",
        ],
        ["오류 0건 → 정상 축하 UI", "실패 → err-box"],
        "lastFixedCode 저장, fix-dot 표시(오류 있을 때)",
        "#fixbtn, #rp-fix, #fix-content",
        ["오류 타입 UI 매핑: SyntaxError, LogicError, RuntimeError, SecurityError, TypeError"],
    )

    feature(
        "F-09", "AI 자동 최적화",
        "저품질 코드에 대해 보안·성능·스타일 개선본을 생성한다.",
        "사용자, Groq LLM",
        "리뷰 총점 &lt; 60 또는 사용자가 최적화 버튼 사용 가능 상태",
        [
            "최적화 버튼 → 모달 오픈 및 로딩",
            "LLM 최적화 JSON 수신",
            "전/후 점수, changes, optimized_code 표시",
            "복사 또는 에디터 적용",
        ],
        ["파싱 실패 시 optimized_code 정규식 폴백"],
        "lastOptCode 설정",
        "#opt-btn, #opt-overlay",
        ["change.type: fix | improve | style"],
    )

    feature(
        "F-10~F-11", "코드 실행",
        "지원 언어 코드를 원격 런타임에서 실행하고 출력을 보여준다.",
        "사용자, Piston API",
        "코드 존재, 지원 언어",
        [
            "「실행」 클릭 (필요 시 언어 자동 감지 반영)",
            "실행 패널 open, running 상태",
            "Piston /execute POST",
            "compile/run stdout·stderr·exit code·소요시간 표시",
        ],
        [
            "미지원 언어 → 안내",
            "네트워크 오류 → 친화적 메시지",
            "복사/지우기/닫기 툴 제공",
        ],
        "실행 결과 패널 갱신",
        "#execbtn, #exec-panel, #stdin-input, #exec-output",
        [
            "런타임 버전 고정 맵(LRT) 사용",
            "stdin은 input() 등에 전달",
        ],
    )

    feature(
        "F-12", "GitHub 파일 로드",
        "GitHub blob URL의 파일 내용을 에디터로 가져온다.",
        "사용자, GitHub",
        "공개 URL 또는 유효 토큰",
        [
            "URL 입력 (선택 토큰)",
            "github.com/.../blob/... → raw.githubusercontent.com 변환",
            "fetch 후 에디터 채움",
        ],
        ["HTTP 오류 → alert"],
        "에디터 탭 전환 및 코드 설정",
        "#lp-github, #ghurl, #ghtok",
        ["토큰은 Authorization: token 헤더로만 사용"],
    )

    feature(
        "F-13~F-14", "AI 챗봇",
        "코드 구현·설명·최적화를 대화형으로 지원하고 히스토리를 영속화한다.",
        "사용자, Groq LLM",
        "유효 API Key",
        [
            "채팅 탭 → 메시지 입력/제안 칩",
            "현재 에디터 코드를 컨텍스트로 첨부",
            "history 최대 20턴 유지",
            "응답 마크다운 간단 렌더, 코드블록 추출 시 적용 버튼",
            "localStorage cr_chats_v3 저장",
        ],
        ["첫 메시지 시 채팅 제목 자동 생성(22자)", "프로젝트 폴더로 채팅 그룹화"],
        "채팅 메시지·history 저장",
        "#lp-chat, #chat-msgs, #chat-input",
        [
            "store: projects[], chats[], activeChatId",
            "chat: id, title, projectId, history[], messages[], timestamps",
        ],
    )

    story.append(PageBreak())

    feature(
        "F-15~F-16", "협업 저장소·브랜치",
        "로컬 시뮬레이션 저장소와 브랜치를 관리한다.",
        "사용자 (ME='me')",
        "협업 패널 오픈",
        [
            "새 저장소: 이름/설명/멤버 → main 브랜치 자동 생성",
            "브랜치 생성/삭제(default 제외)",
            "검색으로 저장소 필터",
        ],
        [],
        "localStorage codereview_collab_v2 갱신 + 활동 로그",
        "#collab-panel, #cb-repo-list",
        ["시드 데이터: demo-project + feature/ai-review PR"],
    )

    feature(
        "F-17~F-19", "PR · Diff · 승인 · 머지",
        "변경 전후 코드 기반 PR 워크플로를 제공한다.",
        "작성자, 리뷰어",
        "저장소·브랜치 존재",
        [
            "PR 생성: 제목, src/tgt, 설명, 리뷰어, before/after",
            "Diff(LCS) unified + side-by-side",
            "라인 클릭 인라인 코멘트, 리액션 토글",
            "리뷰어 승인 시 approvals에 ME 추가",
            "approvals.length ≥ minApprovals 이면 Merge 가능",
            "Merge 시 status=merged, 옵션에 따라 소스 브랜치 삭제",
        ],
        ["Close → status=closed"],
        "PR 상태·로그·브랜치 갱신",
        "PR 모달, PR 상세 서브탭",
        [
            "mergeRules: requireApproval, minApprovals, requireCI, deleteBranch",
            "requireCI는 UI 토글만 존재(실행 연동 없음, As-Is)",
            "status: open | merged | closed",
        ],
    )

    feature(
        "F-20", "PR AI 하이브리드 리뷰",
        "AI가 PR diff를 1차 분석하고 사람이 항목 단위로 판단·최종 승인한다.",
        "리뷰어, Groq LLM",
        "open PR, API Key",
        [
            "AI 분석 시작 → before/after 기반 JSON 리뷰",
            "score 및 category items 표시",
            "항목별 수락/무시/논의(hd 필드)",
            "사람 노트와 함께 승인 / 수정 요청 / AI 무시 강제 승인",
        ],
        ["모델 3단 폴백", "키 없으면 alert"],
        "pr.aiReviews[] push, activity/log 기록",
        "PR 상세 AI 탭, AI 허브 탭",
        [
            "category: bug|performance|style|security|test",
            "severity: error|warning|info|suggestion",
            "human decision: accept|reject|discuss",
        ],
    )

    feature(
        "F-22", "모델 폴백 및 상태 뱃지",
        "Rate limit·장애 시 가용 모델로 전환하고 UI에 상태를 표시한다.",
        "시스템",
        "LLM 호출",
        [
            "기본 모델부터 요청",
            "HTTP 429 시 modelIdx 증가 후 1초 대기 재시도",
            "모든 모델 실패 시 에러",
            "헤더 모델 뱃지·Ready/Analyzing/Fixing 상태 갱신",
        ],
        [],
        "modelIdx 갱신",
        "#model-badge, #sbadge",
        [
            "모델 목록: llama-3.3-70b-versatile, llama-3.1-8b-instant, gemma2-9b-it, mixtral-8x7b-32768",
            "temperature 기본 0.1, max_tokens 리뷰 8192 / AI PR 3000",
        ],
    )

    # 3 data model
    story.append(P("3. 데이터 모델 (클라이언트)", styles["h1"]))
    story.append(hr())
    story.append(P("3.1 채팅 스토어 (localStorage: cr_chats_v3)", styles["h2"]))
    story.append(P(
        "Store { projects: Project[], chats: Chat[], activeChatId: string|null }<br/>"
        "Project { id, name, color, chatIds[], collapsed }<br/>"
        "Chat { id, title, projectId, history: {role,content}[], messages: {role,html,time,code}[], createdAt, updatedAt }",
        styles["code"],
    ))

    story.append(P("3.2 협업 스토어 (localStorage: codereview_collab_v2)", styles["h2"]))
    story.append(P(
        "CollabState { repos[], branches[], prs[], log[] }<br/>"
        "Repo { id, name, desc, owner, members[], color, emoji, mergeRules, createdAt }<br/>"
        "Branch { id, repoId, name, isDefault, author, commits, lastCommit, updatedAt }<br/>"
        "PR { id, repoId, title, desc, src, tgt, author, reviewers[], status, approvals[], "
        "before, after, comments[], activity[], aiReviews[], createdAt }<br/>"
        "Comment { id, lineNum, content, author, reactions, createdAt }<br/>"
        "AIReview { id, model, score, bugScore, perfScore, styleScore, secScore, testScore, "
        "summary, items[], humanApproved, createdAt }",
        styles["code"],
    ))

    story.append(P("3.3 세션 (sessionStorage)", styles["h2"]))
    story.append(P("groq_key: string  // gsk_... 형식의 Groq API Key", styles["code"]))

    # 4 state
    story.append(P("4. 권한 · 상태 전이", styles["h1"]))
    story.append(hr())
    story.append(P("4.1 PR 상태 전이", styles["h2"]))
    story.append(P(
        "open --(merge, 승인조건 충족)--> merged<br/>"
        "open --(close)--> closed<br/>"
        "merged/closed 는 단말 상태 (As-Is 재오픈 없음)",
        styles["code"],
    ))
    story.append(P("4.2 권한 (As-Is 단순 모델)", styles["h2"]))
    story.append(make_table(
        ["행위", "조건"],
        [
            ["저장소 생성", "누구나 (로컬 ME)"],
            ["PR 승인", "reviewers에 ME 포함 & 아직 미승인"],
            ["Merge 버튼", "status=open & approvals ≥ minApprovals"],
            ["브랜치 삭제", "isDefault=false"],
            ["강제 승인", "AI 탭에서 사용자 confirm"],
        ],
        [50 * mm, 122 * mm],
        styles,
    ))

    # 5 errors
    story.append(P("5. 예외 및 오류 처리", styles["h1"]))
    story.append(hr())
    story.append(make_table(
        ["상황", "사용자 메시지/동작"],
        [
            ["키 없음", "키 배너 표시, needKey() true"],
            ["키 형식 오류", "gsk_ 시작 안내 alert"],
            ["401 Unauthorized", "API 키 인증 실패 안내"],
            ["429 Rate Limit", "다음 모델 자동 전환 재시도"],
            ["JSON 파싱 실패", "err-box 또는 필드 휴리스틱 폴백"],
            ["Piston 네트워크 오류", "인터넷 확인 안내"],
            ["GitHub fetch 실패", "HTTP status alert"],
            ["빈 코드 실행/리뷰", "입력 요청 alert"],
            ["에디터 적용", "confirm 후 교체, 1.5s 그린 아웃라인"],
        ],
        [48 * mm, 124 * mm],
        styles,
    ))

    story.append(PageBreak())


# ── PART C: API Spec ───────────────────────────────────────────────

def build_api_spec(styles, story):
    story.append(part_banner("PART C", "API명세서 (API Specification)", styles))
    story.append(spacer(12))

    story.append(P("1. 외부 API 연동 개요", styles["h1"]))
    story.append(hr())
    story.append(make_table(
        ["API", "Base URL", "용도", "인증"],
        [
            ["Groq Chat", "https://api.groq.com/openai/v1", "리뷰·수정·챗·PR AI", "Bearer groq_key"],
            ["Piston", "https://emkc.org/api/v2/piston", "코드 실행", "없음"],
            ["GitHub Raw", "https://raw.githubusercontent.com", "파일 내용", "Optional token"],
        ],
        [32 * mm, 58 * mm, 42 * mm, 40 * mm],
        styles,
    ))
    story.append(P(
        "본 절은 As-Is 클라이언트 직접 호출 규약을 정의한다. To-Be에서는 동일 계약을 BFF가 중계한다.",
        styles["body"],
    ))

    # Groq
    story.append(P("2. Groq Chat Completions", styles["h1"]))
    story.append(hr())
    story.append(P("2.1 엔드포인트", styles["h2"]))
    story.append(P("<b>POST</b> /openai/v1/chat/completions", styles["body_left"]))

    story.append(P("2.2 Request Headers", styles["h2"]))
    story.append(make_table(
        ["Header", "값", "필수"],
        [
            ["Authorization", "Bearer {GROQ_KEY}", "Y"],
            ["Content-Type", "application/json", "Y"],
        ],
        [40 * mm, 90 * mm, 42 * mm],
        styles,
    ))

    story.append(P("2.3 Request Body", styles["h2"]))
    story.append(make_table(
        ["필드", "타입", "설명"],
        [
            ["model", "string", "모델 ID (폴백 목록 중 하나)"],
            ["messages", "array", "[{role, content}] OpenAI 호환"],
            ["temperature", "number", "기본 0.1"],
            ["max_tokens", "number", "리뷰 8192, 챗 8192, PR AI 3000"],
            ["response_format", "object", "선택. {type:\"json_object\"} 리뷰 시"],
        ],
        [40 * mm, 28 * mm, 104 * mm],
        styles,
    ))

    story.append(P("2.4 사용 모델", styles["h2"]))
    story.append(make_table(
        ["순서", "model id", "표시 라벨"],
        [
            ["1", "llama-3.3-70b-versatile", "Llama 3.3 70B"],
            ["2", "llama-3.1-8b-instant", "Llama 3.1 8B"],
            ["3", "gemma2-9b-it", "Gemma 2 9B"],
            ["4", "mixtral-8x7b-32768", "Mixtral 8x7B"],
        ],
        [22 * mm, 70 * mm, 80 * mm],
        styles,
    ))
    story.append(P("PR AI 탭 전용 폴백 목록에는 Mixtral 미포함 (1~3만 사용).", styles["small"]))

    story.append(P("2.5 Response (성공)", styles["h2"]))
    story.append(P(
        "OpenAI 호환 JSON. 클라이언트는 choices[0].message.content 문자열만 사용한다.",
        styles["body"],
    ))
    story.append(P(
        "{ \"choices\": [ { \"message\": { \"role\": \"assistant\", \"content\": \"...\" } } ] }",
        styles["code"],
    ))

    story.append(P("2.6 Error Handling", styles["h2"]))
    story.append(make_table(
        ["HTTP", "클라이언트 동작"],
        [
            ["401", "Error: API 키 인증 실패"],
            ["429", "modelIdx++ , 1s wait, 다음 모델 재시도 (최대 모델 수)"],
            ["기타 4xx/5xx", "body.error.message 또는 HTTP {status} throw"],
            ["네트워크", "fetch rejection → UI err-box"],
        ],
        [32 * mm, 140 * mm],
        styles,
    ))

    story.append(P("2.7 기능별 messages 계약", styles["h2"]))
    story.append(make_table(
        ["기능", "system", "user 요약", "jsonMode"],
        [
            ["코드 리뷰", "수석 엔지니어. 순수 JSON", "언어+코드 + scores/sections 스키마", "true"],
            ["오류 수정", "오류 수정 전문가. JSON", "코드 + errors/fixed_full_code 스키마", "false"],
            ["최적화", "수석 엔지니어. JSON", "원본 코드 + optimized_code 스키마", "false"],
            ["챗봇", "전문 코드 AI. 한국어", "history + 에디터 코드 컨텍스트", "false"],
            ["PR AI", "코드 리뷰 AI. JSON", "PR 제목 + before/after", "false"],
        ],
        [28 * mm, 48 * mm, 68 * mm, 28 * mm],
        styles,
    ))

    # Piston
    story.append(P("3. Piston Code Execution", styles["h1"]))
    story.append(hr())
    story.append(P("3.1 엔드포인트", styles["h2"]))
    story.append(P("<b>POST</b> https://emkc.org/api/v2/piston/execute", styles["body_left"]))

    story.append(P("3.2 Request Body", styles["h2"]))
    story.append(P(
        "{ \"language\": \"python\", \"version\": \"3.10.0\", "
        "\"files\": [{ \"name\": \"main.py\", \"content\": \"...\" }], "
        "\"stdin\": \"optional\" }",
        styles["code"],
    ))
    story.append(make_table(
        ["필드", "타입", "설명"],
        [
            ["language", "string", "Piston 언어 식별자"],
            ["version", "string", "고정 런타임 버전"],
            ["files", "array", "[{name, content}] 실행 파일"],
            ["stdin", "string", "선택. 표준 입력"],
        ],
        [32 * mm, 28 * mm, 112 * mm],
        styles,
    ))

    story.append(P("3.3 언어 런타임 매핑 (LRT)", styles["h2"]))
    story.append(make_table(
        ["UI 언어", "Piston language", "version", "filename"],
        [
            ["python", "python", "3.10.0", "main.py"],
            ["javascript", "javascript", "18.15.0", "main.js"],
            ["typescript", "typescript", "5.0.3", "main.ts"],
            ["java", "java", "15.0.2", "Main.java"],
            ["c", "c", "10.2.0", "main.c"],
            ["cpp", "c++", "10.2.0", "main.cpp"],
            ["go", "go", "1.16.2", "main.go"],
            ["rust", "rust", "1.50.0", "main.rs"],
            ["sql", "sqlite3", "3.36.0", "main.sql"],
        ],
        [36 * mm, 40 * mm, 36 * mm, 60 * mm],
        styles,
    ))

    story.append(P("3.4 Response (사용 필드)", styles["h2"]))
    story.append(make_table(
        ["경로", "설명"],
        [
            ["run.stdout", "표준 출력"],
            ["run.stderr", "런타임 에러"],
            ["run.code", "프로세스 종료 코드 (0=성공)"],
            ["compile.stdout / compile.stderr", "컴파일 단계 출력(C/Java 등)"],
        ],
        [60 * mm, 112 * mm],
        styles,
    ))

    story.append(PageBreak())

    # GitHub
    story.append(P("4. GitHub Raw Content", styles["h1"]))
    story.append(hr())
    story.append(P("4.1 URL 변환 규칙", styles["h2"]))
    story.append(P(
        "입력: https://github.com/{user}/{repo}/blob/{branch}/{path}<br/>"
        "변환: https://raw.githubusercontent.com/{user}/{repo}/{branch}/{path}<br/>"
        "(구현: host 치환 + '/blob/' → '/' )",
        styles["code"],
    ))
    story.append(P("4.2 Request", styles["h2"]))
    story.append(make_table(
        ["항목", "내용"],
        [
            ["Method", "GET"],
            ["Headers", "선택 Authorization: token {ghtok}"],
            ["Response", "text/plain 파일 본문"],
        ],
        [36 * mm, 136 * mm],
        styles,
    ))

    # Prompt schemas
    story.append(P("5. 프롬프트 계약 (JSON Schema — 논리)", styles["h1"]))
    story.append(hr())
    story.append(P(
        "LLM이 반환해야 하는 JSON 형태. 런타임 JSON Schema 검증은 없으나 클라이언트가 이 구조를 기대한다.",
        styles["body"],
    ))

    story.append(P("5.1 코드 리뷰 응답", styles["h2"]))
    story.append(P(
        "{\n"
        "  \"scores\": { \"total\", \"style\", \"performance\", \"safety\", \"readability\", \"grade\", \"summary\" },\n"
        "  \"score_details\": {\n"
        "    \"style|performance|safety|readability\": {\n"
        "      \"reason\", \"problems\": [], \"tips\": [{ \"title\", \"desc\", \"code\" }]\n"
        "    }\n"
        "  },\n"
        "  \"style\": [{ \"severity\", \"title\", \"description\", \"suggestion\" }],\n"
        "  \"complexity\": { \"time\", \"space\", \"rating\", \"explanation\", \"items\": [] },\n"
        "  \"bugs\": [], \"refactoring\": [], \"algorithms\": [], \"datastructures\": []\n"
        "}",
        styles["code"],
    ))

    story.append(P("5.2 오류 수정 응답", styles["h2"]))
    story.append(P(
        "{\n"
        "  \"has_errors\": true,\n"
        "  \"error_count\": 2,\n"
        "  \"summary\": \"...\",\n"
        "  \"errors\": [{\n"
        "    \"type\": \"SyntaxError|LogicError|RuntimeError|SecurityError|TypeError\",\n"
        "    \"line\": 3, \"original\": \"...\", \"problem\": \"...\", \"fix\": \"...\", \"fixed_code\": \"...\"\n"
        "  }],\n"
        "  \"fixed_full_code\": \"...\"\n"
        "}",
        styles["code"],
    ))

    story.append(P("5.3 최적화 응답", styles["h2"]))
    story.append(P(
        "{\n"
        "  \"summary\", \"score_before\", \"score_after\",\n"
        "  \"changes\": [{ \"type\": \"fix|improve|style\", \"title\", \"detail\" }],\n"
        "  \"optimized_code\": \"...\"\n"
        "}",
        styles["code"],
    ))

    story.append(P("5.4 PR AI 리뷰 응답", styles["h2"]))
    story.append(P(
        "{\n"
        "  \"score\", \"bugScore\", \"perfScore\", \"styleScore\", \"secScore\", \"testScore\",\n"
        "  \"summary\",\n"
        "  \"items\": [{\n"
        "    \"id\", \"category\": \"bug|performance|style|security|test\",\n"
        "    \"severity\": \"error|warning|info|suggestion\",\n"
        "    \"title\", \"description\", \"line\", \"suggestion\"\n"
        "  }]  // 2~6개 권장\n"
        "}",
        styles["code"],
    ))

    story.append(P("5.5 JSON 파싱 폴백 순서 (parseJSON)", styles["h2"]))
    for i, s in enumerate([
        "JSON.parse(raw)",
        "```json 펜스 제거 후 parse",
        "일반 ``` 펜스 제거 후 parse",
        "첫 '{' ~ 마지막 '}' 슬라이스 후 parse",
        "기능별 추가: fixed_full_code / optimized_code 필드 정규식 추출",
    ], 1):
        story.append(P(f"{i}. {s}", styles["bullet"]))

    # Future BFF
    story.append(P("6. 향후 백엔드 API 설계 초안 (To-Be)", styles["h1"]))
    story.append(hr())
    story.append(P(
        "웹 정식 구현 시 클라이언트에 Key를 두지 않도록 BFF를 둔다. 아래는 권장 REST 초안이다.",
        styles["body"],
    ))

    story.append(P("6.1 공통", styles["h2"]))
    story.append(make_table(
        ["항목", "규약"],
        [
            ["Base Path", "/api/v1"],
            ["Auth", "Authorization: Bearer {access_token} (사용자 세션)"],
            ["Content-Type", "application/json"],
            ["에러 포맷", "{ \"error\": { \"code\", \"message\", \"details?\" } }"],
            ["Rate Limit", "X-RateLimit-* 헤더, 429 + Retry-After"],
        ],
        [40 * mm, 132 * mm],
        styles,
    ))

    story.append(P("6.2 AI 프록시", styles["h2"]))
    story.append(make_table(
        ["Method", "Path", "설명"],
        [
            ["POST", "/ai/review", "코드 리뷰. body: {language, code} → ReviewJSON"],
            ["POST", "/ai/fix", "오류 수정. body: {language, code} → FixJSON"],
            ["POST", "/ai/optimize", "최적화. body: {language, code} → OptJSON"],
            ["POST", "/ai/chat", "챗 완성. body: {messages, language?, code?} → text"],
            ["POST", "/ai/pr-review", "PR AI. body: {title, before, after} → AIReviewJSON"],
        ],
        [22 * mm, 40 * mm, 110 * mm],
        styles,
    ))

    story.append(P("6.3 실행 프록시", styles["h2"]))
    story.append(make_table(
        ["Method", "Path", "설명"],
        [
            ["POST", "/execute", "body: {language, code, stdin?} → {stdout, stderr, code, time}"],
            ["GET", "/execute/runtimes", "지원 언어·버전 목록"],
        ],
        [22 * mm, 45 * mm, 105 * mm],
        styles,
    ))

    story.append(P("6.4 채팅·프로젝트 (서버 영속)", styles["h2"]))
    story.append(make_table(
        ["Method", "Path", "설명"],
        [
            ["GET", "/projects", "프로젝트 목록"],
            ["POST", "/projects", "프로젝트 생성"],
            ["DELETE", "/projects/{id}", "프로젝트 삭제"],
            ["GET", "/chats", "채팅 목록 (?projectId)"],
            ["POST", "/chats", "채팅 생성"],
            ["GET", "/chats/{id}", "메시지 포함 상세"],
            ["POST", "/chats/{id}/messages", "메시지 전송(서버가 LLM 호출 가능)"],
            ["DELETE", "/chats/{id}", "채팅 삭제"],
        ],
        [22 * mm, 52 * mm, 98 * mm],
        styles,
    ))

    story.append(P("6.5 협업 (서버 영속)", styles["h2"]))
    story.append(make_table(
        ["Method", "Path", "설명"],
        [
            ["GET/POST", "/repos", "저장소 목록/생성"],
            ["GET/POST", "/repos/{id}/branches", "브랜치"],
            ["GET/POST", "/repos/{id}/prs", "PR 목록/생성"],
            ["GET", "/prs/{id}", "PR 상세"],
            ["POST", "/prs/{id}/comments", "코멘트"],
            ["POST", "/prs/{id}/approve", "승인"],
            ["POST", "/prs/{id}/merge", "머지"],
            ["POST", "/prs/{id}/close", "닫기"],
            ["POST", "/prs/{id}/ai-reviews", "AI 리뷰 실행·저장"],
            ["PATCH", "/ai-reviews/{id}/items/{itemId}", "수락/무시/논의"],
            ["GET", "/repos/{id}/activity", "활동 로그"],
        ],
        [28 * mm, 62 * mm, 82 * mm],
        styles,
    ))

    story.append(P("6.6 내부 시퀀스 예: 코드 리뷰", styles["h2"]))
    story.append(P(
        "Client → POST /api/v1/ai/review {language, code}<br/>"
        "BFF → validate auth, size limit, inject system prompt<br/>"
        "BFF → Groq chat/completions (json_object, model fallback)<br/>"
        "BFF → parseJSON + optional schema validate<br/>"
        "BFF → Client 200 ReviewJSON",
        styles["code"],
    ))

    story.append(PageBreak())

    # Appendix
    story.append(P("부록. 용어집 · 참고", styles["h1"]))
    story.append(hr())
    story.append(P("A. 용어집", styles["h2"]))
    story.append(make_table(
        ["용어", "설명"],
        [
            ["PRD", "Product Requirements Document. 제품 요구사항 정의서"],
            ["BFF", "Backend for Frontend. 프론트 전용 API 게이트웨이"],
            ["Piston", "오픈소스 원격 코드 실행 엔진 (emkc 호스팅 인스턴스 사용)"],
            ["Groq", "고속 LLM 추론 API 제공 플랫폼"],
            ["하이브리드 리뷰", "AI 1차 분석 + 사람 최종 판단 워크플로"],
            ["LCS Diff", "Longest Common Subsequence 기반 라인 diff"],
            ["jsonMode", "Groq response_format=json_object 요청"],
            ["ME", "협업 시뮬레이터의 현재 사용자 식별자 ('me')"],
        ],
        [36 * mm, 136 * mm],
        styles,
    ))

    story.append(P("B. 현재 소스 기준 파일", styles["h2"]))
    story.append(P(
        "codereview-ai.html — CSS + 메인 UI + Script1(리뷰/수정/실행/챗) + 협업 UI + Script2",
        styles["body"],
    ))

    story.append(P("C. 참고 링크", styles["h2"]))
    for it in [
        "Groq Console Keys: https://console.groq.com/keys",
        "Groq OpenAI-compatible API: https://api.groq.com/openai/v1/chat/completions",
        "Piston API: https://github.com/engineer-man/piston",
        "Piston Execute Host: https://emkc.org/api/v2/piston/execute",
    ]:
        story.append(P(f"• {it}", styles["bullet"]))

    story.append(spacer(16))
    story.append(hr())
    story.append(P(
        f"문서 끝 — CodeReview AI Spec v1.0 · {date.today().isoformat()} · "
        "본 문서는 웹 구현의 기준 산출물이며, 구현 변경 시 버전을 갱신한다.",
        styles["caption"],
    ))


def main():
    styles = build_styles()
    story = []

    build_cover(styles, story)
    build_toc(styles, story)
    build_prd(styles, story)
    build_func_spec(styles, story)
    build_api_spec(styles, story)

    doc = SimpleDocTemplate(
        str(OUT_PDF),
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=20 * mm,
        bottomMargin=18 * mm,
        title="CodeReview AI — PRD · 기능명세서 · API명세서",
        author="CodeReview AI Project",
        subject="Product Requirements, Functional Spec, API Spec",
    )
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"Wrote: {OUT_PDF}")
    print(f"Pages estimated via file size: {OUT_PDF.stat().st_size} bytes")


if __name__ == "__main__":
    main()
