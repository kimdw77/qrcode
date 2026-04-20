# DATA_MODEL.md

## 엔티티 개요

| 엔티티 | 목적 |
|---|---|
| `events` | 행사 마스터 |
| `registrations` | 행사별 사전 등록자 (CSV 업로드 결과) |
| `checkins` | 실제 체크인 기록 |
| `questions` | Q&A 질문 |
| `surveys` | 설문 정의 (자체형 또는 Google Forms 링크) |
| `survey_questions` | 자체 설문 문항 |
| `survey_responses` | 자체 설문 응답 |
| `admin_users` | 관리자 계정 (Supabase Auth `auth.users` 참조) |
| `checkin_attempts` | 체크인 실패 로그 (brute-force 감지용) |

---

## Entity Details

### `events`
행사 기본 정보와 상태.

```sql
CREATE TABLE events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  location        text,
  start_at        timestamptz NOT NULL,
  end_at          timestamptz NOT NULL,
  checkin_opens_at  timestamptz NOT NULL,  -- 기본: start_at - 30분
  checkin_closes_at timestamptz NOT NULL,  -- 기본: end_at + 30분
  status          text NOT NULL DEFAULT 'draft',
                  -- draft | published | checkin_open | checkin_closed | survey_open | archived
  public_token    text NOT NULL UNIQUE,    -- URL에 포함되는 16자 random, /e/{public_token}
  survey_mode     text NOT NULL DEFAULT 'none',
                  -- none | self | google_forms
  google_forms_url text,                   -- survey_mode='google_forms'일 때만
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  retention_until timestamptz NOT NULL DEFAULT (now() + interval '1 year')
);

CREATE INDEX idx_events_public_token ON events(public_token);
CREATE INDEX idx_events_status ON events(status);
```

### `registrations`
사전 등록자. CSV 업로드로 생성. 단일 엔티티 (Participant 마스터 없음).

```sql
CREATE TABLE registrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name            text NOT NULL,
  phone_encrypted bytea NOT NULL,          -- AES-256-GCM, lib/crypto.ts
  phone_last4     text NOT NULL,           -- 체크인 검증용 (빠른 조회)
  phone_hash      text NOT NULL,           -- 비식별화 후 참조용 SHA-256
  email           text,                    -- 동명이인 마스킹 선택용
  email_masked    text,                    -- "abc***@gmail.com" 생성결과 캐시
  organization    text,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_registrations_event_match
  ON registrations(event_id, name, phone_last4);
```

**비식별화 정책**: 보관기간 경과 시 `phone_encrypted = NULL`, `email = NULL` 로 업데이트. `phone_hash` 와 `phone_last4` 만 잔존 → 통계·중복확인용.

### `checkins`
실제 출석 기록.

```sql
CREATE TABLE checkins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  checked_in_at   timestamptz NOT NULL DEFAULT now(),
  client_ip_hash  text,                    -- 해시만 저장 (감사용)
  UNIQUE (event_id, registration_id)       -- 중복 체크인 DB 레벨 차단
);

CREATE INDEX idx_checkins_event ON checkins(event_id);
```

### `checkin_attempts`
실패 로그. brute-force 감지·운영자 현장 대응용.

```sql
CREATE TABLE checkin_attempts (
  id              bigserial PRIMARY KEY,
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name_input      text,
  last4_input     text,
  result          text NOT NULL,
                  -- success | not_found | multi_match | already_checked_in
                  -- | event_closed | rate_limited
  client_ip_hash  text,
  attempted_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkin_attempts_event_time
  ON checkin_attempts(event_id, attempted_at DESC);
CREATE INDEX idx_checkin_attempts_ip
  ON checkin_attempts(client_ip_hash, attempted_at DESC);
```

### `questions`
Q&A. 익명/기명 선택.

```sql
CREATE TABLE questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  body            text NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
  is_anonymous    boolean NOT NULL DEFAULT true,
  author_name     text,                    -- is_anonymous=false 일 때만
  submitter_token text NOT NULL,           -- 내부 식별, 외부 노출 금지
  status          text NOT NULL DEFAULT 'visible',
                  -- visible | hidden | flagged
  hidden_reason   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_event_visible
  ON questions(event_id, status, created_at DESC);
```

