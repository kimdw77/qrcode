import { SupabaseClient } from '@supabase/supabase-js'
import type { DbQuestion } from '@/types/database'

export async function listVisibleQuestions(
  supabase: SupabaseClient,
  eventId: string,
): Promise<Pick<DbQuestion, 'id' | 'body' | 'is_anonymous' | 'author_name' | 'created_at'>[]> {
  const { data } = await supabase
    .from('questions')
    .select('id, body, is_anonymous, author_name, created_at')
    .eq('event_id', eventId)
    .eq('status', 'visible')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function listAllQuestions(
  supabase: SupabaseClient,
  eventId: string,
): Promise<DbQuestion[]> {
  const { data } = await supabase
    .from('questions')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
  return data ?? []
}
