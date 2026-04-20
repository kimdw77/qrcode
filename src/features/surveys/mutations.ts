import { SupabaseClient } from '@supabase/supabase-js'
import type { SubmitSurveyInput } from './schemas'

export async function submitSurveyResponse(
  supabase: SupabaseClient,
  surveyId: string,
  input: SubmitSurveyInput,
  submitterToken: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from('survey_responses')
    .select('id')
    .eq('survey_id', surveyId)
    .eq('submitter_token', submitterToken)
    .maybeSingle()

  if (existing) throw new Error('이미 설문에 응답하셨습니다.')

  const { error } = await supabase.from('survey_responses').insert({
    survey_id: surveyId,
    submitter_token: submitterToken,
    answers_json: input.answers,
  })
  if (error) throw new Error(error.message)
}
