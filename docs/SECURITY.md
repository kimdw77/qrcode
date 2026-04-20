# SECURITY.md

---

## 1. 인증 모델

### 1-1. 관리자 (Supabase Auth)
- [MUST] 매직링크(이메일 링크) 로그인 기본
- [MUST] 세션 쿠키는 HTTP-only, Secure, SameSite=Lax
- [MUST] `middleware.ts`에서 `/admin/*` 경로 전체 보호
- [MUST] `admin_users` 테이블에 존재하는 user만 접근 허용 (auth.users에 있어도 admin_users에 없으면 거부)
- [SHOULD] 관리자 계정은 초기 MVP 단계에서 Supabase 대시보드 수동 생성
- [MAY] 추후 MFA, IP 화이트리스트 확장

### 1-2. 참석자 (무인증, 토큰 기반)
- 참석자는 별도 계정 없음. 이름+휴대폰 뒤 4자리로 1회성 검증.
- [MUST] 공개 URL은 `/e/{public_token}` 형식, 토큰은 최소 16자 random (`crypto.randomBytes`)
- [MUST] 토큰만으로는 어떤 행위도 불가 — 체크인은 이름+뒤4자리 추가 필요
- [MUST] 토큰 노출 시에도 개인정보 유출 없도록 설계 (GET으로 등록자 목록 반환 금지)

### 1-3. API 구분
- `/api/admin/*` — Supabase 세션 쿠키 필수, admin_users 확인
- `/api/public/*` — 인증 없음, 단 모든 라우트가 이벤트 상태·토큰 검증 후 진행

---

## 2. 휴대폰 번호 암호화

### 2-1. 알고리즘
- [MUST] AES-256-GCM
- [MUST] 키는 환경변수 `CHECKIN_ENCRYPTION_KEY` (32바이트 hex)
- [MUST] 각 행마다 고유 IV (12바이트 random)
- [MUST] 저장 포맷: `iv || ciphertext || auth_tag` 바이트 결합

### 2-2. 사용처
- 저장: 업로드 시 즉시 암호화
- 조회: 관리자 대시보드에서 "번호 보기" 클릭 시 서버 측 복호화 → 응답 1회
- 체크인 검증: 평문 사용 없이 `phone_last4` 비교만

### 2-3. 키 관리
- [MUST] Vercel 환경변수로 주입, 코드에 하드코딩 금지
- [MUST] 키 유출 시 전체 데이터 재암호화 절차 수립 (Stage 3에서 RUNBOOK 작성)
- [SHOULD] 연 1회 키 로테이션

---

## 3. 비식별화 (결정 1 확장 반영)

### 3-1. 트리거
- [MUST] `events.retention_until < now()` 인 행사 전체
- [MUST] 매일 1회 배치 실행 (Supabase Edge Function + Cron)

### 3-2. 작업 내용
| 테이블 | 비식별화 작업 |
|---|---|
| `registrations` | `phone_encrypted = NULL`, `email = NULL`, `email_masked = NULL`, `note = NULL` |
| `checkin_attempts` | `name_input = NULL`, `last4_input = NULL` (30일 후 전량 삭제) |
| `questions` | `author_name = NULL` (기명 질문), `submitter_token` 유지하되 쿠키 만료로 자연 비활성 |
| `survey_responses` | `submitter_token`만 유지, 응답 본문은 통계 가치로 유지 |

### 3-3. 잔존 정보
- `phone_hash`, `phone_last4` → 동명이인 분석·통계용
- `checkins.checked_in_at` → 참석 규모 통계
- 익명 응답 본문 → 설문 결과 보존

### 3-4. 사용자 권리 요청 (PIPA 제30조)
- [MUST] 참석자가 삭제 요청 시 즉시 비식별화 (보관기간 대기 없음)
- [MUST] 관리자 화면에 "개별 참석자 삭제" 기능 제공
- [SHOULD] 요청 처리 로그 보관 (법적 증빙)

---

## 4. Row Level Security (RLS)

### 4-1. 원칙
- [MUST] 모든 테이블에 RLS ENABLE
- [MUST] service_role 키는 서버 측 Route Handler에서만 사용
- [MUST] 브라우저는 anon key만 사용, 최소 권한 정책

### 4-2. 정책 요약

```sql
-- events
CREATE POLICY "admin_all_events" ON events
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admin_users));
-- 참석자는 RLS로 읽기 허용하지 않고, 서버 API에서 service_role로 조회

-- registrations, checkins, questions, surveys, survey_responses
-- 모두 admin_users 멤버만 직접 접근 가능. public은 API 경유.
```

### 4-3. 주의
- Next.js Route Handler에서 service_role 사용 시 **모든 쿼리에 명시적 조건** (`where event_id = ...`) 포함
- service_role은 RLS 우회하므로 코드 실수가 곧 데이터 유출로 직결

---

## 5. 개인정보보호법(PIPA) 대응

