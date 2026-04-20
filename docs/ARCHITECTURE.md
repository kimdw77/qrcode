# ARCHITECTURE.md

## Tech Stack (확정)

| 영역 | 선택 | 근거 |
|---|---|---|
| Frontend | Next.js 14+ (App Router) + Tailwind CSS | SSR/CSR 유연, Vercel 최적화 |
| Backend | Next.js Route Handlers | 별도 서버 불필요, 풀스택 단일화 |
| DB | Supabase (PostgreSQL) | 무료 티어·대시보드·RLS 내장 |
| Auth | Supabase Auth (관리자만) | Next.js 연동 성숙, 매직링크 지원 |
| Hosting | Vercel | Next.js 최적, 무료 티어로 MVP 충분 |
| Language | TypeScript (strict) | 런타임 오류 감소 |
| Validation | Zod | API 입력 검증 필수 |
| UI Lib | shadcn/ui (선택 사용) | 비개발자 유지보수 용이 |
| QR | `qrcode` npm 패키지 | 서버 사이드 생성 |

### 선택하지 않은 것과 이유
- **Prisma 미사용**: Supabase 클라이언트가 RLS와 직접 연동되어 이중 추상화 불필요. MVP 단순화.
- **NestJS 미사용**: 비개발자 유지보수 어려움. Next.js Route Handlers로 충분.
- **상태관리 라이브러리(Zustand/Redux) 미사용**: MVP는 서버 상태 위주, 클라이언트 상태 최소.

---

## Folder Structure

```
project-root/
├── CLAUDE.md                    # Claude Code 상설 지침
├── PLAN_MODE.md                 # 플랜모드 프롬프트
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── DOMAIN_RULES.md
│   └── SECURITY.md
├── .env.example
├── .env.local                   # (git 제외)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── supabase/
│   ├── migrations/              # SQL 마이그레이션 파일
│   └── seed.sql                 # 테스트 시드 데이터
├── public/
│   └── favicon.ico
└── src/
    ├── app/                     # 라우팅
    │   ├── layout.tsx
    │   ├── page.tsx             # 랜딩 (행사 코드 입력)
    │   ├── e/[token]/           # 참석자 공개 페이지
    │   │   ├── page.tsx         # 행사 홈
    │   │   ├── checkin/page.tsx
    │   │   ├── qna/page.tsx
    │   │   └── survey/page.tsx
    │   ├── admin/               # 관리자 페이지 (인증 필요)
    │   │   ├── layout.tsx       # 인증 가드
    │   │   ├── events/
    │   │   │   ├── page.tsx     # 행사 목록
    │   │   │   ├── new/page.tsx
    │   │   │   └── [id]/
    │   │   │       ├── page.tsx # 대시보드
    │   │   │       ├── participants/page.tsx
    │   │   │       ├── questions/page.tsx
    │   │   │       └── survey/page.tsx
    │   │   └── login/page.tsx
    │   └── api/
    │       ├── public/          # 참석자용 (토큰 검증)
    │       │   └── events/[token]/
    │       │       ├── checkin/route.ts
    │       │       ├── questions/route.ts
    │       │       └── survey/route.ts
    │       └── admin/           # 관리자용 (세션 검증)
    │           └── events/
    │               ├── route.ts
    │               └── [id]/
    │                   ├── participants/import/route.ts
    │                   ├── qr/route.ts
    │                   ├── dashboard/route.ts
    │                   └── export/route.ts
    ├── features/                # 도메인별 비즈니스 로직
    │   ├── events/
    │   │   ├── queries.ts       # DB 읽기
    │   │   ├── mutations.ts     # DB 쓰기
    │   │   └── schemas.ts       # Zod 검증
    │   ├── checkin/
    │   │   ├── verify.ts        # 이름+뒤4자리 검증 로직
    │   │   ├── schemas.ts
    │   │   └── state-machine.ts # 행사 상태 가드
    │   ├── questions/
    │   │   ├── queries.ts
    │   │   ├── mutations.ts
    │   │   └── schemas.ts
    │   └── surveys/
    │       ├── queries.ts
    │       ├── mutations.ts
    │       └── schemas.ts
    ├── components/              # 재사용 UI
    │   ├── ui/                  # shadcn 기본
    │   ├── EventStatusBadge.tsx
    │   ├── CheckinForm.tsx
    │   └── QuestionCard.tsx
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts        # 브라우저용 (anon key)
    │   │   ├── server.ts        # 서버용 (service_role, API에서만)
    │   │   └── middleware.ts    # 세션 갱신
    │   ├── crypto.ts            # 휴대폰 번호 암·복호화
    │   ├── qr.ts                # QR 생성 유틸
    │   └── csv.ts               # CSV 파싱·내보내기
    ├── types/
    │   └── database.ts          # Supabase 타입 자동생성 결과
    └── middleware.ts            # Next.js 미들웨어 (관리자 경로 가드)
```

