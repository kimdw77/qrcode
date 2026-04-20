CREATE TABLE questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  body            text NOT NULL CHECK (length(body) BETWEEN 1 AND 1000),
  is_anonymous    boolean NOT NULL DEFAULT true,
  author_name     text,
  submitter_token text NOT NULL,
  status          text NOT NULL DEFAULT 'visible'
    CHECK (status IN ('visible','hidden','flagged')),
  hidden_reason   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_event_visible
  ON questions(event_id, status, created_at DESC);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
