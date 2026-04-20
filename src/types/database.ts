export type EventStatus =
  | 'draft'
  | 'published'
  | 'checkin_open'
  | 'checkin_closed'
  | 'survey_open'
  | 'archived'

export type SurveyMode = 'none' | 'self' | 'google_forms'

export type QuestionStatus = 'visible' | 'hidden' | 'flagged'

export type SurveyQuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'text_short'
  | 'text_long'

export type CheckinResult =
  | 'success'
  | 'not_found'
  | 'multi_match'
  | 'already_checked_in'
  | 'event_closed'
  | 'rate_limited'

export interface DbEvent {
  id: string
  name: string
  description: string | null
  location: string | null
  start_at: string
  end_at: string
  checkin_opens_at: string
  checkin_closes_at: string
  status: EventStatus
  public_token: string
  survey_mode: SurveyMode
  google_forms_url: string | null
  created_by: string | null
  created_at: string
  retention_until: string
}

export interface DbRegistration {
  id: string
  event_id: string
  name: string
  phone_encrypted: Uint8Array | null
  phone_last4: string
  phone_hash: string
  email: string | null
  email_masked: string | null
  organization: string | null
  note: string | null
  created_at: string
}

export interface DbCheckin {
  id: string
  event_id: string
  registration_id: string
  checked_in_at: string
  client_ip_hash: string | null
  note: string | null
}

export interface DbCheckinAttempt {
  id: number
  event_id: string
  name_input: string | null
  last4_input: string | null
  result: CheckinResult
  client_ip_hash: string | null
  attempted_at: string
}

export interface DbQuestion {
  id: string
  event_id: string
  body: string
  is_anonymous: boolean
  author_name: string | null
  submitter_token: string
  status: QuestionStatus
  hidden_reason: string | null
  created_at: string
}

export interface DbSurvey {
  id: string
  event_id: string
  title: string
  description: string | null
  opens_at: string | null
  closes_at: string | null
  created_at: string
}

export interface DbSurveyQuestion {
  id: string
  survey_id: string
  order_index: number
  type: SurveyQuestionType
  question_text: string
  options_json: string[] | null
  required: boolean
}

export interface DbSurveyResponse {
  id: string
  survey_id: string
  submitter_token: string
  answers_json: Array<{ question_id: string; value: string | string[] | null }>
  submitted_at: string
}

export interface DbAdminUser {
  user_id: string
  display_name: string
  role: 'admin' | 'super_admin'
  created_at: string
}
