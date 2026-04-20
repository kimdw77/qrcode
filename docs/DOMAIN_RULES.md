# DOMAIN_RULES.md

---

## 1. Event 상태 머신

```
draft ──publish──▶ published ──open_checkin──▶ checkin_open
                                                    │
                                                    │ close_checkin (자동: checkin_closes_at 경과)
                                                    ▼
                                               checkin_closed ──open_survey──▶ survey_open
                                                                                   │
                                                                                   │ archive
                                                                                   ▼
                                                                               archived
```

### 상태별 허용 행위

| 상태 | 체크인 | Q&A 등록 | 설문 응답 | 관리자 수정 | 비고 |
|---|---|---|---|---|---|
| draft | ✗ | ✗ | ✗ | ✓ | 공개 URL 비활성 |
| published | ✗ | ✗ | ✗ | ✓ | 참석자 안내만 가능 |
| checkin_open | ✓ | ✓ | ✗ | 제한적 | QR 노출 시작 |
| checkin_closed | ✗ | ✓ | ✓ | 제한적 | 질문·설문만 유지 |
| survey_open | ✗ | ✗ | ✓ | 제한적 | 설문만 남김 |
| archived | ✗ | ✗ | ✗ | ✗ (읽기전용) | 통계·CSV만 |

### 상태 전이 규칙
- [MUST] `checkin_open` 진입은 자동(시간 도달) 또는 관리자 수동 둘 다 허용.
- [MUST] `archived` 이후 역행 불가.
- [SHOULD] `draft → published` 전에 참석자 수·QR URL 생성 미리보기 제공.

---

## 2. 체크인 규칙

### 2-1. 입력 형식
- 이름: 1~20자, 앞뒤 공백 trim, 내부 공백은 허용
- 휴대폰 뒤 4자리: 숫자 4자리 정확히 (`/^\d{4}$/`)
- 클라이언트 힌트: `<input inputMode="numeric" maxLength={4} pattern="[0-9]*">`

### 2-2. 검증 순서 (단계 게이트)
1. **Zod 스키마 검증** — 타입·형식 불일치 시 400
2. **이벤트 상태 확인** — `checkin_open` 아니면 `event_closed` 반환
3. **rate limit 확인** — 동일 IP에서 분당 5회 초과 시 `rate_limited`
4. **등록자 매칭** — `registrations.name == input.name AND phone_last4 == input.last4`
5. **매칭 결과 분기**
   - 0건: `not_found`
   - 2건 이상: `multi_match` (이메일 마스킹 리스트 반환)
   - 1건: 중복 체크인 확인 → 있으면 `already_checked_in`, 없으면 `checkins` INSERT → `success`

### 2-3. 다중 매치 처리 (결정 2 - A안)
- 응답 예시:
  ```json
  {
    "status": "multi_match",
    "candidates": [
      { "candidate_id": "tmp_uuid1", "email_masked": "abc***@gmail.com" },
      { "candidate_id": "tmp_uuid2", "email_masked": "xyz***@naver.com" }
    ]
  }
  ```
- `candidate_id`는 서버 캐시(5분) 또는 JWT 서명된 값. `registration_id` 원본 노출 금지.
- 참석자가 선택 후 2차 요청: `POST /checkin/confirm { candidate_id }`
- [MUST] 이메일이 없는 등록자가 다중 매치에 포함될 경우 — `이메일 정보가 없습니다. 운영자에게 문의하세요` 로 폴백.

### 2-4. 이메일 마스킹 규칙
- 로컬파트: 앞 3자 노출, 이후 `***` 고정
- 로컬파트 3자 미만: 첫 1자만 노출 (`a***@...`)
- 도메인: 그대로 노출
- 예시: `abcde@gmail.com` → `abc***@gmail.com`, `ab@naver.com` → `a***@naver.com`

### 2-5. 중복 체크인 방지
- [MUST] DB 레벨 `UNIQUE(event_id, registration_id)` 제약
- [MUST] API 응답 `already_checked_in` 에 최초 체크인 시각 포함 (참석자 혼란 방지)
- [SHOULD] 관리자 화면에서 "체크인 취소" 가능 (오입력 구제용)

### 2-6. Rate Limit
- [MUST] 동일 IP × 동일 event: 분당 5회
- [MUST] 초과 시 `checkin_attempts` 기록 + 30초 쿨다운
- [SHOULD] 관리자 대시보드에 "의심스러운 시도" 카드 노출 (최근 1시간 실패 IP Top 5)

### 2-7. 관리자 수동 체크인
- [MUST] 관리자 전용 페이지에서 등록자 검색 후 수동 체크인 가능 (Wi-Fi 장애 백업)
- [MUST] 수동 체크인은 `checkins.note = 'manual_by_{admin_id}'` 로 구분

### 2-8. 로깅
- 성공·실패 모두 `checkin_attempts`에 기록
- 이름·뒤4자리 원본 저장 (실패 원인 추적), 보관기간 동일 적용

---

## 3. Q&A 규칙

