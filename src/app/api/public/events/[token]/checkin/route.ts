import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { checkinSchema } from '@/features/checkin/schemas'
import { verifyCheckin, checkDuplicateCheckin } from '@/features/checkin/verify'
import {
  insertCheckin,
  logCheckinAttempt,
  countRecentAttempts,
} from '@/features/checkin/mutations'
import { getEventByToken } from '@/features/events/queries'
import { hashIp } from '@/lib/crypto'

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const supabase = createServiceClient()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? '0.0.0.0'
  const ipHash = hashIp(ip)

  const event = await getEventByToken(supabase, params.token)
  if (!event) {
    return NextResponse.json({ status: 'not_found' }, { status: 404 })
  }

  if (event.status !== 'checkin_open') {
    return NextResponse.json({ status: 'event_closed' }, { status: 422 })
  }

  const now = Date.now()
  const opensAt = new Date(event.checkin_opens_at).getTime()
  const closesAt = new Date(event.checkin_closes_at).getTime()
  if (now < opensAt || now > closesAt) {
    return NextResponse.json({ status: 'event_closed' }, { status: 422 })
  }

  const rateCount = await countRecentAttempts(supabase, event.id, ipHash)
  if (rateCount >= 5) {
    await logCheckinAttempt(supabase, event.id, null, null, 'rate_limited', ipHash)
    return NextResponse.json({ status: 'rate_limited' }, { status: 429 })
  }

  const parsed = checkinSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ status: 'invalid', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { name, last4 } = parsed.data
  const verify = await verifyCheckin(supabase, event.id, name, last4)

  if (verify.result === 'not_found') {
    await logCheckinAttempt(supabase, event.id, name, last4, 'not_found', ipHash)
    return NextResponse.json({ status: 'not_found' }, { status: 422 })
  }

  if (verify.result === 'multi_match') {
    await logCheckinAttempt(supabase, event.id, name, last4, 'multi_match', ipHash)
    return NextResponse.json({ status: 'multi_match', candidates: verify.candidates })
  }

  const registrationId = verify.registrationId!
  const dup = await checkDuplicateCheckin(supabase, event.id, registrationId)
  if (dup.isDuplicate) {
    await logCheckinAttempt(supabase, event.id, name, last4, 'already_checked_in', ipHash)
    return NextResponse.json({ status: 'already_checked_in', checked_in_at: dup.checkedInAt })
  }

  await insertCheckin(supabase, event.id, registrationId, ipHash)
  await logCheckinAttempt(supabase, event.id, name, last4, 'success', ipHash)

  return NextResponse.json({ status: 'success' })
}
