-- 비식별화 함수: 매일 Supabase Edge Function 또는 cron에서 호출
CREATE OR REPLACE FUNCTION anonymize_expired_events()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- registrations 비식별화
  UPDATE registrations r
  SET
    phone_encrypted = NULL,
    email           = NULL,
    email_masked    = NULL,
    note            = NULL
  FROM events e
  WHERE r.event_id = e.id
    AND e.retention_until < now()
    AND r.phone_encrypted IS NOT NULL;

  -- checkin_attempts: 30일 경과분 삭제
  DELETE FROM checkin_attempts
  WHERE attempted_at < now() - interval '30 days';

  -- questions 기명 정보 비식별화
  UPDATE questions q
  SET author_name = NULL
  FROM events e
  WHERE q.event_id = e.id
    AND e.retention_until < now()
    AND q.author_name IS NOT NULL;
END;
$$;
