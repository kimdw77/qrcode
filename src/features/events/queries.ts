import { SupabaseClient } from '@supabase/supabase-js'
import type { DbEvent } from '@/types/database'

export async function getEventByToken(
  supabase: SupabaseClient,
  token: string,
): Promise<DbEvent | null> {
  const { data } = await supabase
    .from('events')
    .select('*')
    .eq('public_token', token)
    .single()
  return data ?? null
}

export async function getEventById(
  supabase: SupabaseClient,
  id: string,
): Promise<DbEvent | null> {
  const { data } = await supabase.from('events').select('*').eq('id', id).single()
  return data ?? null
}

export async function listEvents(supabase: SupabaseClient): Promise<DbEvent[]> {
  const { data } = await supabase
    .from('events')
    .select('*')
    .order('start_at', { ascending: false })
  return data ?? []
}

export async function getEventDashboard(supabase: SupabaseClient, eventId: string) {
  const [registrations, checkins, questions] = await Promise.all([
    supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId),
    supabase
      .from('checkins')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId),
    supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'visible'),
  ])
  return {
    registrationCount: registrations.count ?? 0,
    checkinCount: checkins.count ?? 0,
    questionCount: questions.count ?? 0,
  }
}
