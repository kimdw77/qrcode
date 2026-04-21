import { SupabaseClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import type { CreateEventInput } from './schemas'
import type { DbEvent, EventStatus } from '@/types/database'

export async function createEvent(
  supabase: SupabaseClient,
  input: CreateEventInput,
  createdBy: string,
): Promise<DbEvent> {
  const startAt = new Date(input.start_at)
  const endAt = new Date(input.end_at)

  const checkinOpensAt =
    input.checkin_opens_at ?? new Date(startAt.getTime() - 30 * 60 * 1000).toISOString()
  const checkinClosesAt =
    input.checkin_closes_at ?? new Date(endAt.getTime() + 30 * 60 * 1000).toISOString()

  const publicToken = randomBytes(12).toString('base64url').slice(0, 16)

  const { data, error } = await supabase
    .from('events')
    .insert({
      name: input.name,
      description: input.description ?? null,
      location: input.location ?? null,
      start_at: input.start_at,
      end_at: input.end_at,
      checkin_opens_at: checkinOpensAt,
      checkin_closes_at: checkinClosesAt,
      status: 'draft',
      public_token: publicToken,
      survey_mode: input.survey_mode,
      google_forms_url: input.google_forms_url ?? null,
      created_by: createdBy,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateEvent(
  supabase: SupabaseClient,
  eventId: string,
  input: Partial<CreateEventInput>,
): Promise<void> {
  const updates: Record<string, unknown> = {}
  if (input.name !== undefined) updates.name = input.name
  if (input.description !== undefined) updates.description = input.description ?? null
  if (input.location !== undefined) updates.location = input.location ?? null
  if (input.start_at !== undefined) updates.start_at = input.start_at
  if (input.end_at !== undefined) updates.end_at = input.end_at
  if (input.checkin_opens_at !== undefined) updates.checkin_opens_at = input.checkin_opens_at
  if (input.checkin_closes_at !== undefined) updates.checkin_closes_at = input.checkin_closes_at
  if (input.survey_mode !== undefined) updates.survey_mode = input.survey_mode
  if ('google_forms_url' in input) updates.google_forms_url = input.google_forms_url ?? null

  const { error } = await supabase.from('events').update(updates).eq('id', eventId)
  if (error) throw new Error(error.message)
}

export async function updateEventStatus(
  supabase: SupabaseClient,
  eventId: string,
  status: EventStatus,
): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', eventId)
  if (error) throw new Error(error.message)
}
