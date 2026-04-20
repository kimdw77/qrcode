-- admin_users: 자신만 조회 가능
CREATE POLICY "admin_read_self" ON admin_users
  FOR SELECT USING (auth.uid() = user_id);

-- events: admin_users 멤버만 전체 접근
CREATE POLICY "admin_all_events" ON events
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- registrations: admin만
CREATE POLICY "admin_all_registrations" ON registrations
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- checkins: admin만
CREATE POLICY "admin_all_checkins" ON checkins
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- checkin_attempts: admin만
CREATE POLICY "admin_all_checkin_attempts" ON checkin_attempts
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- questions: admin만 (공개 조회는 API/service_role 경유)
CREATE POLICY "admin_all_questions" ON questions
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- surveys, survey_questions, survey_responses: admin만
CREATE POLICY "admin_all_surveys" ON surveys
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "admin_all_survey_questions" ON survey_questions
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admin_users));

CREATE POLICY "admin_all_survey_responses" ON survey_responses
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admin_users));
