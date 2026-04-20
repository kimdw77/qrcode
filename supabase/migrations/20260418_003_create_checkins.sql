CREATE TABLE checkins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  checked_in_at   timestamptz NOT NULL DEFAULT now(),
  client_ip_hash  text,
  note            text,
  UNIQUE (event_id, registration_id)
);

CREATE INDEX idx_checkins_event ON checkins(event_id);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE TABLE checkin_attempts (
  id              bigserial PRIMARY KEY,
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name_input      text,
  last4_input     text,
  result          text NOT NULL
    CHECK (result IN ('success','not_found','multi_match','already_checked_in','event_closed','rate_limited')),
  client_ip_hash  text,
  attempted_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkin_attempts_event_time
  ON checkin_attempts(event_id, attempted_at DESC);
CREATE INDEX idx_checkin_attempts_ip
  ON checkin_attempts(client_ip_hash, attempted_at DESC);

ALTER TABLE checkin_attempts ENABLE ROW LEVEL SECURITY;
