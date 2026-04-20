import { SupabaseClient } from '@supabase/supabase-js'
import type { SubmitQuestionInput } from './schemas'
import type { QuestionStatus } from '@/types/database'

const BLACKLIST = ['스팸', '광고', '욕설']

export async function submitQuestion(
  supabase: SupabaseClient,
  eventId: string,
  input: SubmitQuestionInput,
  submitterToken: string,
): Promise<void> {
  const hasBadWord = BLACKLIST.some((w) => input.body.includes(w))
  const status = hasBadWord ? 'flagged' : 'visible'

  const { error } = await supabase.from('questions').insert({
    event_id: eventId,
    body: input.body,
    is_anonymous: input.is_anonymous,
    author_name: input.is_anonymous ? null : (input.author_name ?? null),
    submitter_token: submitterToken,
    status,
  })
  if (error) throw new Error(error.message)
}

export async function updateQuestionStatus(
  supabase: SupabaseClient,
  questionId: string,
  status: QuestionStatus,
  hiddenReason?: string,
): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .update({ status, hidden_reason: hiddenReason ?? null })
    .eq('id', questionId)
  if (error) throw new Error(error.message)
}
