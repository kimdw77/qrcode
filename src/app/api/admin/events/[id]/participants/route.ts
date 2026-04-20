import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/admin-auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  const supa = createServiceClient()
  const [{ data: registrations }, { data: checkins }] = await Promise.all([
    supa.from('registrations')
      .select('id, name, phone_last4, email_masked, organization')
      .eq('event_id', id)
      .order('name'),
    supa.from('checkins')
      .select('registration_id')
      .eq('event_id', id),
  ])

  const checkedInIds = new Set(
    (checkins ?? []).map((c: { registration_id: string }) => c.registration_id),
  )

  const result = (registrations ?? []).map(
    (r: { id: string; name: string; phone_last4: string; email_masked: string | null; organization: string | null }) => ({
      ...r,
      is_checked_in: checkedInIds.has(r.id),
    }),
  )

  return NextResponse.json({ registrations: result })
}