### 폴더 구조 원칙
- **`app/`** 은 라우팅·화면 조립만. 비즈니스 로직은 `features/`로 위임.
- **`features/`** 는 도메인별 self-contained. 서로 직접 참조하지 않고 `lib/`를 통함.
- **`lib/`** 는 공용 인프라. 도메인 지식 없음.
- **`components/ui/`** 는 도메인 무관 원시 UI. 도메인 컴포넌트는 `components/` 직속.

---

## Layer Responsibilities

1. **Route Handler (`app/api/**/route.ts`)**
   - 요청 파싱, Zod 검증, 인증 확인, feature 함수 호출, 응답 직렬화
   - 비즈니스 로직 작성 금지

2. **Feature Module (`features/*/mutations.ts`, `queries.ts`)**
   - 핵심 비즈니스 로직
   - Supabase 클라이언트 호출
   - 입력은 검증된 타입만 받음 (route에서 Zod 통과 후)

3. **lib (`lib/*`)**
   - 범용 유틸. 도메인 지식 없음.
   - Supabase 클라이언트 싱글톤 관리.

4. **Component (`components/*.tsx`)**
   - 프레젠테이션만. 데이터 패칭은 상위 서버 컴포넌트에서.

---

## Data Flow (체크인 예시)

```
[참석자 브라우저]
   ↓ POST /api/public/events/:token/checkin { name, last4 }
[Route Handler]
   ↓ Zod 검증 → event token 조회 → 상태 확인 (checkin_open)
[features/checkin/verify.ts]
   ↓ Registration 조회 (name + phone_last4 매칭)
   ↓ 다중 매치 → 이메일 마스킹 반환
   ↓ 단일 매치 → 중복 체크인 여부 확인
[features/checkin/mutations.ts]
   ↓ Checkin row 생성
[Route Handler]
   ↓ 응답 { status: 'success' | 'multi_match' | 'already_checked_in' | 'not_found' }
[참석자 브라우저]
```

---

## Environment Variables

`.env.example` 에 포함:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # 서버 전용, 절대 클라이언트 노출 금지

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CHECKIN_ENCRYPTION_KEY=           # 휴대폰 번호 암호화용 (32바이트 hex)

# (Future) 알림
# KAKAO_API_KEY=
```

---

## Deployment

1. Supabase 프로젝트 생성 → URL·키 발급
2. `supabase/migrations/` SQL 실행
3. Vercel에 리포지토리 연결 → 환경변수 입력
4. 배포 후 관리자 계정을 Supabase 대시보드에서 수동 생성 (MVP 단계)

---

## Reversibility Notes
- **Next.js / Supabase / Vercel** 조합: `[hard-to-reverse]` — 이전 비용 큼. 대규모 변경 시 재설계 필요.
- **Prisma 미도입**: `[reversible]` — 추후 도입 가능.
- **폴더 구조**: `[reversible]` — 리팩터링 용이.
