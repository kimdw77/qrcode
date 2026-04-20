CREATE TABLE surveys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  opens_at    timestamptz,
  closes_at   timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

CREATE TABLE survey_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id     uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  order_index   int NOT NULL,
  type          text NOT NULL
    CHECK (type IN ('single_choice','multi_choice','text_short','text_long')),
  question_text text NOT NULL,
  options_json  jsonb,
  required      boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_sq_survey ON survey_questions(survey_id, order_index);

ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;

CREATE TABLE survey_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id       uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  submitter_token text NOT NULL,
  answers_json    jsonb NOT NULL,
  submitted_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sr_survey ON survey_responses(survey_id);

ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
