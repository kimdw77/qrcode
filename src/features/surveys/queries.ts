import { SupabaseClient } from '@supabase/supabase-js'
import type { DbSurvey, DbSurveyQuestion } from '@/types/database'

export async function getSurveyByEventId(
  supabase: SupabaseClient,
  eventId: string,
): Promise<(DbSurvey & { questions: DbSurveyQuestion[] }) | null> {
  const { data } = await supabase
    .from('surveys')
    .select('*, survey_questions(*)')
    .eq('event_id', eventId)
    .order('order_index', { referencedTable: 'survey_questions' })
    .single()

  if (!data) return null
  const { survey_questions, ...survey } = data
  return { ...survey, questions: survey_questions ?? [] }
}