### 5-1. 수집 항목과 근거
| 항목 | 수집 근거 | 보유 기간 |
|---|---|---|
| 이름 | 행사 출석 확인 | 1년 후 비식별화 |
| 휴대폰 번호 | 본인 확인, 비상 연락 | 1년 후 비식별화 |
| 이메일 (선택) | 동명이인 식별, 사후 안내 | 1년 후 삭제 |
| 소속 (선택) | 통계, 수출지원 연계 | 1년 후 삭제 |

### 5-2. 동의
- [MUST] 참석자 첫 체크인 화면에 "개인정보 수집·이용 동의" 체크박스
- [MUST] 동의 문구 표준안 (Stage 2에서 법무 검토):
  - 수집 항목
  - 수집 목적
  - 보유 기간 (1년 후 비식별화)
  - 제3자 제공 없음
  - 동의 거부 시 참석 불가 안내
- [MUST] 동의 기록은 `checkins`에 별도 컬럼 또는 감사 테이블로 저장

### 5-3. 개인정보처리방침 페이지
- [MUST] 사이트 푸터에 링크 제공
- [SHOULD] Stage 3에서 실제 페이지 초안 작성

### 5-4. 관리자 교육
- 운영 매뉴얼에 "참석자 정보 외부 공유 금지", "CSV 파일 로컬 보관 시 주의" 등 명시

---

## 6. 위협 모델과 완화

| 위협 | 시나리오 | 완화 |
|---|---|---|
| 대리 체크인 | 타인 이름·뒤4자리를 알아 사칭 | 이름+뒤4자리 = 약인증임을 수용. 다중매치 시 이메일 마스킹 2단계. |
| brute-force 체크인 | 동일 이름 + 0000~9999 시도 | IP별 rate limit (분 5회), 실패 로그 분석 |
| 토큰 추측 | public_token 무차별 대입 | 16자 random → 실질적 불가능 |
| 익명 Q&A 남용 | 스팸·욕설 반복 등록 | 키워드 필터 + submitter_token 기반 일괄 숨김 |
| CSV 민감정보 유출 | 관리자 실수로 CSV 이메일 전송 | 시스템에서 직접 CSV 다운로드 + 워터마크 표시 |
| 서버 키 유출 | `CHECKIN_ENCRYPTION_KEY`, service_role 노출 | Vercel Env Var 전용, 코드/로그에 출력 금지 |
| SQL 인젝션 | 파라미터 미검증 | Zod 검증 + Supabase client 파라미터화 쿼리 |
| XSS | Q&A 본문 HTML 삽입 | 모든 렌더링은 텍스트 이스케이프, `dangerouslySetInnerHTML` 금지 |
| CSRF | 관리자 세션 악용 | Supabase Auth 기본 대응 + SameSite=Lax |
| 세션 탈취 | 관리자 쿠키 도난 | HTTPS 강제, HTTP-only 쿠키 |

---

## 7. 로깅 정책

### 7-1. 무엇을 로깅하는가
- 체크인 시도 (성공·실패)
- 관리자 민감 행위 (등록자 업로드, CSV 다운로드, 질문 숨김)
- API 오류

### 7-2. 무엇을 로깅하지 않는가
- [MUST NOT] 휴대폰 번호 전체
- [MUST NOT] 복호화된 개인정보
- [MUST NOT] `submitter_token` 원본

### 7-3. IP 처리
- [MUST] `client_ip_hash = sha256(ip || daily_salt)` 로 저장
- [MUST] 원본 IP는 로그·DB에 저장 금지 (CDN·Vercel 엣지 로그는 예외)

---

## 8. 배포·운영 보안

### 8-1. HTTPS
- [MUST] 전 경로 HTTPS (Vercel 기본 제공)
- [MUST] HSTS 헤더 활성

### 8-2. 환경변수 체크리스트
- [MUST] 프로덕션 배포 전 `.env.example`의 모든 키 Vercel에 설정 확인
- [MUST] 로컬 `.env.local`은 `.gitignore`

### 8-3. 백업
- [SHOULD] Supabase 자동 백업 활성 (유료 플랜 필요 시)
- [MAY] 무료 티어에서는 주 1회 수동 SQL 덤프

### 8-4. 사고 대응
- Stage 3에서 `RUNBOOK.md` 작성:
  - DB 접속 불가
  - 체크인 대량 실패
  - 관리자 로그인 불가
  - 개인정보 유출 의심

---

## 9. 준수 우선순위 (충돌 시)
1. PIPA 등 법적 의무
2. 개인정보 보호 원칙
3. 운영 안정성
4. 사용자 편의성

---

## 10. 되돌림 난이도
- **암호화 알고리즘 AES-256-GCM**: `[hard-to-reverse]` — 변경 시 전 데이터 재암호화 필요
- **RLS 정책**: `[reversible]` — 마이그레이션으로 수정 가능
- **보관기간 1년**: `[reversible]` — 사용자 동의 재수령 없이 단축 가능, 연장은 재동의 필요
