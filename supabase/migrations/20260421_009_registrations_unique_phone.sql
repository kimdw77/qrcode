ALTER TABLE registrations
  ADD CONSTRAINT registrations_event_phone_unique UNIQUE (event_id, phone_hash);
