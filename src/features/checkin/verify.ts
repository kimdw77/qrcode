import { SupabaseClient } from '@supabase/supabase-js'
import type { CheckinResult, DbRegistration } from '@/types/database'

export interface MultiMatchCandidate {
  candidate_id: string
  email_masked: string | null
}

export interface VerifyResult {
  result: CheckinResult
  checkedInAt?: string
  candidates?: MultiMatchCandidate[]
  registrationId?: string
}

export async function verifyCheckin(
  supabase: SupabaseClient,
  eventId: string,
  name: string,
  last4: string,
): Promise<VerifyResult> {
  const { data: matches } = await supabase
    .from('registrations')
    .select('id, name, email_masked')
    .eq('event_id', eventId)
    .eq('name', name)
    .eq('phone_last4', last4)

  if (!matches || matches.length === 0) {
    return { result: 'not_found' }
  }

  if (matches.length > 1) {
    const candidates: MultiMatchCandidate[] = matches.map((m: Pick<DbRegistration, 'id' | 'email_masked'>) => ({
      candidate_id: m.id,
      email_masked: m.email_masked,
    }))
    return { result: 'multi_match', candidates }
  }

  const registration = matches[0] as Pick<DbRegistration, 'id'>
  return { result: 'success', registrationId: registration.id }
}

export async function checkDuplicateCheckin(
  supabase: SupabaseClient,
  eventId: string,
  registrationId: string,
): Promise<{ isDuplicate: boolean; checkedInAt?: string }> {
  const { data } = await supabase
    .from('checkins')
    .select('checked_in_at')
    .eq('event_id', eventId)
    .eq('registration_id', registrationId)
    .maybeSingle()

  if (data) return { isDuplicate: true, checkedInAt: data.checked_in_at }
  return { isDuplicate: false }
}
