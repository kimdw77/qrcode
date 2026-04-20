CREATE TABLE registrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name            text NOT NULL,
  phone_encrypted bytea NOT NULL,
  phone_last4     text NOT NULL,
  phone_hash      text NOT NULL,
  email           text,
  email_masked    text,
  organization    text,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_registrations_event_match
  ON registrations(event_id, name, phone_last4);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
