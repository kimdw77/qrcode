-- 개인정보 보관 기간을 1년에서 30일로 단축
ALTER TABLE events
  ALTER COLUMN retention_until
  SET DEFAULT (now() + interval '30 days');

UPDATE events
SET retention_until = end_at + interval '30 days'
WHERE retention_until > now();