**`submitter_token` 생성 규칙** (`lib/crypto.ts`):
`sha256(event_id || anonymous_cookie || server_salt)` — 동일 참석자의 연쇄 질문 묶음용. 절대 API 응답에 포함 금지.

### `surveys`
설문 정의. 행사당 0 또는 1개.

```sql
CREATE TABLE surveys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  opens_at        timestamptz,             -- NULL이면 event.end_at부터
  closes_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

### `survey_questions`
자체 설문 문항.

```sql
CREATE TABLE survey_questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id       uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  order_index     int NOT NULL,
  type            text NOT NULL,
                  -- single_choice | multi_choice | text_short | text_long
  question_text   text NOT NULL,
  options_json    jsonb,                   -- choice 타입일 때 ["옵션1","옵션2",...]
  required        boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_sq_survey ON survey_questions(survey_id, order_index);
```

### `survey_responses`
응답 단위.

```sql
CREATE TABLE survey_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id       uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  submitter_token text NOT NULL,           -- questions와 동일 방식, 외부 노출 금지
  answers_json    jsonb NOT NULL,
                  -- [{question_id, value}], value는 string | string[] | null
  submitted_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sr_survey ON survey_responses(survey_id);
```

**설계 근거**: 응답을 단일 row + JSONB로 저장하여 MVP 구현·통계 단순화. 고급 분석 필요 시 view로 flatten 제공 가능.

### `admin_users`
Supabase `auth.users` 를 참조하는 보조 테이블. 역할·소속 메타데이터용.

```sql
CREATE TABLE admin_users (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    text NOT NULL,
  role            text NOT NULL DEFAULT 'admin',  -- admin | super_admin
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

---

## 관계도 (간략)

```
auth.users
   │ 1
   │
admin_users ── creates ──▶ events
                              │ 1
                              │ N
         ┌────────────────────┼────────────────────┐
         │                    │                    │
   registrations ── 1:1 ─ checkins         questions    surveys
                                                          │ 1
                                                          │ N
                                                    survey_questions
                                                          ╲
                                                           survey_responses
```

---

## 보관 · 비식별화 정책 요약

| 데이터 | 암호화 시점 | 비식별화 시점 | 잔존 데이터 |
|---|---|---|---|
| 휴대폰 번호 | 저장 시 AES-256-GCM | 행사 종료 + 1년 후 | `phone_last4`, `phone_hash` |
| 이메일 | 평문 (PIPA 저위험) | 행사 종료 + 1년 후 | 삭제 |
| 이름 | 평문 | 행사 종료 + 1년 후 | 삭제 |
| 질문·설문 응답 | 평문 | 영구 (통계 가치) | `submitter_token`은 비활성 |
| 체크인 시각 | 평문 | 영구 | 개인 식별 불가 상태 |

**자동 파기 배치**: Supabase Edge Function 또는 외부 cron으로 매일 실행, `retention_until < now()` 인 이벤트의 관련 테이블 비식별화.

---

## 인덱스 요약

주요 조회 패턴별:
- 체크인 매칭: `registrations(event_id, name, phone_last4)`
- 관리자 대시보드: `checkins(event_id)`, `questions(event_id, status, created_at DESC)`
- brute-force 감지: `checkin_attempts(client_ip_hash, attempted_at DESC)`
- 토큰 라우팅: `events(public_token)` UNIQUE

---

## 마이그레이션 파일 명명 규칙

```
supabase/migrations/
├── 20260418_001_create_events.sql
├── 20260418_002_create_registrations.sql
├── 20260418_003_create_checkins.sql
├── 20260418_004_create_questions.sql
├── 20260418_005_create_surveys.sql
├── 20260418_006_rls_policies.sql
└── 20260418_007_retention_function.sql
```

---

## 열린 이슈 (Stage 2에서 확정 필요)

- CSV 컬럼 표준 확정: 현재 가정은 `이름, 휴대폰, 이메일(선택), 소속(선택), 비고(선택)`
- `submitter_token` 생성 시 쿠키 만료 정책
- survey_responses JSONB 스키마 버저닝 전략 (문항 수정 후 응답 정합성)
