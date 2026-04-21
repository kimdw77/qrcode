CREATE TABLE events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  description       text,
  location          text,
  start_at          timestamptz NOT NULL,
  end_at            timestamptz NOT NULL,
  checkin_opens_at  timestamptz NOT NULL,
  checkin_closes_at timestamptz NOT NULL,
  status            text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','checkin_open','checkin_closed','survey_open','archived')),
  public_token      text NOT NULL UNIQUE,
  survey_mode       text NOT NULL DEFAULT 'none'
    CHECK (survey_mode IN ('none','self','google_forms')),
  google_forms_url  text,
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  retention_until   timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

CREATE INDEX idx_events_public_token ON events(public_token);
CREATE INDEX idx_events_status ON events(status);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