### 3-1. 입력
- body: 1~1000자 (너무 짧거나 스팸성 긴 글 방지)
- is_anonymous: boolean, 기본 true
- author_name: is_anonymous=false일 때 1~20자 필수

### 3-2. 익명 질문의 식별
- `submitter_token` = `sha256(event_id || anonymous_cookie || server_salt)`
- `anonymous_cookie`: 참석자 첫 접속 시 발급, 30일 만료, HTTP-only
- [MUST NOT] `submitter_token`을 API 응답에 포함
- [MUST NOT] 공개 Q&A 조회 시 author_name 외 식별 정보 노출

### 3-3. 관리자 제어
- [MUST] 관리자는 `status`를 `hidden` 또는 `flagged`로 전환 가능
- [SHOULD] 숨김 시 `hidden_reason` 기록 (감사 목적)
- [SHOULD] 동일 `submitter_token`의 질문 일괄 숨김 (남용 대응)

### 3-4. 필터링
- [MUST] 기본 욕설·광고 키워드 블랙리스트 (KO 기본 목록 별도 파일 관리)
- [MUST] 블랙리스트 히트 시 바로 거부하지 말고 `status='flagged'` 로 저장 → 관리자 검토
- [SHOULD] 동일 IP 분당 3개 초과 질문 시 rate limit

### 3-5. 익명성 정책 (공개 입장)
- 익명 질문의 작성자 정보는 **어떠한 경우에도** 외부 공개 화면에 노출하지 않는다.
- 법적 공개 요청은 별도 절차(관리자 사전 협의)로만 처리. 기본은 "해제 불가".

---

## 4. 설문 규칙

### 4-1. 모드 선택 (결정 5 - A안)
- `survey_mode = 'self'`: 자체 설문 엔진 사용
- `survey_mode = 'google_forms'`: 외부 링크로 리다이렉트
- `survey_mode = 'none'`: 설문 없음
- [MUST] 관리자는 행사 생성·편집 시 셋 중 하나를 명시적으로 선택

### 4-2. 자체 설문 문항 타입
| type | 설명 | options_json 필요 |
|---|---|---|
| `single_choice` | 단일 선택 (라디오) | ✓ |
| `multi_choice` | 복수 선택 (체크박스) | ✓ |
| `text_short` | 단답형 (< 100자) | ✗ |
| `text_long` | 서술형 (< 1000자) | ✗ |

### 4-3. 응답 규칙
- [MUST] 응답 시점에 `surveys.opens_at <= now() <= closes_at` 검증 (`survey_open` 상태 필수)
- [MUST] `required=true` 문항의 공백 응답 거부
- [SHOULD] 중복 응답 방지: 동일 `submitter_token`당 1회 (변경은 허용/불허 Stage 2에서 확정)

### 4-4. 결과 집계
- [MUST] 관리자 대시보드: 객관식 문항은 막대 차트, 서술형은 목록
- [MUST] CSV 내보내기: 한 응답당 한 row, 문항 ID를 헤더로
- [SHOULD] 응답률 표시 (`응답 수 / 체크인 수`)

### 4-5. Google Forms 모드
- [MUST] 관리자가 입력한 URL의 도메인 검증 (`docs.google.com/forms`, `forms.gle`)
- [MUST] 참석자 화면에서 "외부 사이트로 이동합니다" 경고 후 이동
- [MUST] Google Forms 응답은 시스템에 저장되지 않음을 관리자 UI에 명시

---

## 5. CSV 업로드 규칙

### 5-1. 표준 컬럼
```
이름*, 휴대폰*, 이메일, 소속, 비고
```
(`*` = 필수)

### 5-2. 검증
- [MUST] 1행은 헤더. 허용 헤더명 세트 매칭 (영문·한글 모두 허용)
- [MUST] 휴대폰 번호 정규화: `010-1234-5678`, `01012345678`, `+821012345678` 모두 `01012345678` 로
- [MUST] 중복(동일 이름+동일 전체번호) 행 자동 제거, 관리자에게 건수 리포트
- [SHOULD] 잘못된 행은 전체 실패가 아닌 "실패 리포트" 로 제공

### 5-3. 저장
- [MUST] 저장 시 `phone_encrypted`(AES-256-GCM), `phone_last4`, `phone_hash` 동시 계산
- [MUST] 원본 CSV는 서버에 저장하지 않음 (메모리에서 파싱 후 폐기)

---

## 6. 도메인 용어 정의 (Ubiquitous Language)

| 용어 | 의미 |
|---|---|
| 행사 (Event) | 하나의 세미나·교육 세션 단위 |
| 등록자 (Registration) | 행사에 사전 등록된 인물 + 행사 단위 기록 |
| 체크인 (Checkin) | 등록자의 실제 출석 확정 |
| 공용 QR | 행사당 1개의 정적 QR |
| 공개 토큰 | URL에 포함되는 16자 random 문자열 |
| 제출자 토큰 (submitter_token) | 익명 Q&A·설문 응답의 내부 식별자, 외부 노출 금지 |
| 비식별화 | 보관기간 만료 후 개인정보를 삭제·해시화하는 작업 |
