# CLAUDE.md

## Project
KITA 제주지부 세미나·교육 운영을 위한 경량 웹 시스템.
종이 명단·수기 서명을 QR 기반 모바일 체크인으로 대체하고, 같은 툴에서 Q&A와 설문조사를 제공한다.

## Context
- 운영 기관: 한국무역협회 제주지부
- 관리자: 비개발자 1~3명 (VS Code + Claude Code로 유지보수)
- 참석자: 제주 수출기업 임직원, 중장년층 다수
- 규모: 회당 최대 200명, 연 10~30회
- 언어: 한국어 (영어는 추후 확장)

## Core Principles (우선순위 순)
1. [MUST] 운영 안정성 > 기능 풍부함
2. [MUST] 비개발자도 행사 직전 5분 안에 QR 생성·배포 가능해야 함
3. [MUST] 개인정보 최소 수집, 보관기간 1년 후 자동 비식별화
4. [MUST] MVP는 "작동하는 운영 흐름" 완성이 최우선. 고급 기능은 `Future` 섹션으로
5. [SHOULD] 토큰 효율 우선 — 불필요한 장황한 코드·과공학 지양
6. [SHOULD] 모바일 우선, 데스크톱은 관리자 화면만

## Confirmed Design Decisions
- 참석자 인증: **이름 + 휴대폰 뒤 4자리**
- 동명이인+뒤4자리 중복 시: **이메일 마스킹으로 본인 선택** (예: `abc***@gmail.com`)
- QR: **정적 QR + 체크인 시간창 제한** (행사 시작 30분 전 ~ 종료 후 30분)
- 등록자 구조: **Registration 단일 엔티티** (Participant 마스터 없음)
- 설문: **자체 설문 + Google Forms 링크 병존** (행사별 운영자 선택)
- 휴대폰 번호: **전체 저장 (암호화) + 1년 후 자동 비식별화(해시 대체)**

## Tech Stack (결정 확정, 변경 금지)
- Frontend: Next.js (App Router) + Tailwind CSS
- Backend: Next.js Route Handlers
- DB & Auth: Supabase (PostgreSQL + Auth + RLS)
- Hosting: Vercel
- Language: TypeScript (`any` 금지)

## Detailed Docs
상세 내용은 아래 문서를 참조한다. Claude는 필요한 문서만 읽어 컨텍스트를 절약한다.
- `docs/ARCHITECTURE.md` — 폴더 구조, 레이어 책임
- `docs/DATA_MODEL.md` — DB 스키마, 엔티티 관계
- `docs/DOMAIN_RULES.md` — 체크인·Q&A·설문 비즈니스 규칙
- `docs/SECURITY.md` — 인증·개인정보·PIPA 대응

## What Claude Should Do First
새 기능 구현 요청을 받으면 순서대로:
1. 요구사항을 1~2문장으로 재정의
2. MVP인지 Future인지 분류 (Future면 구현 보류, 등록만)
3. 관련 문서(`docs/*.md`) 중 필요한 것만 읽기
4. 변경할 파일 목록과 리스크를 먼저 제시
5. 사용자 확인 후 구현 착수

## What Claude Must Avoid
- [MUST NOT] 이름+뒤4자리 검증 없이 체크인 처리
- [MUST NOT] 관리자 인증 없는 운영 API 생성
- [MUST NOT] 익명 질문 응답에 개인정보(세션 토큰 포함) 노출
- [MUST NOT] CSV 원본을 서버에 장기 저장 (업로드 즉시 DB 반영 후 파기)
- [MUST NOT] 휴대폰 번호를 평문으로 DB 저장
- [MUST NOT] 클라이언트에서 Prisma/Supabase service_role 키 사용
- [MUST NOT] MVP 범위 밖 기능을 기본 구현에 포함
- [MUST NOT] 화면부터 만들고 데이터 모델을 나중에 맞추기

## Decision Heuristics (기능 우선순위 판단)
1. 행사 당일 운영에 직접 필요한가?
2. 실수·대리체크인·남용을 줄이는가?
3. 비개발자가 쉽게 쓸 수 있는가?
4. 개인정보 리스크가 낮은가?
5. 토큰·연산 비용이 과하지 않은가?

## Response Style with User
- 사용자는 비개발자다. 코드는 꼭 필요한 부분만 보여준다.
- 긴 설명보다 "무엇을 / 왜 / 어떻게" 3줄 요약 우선
- 전문용어는 첫 등장 시 짧게 해설
- 불확실한 부분은 "가정"이라고 명시
