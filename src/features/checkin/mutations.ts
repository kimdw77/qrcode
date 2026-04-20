import { SupabaseClient } from '@supabase/supabase-js'
import type { CheckinResult } from '@/types/database'

export async function insertCheckin(
  supabase: SupabaseClient,
  eventId: string,
  registrationId: string,
  clientIpHash: string | null,
  note?: string,
): Promise<void> {
  const { error } = await supabase.from('checkins').insert({
    event_id: eventId,
    registration_id: registrationId,
    client_ip_hash: clientIpHash,
    note: note ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function logCheckinAttempt(
  supabase: SupabaseClient,
  eventId: string,
  nameInput: string | null,
  last4Input: string | null,
  result: CheckinResult,
  clientIpHash: string | null,
): Promise<void> {
  await supabase.from('checkin_attempts').insert({
    event_id: eventId,
    name_input: nameInput,
    last4_input: last4Input,
    result,
    client_ip_hash: clientIpHash,
  })
}

export async function countRecentAttempts(
  supabase: SupabaseClient,
  eventId: string,
  ipHash: string,
): Promise<number> {
  const since = new Date(Date.now() - 60 * 1000).toISOString()
  const { count } = await supabase
    .from('checkin_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('client_ip_hash', ipHash)
    .gte('attempted_at', since)
  return count ?? 0
}
