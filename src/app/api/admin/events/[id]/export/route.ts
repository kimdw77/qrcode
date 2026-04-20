import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/admin-auth'
import { getEventById } from '@/features/events/queries'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  const supa = createServiceClient()
  const [event, { data: registrations }, { data: checkins }] = await Promise.all([
    getEventById(supa, id),
    supa.from('registrations')
      .select('id, name, phone_last4, email_masked, organization, created_at')
      .eq('event_id', id)
      .order('name'),
    supa.from('checkins')
      .select('registration_id, checked_in_at')
      .eq('event_id', id),
  ])

  if (!event) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const checkinMap = new Map(
    (checkins ?? []).map((c: { registration_id: string; checked_in_at: string }) => [
      c.registration_id,
      c.checked_in_at,
    ]),
  )

  const rows = (registrations ?? []).map(
    (r: { id: string; name: string; phone_last4: string; email_masked: string | null; organization: string | null; created_at: string }) => ({
      이름: r.name,
      '전화 끝 4자리': r.phone_last4,
      이메일: r.email_masked ?? '',
      소속: r.organization ?? '',
      체크인: checkinMap.has(r.id) ? 'O' : 'X',
      '체크인 시각': checkinMap.get(r.id) ?? '',
      등록일: r.created_at,
    }),
  )

  const headers = Object.keys(rows[0] ?? {})
  const csv = [
    headers.join(','),
    ...rows.map((row: Record<string, string>) =>
      headers.map((h) => `"${(row[h] ?? '').replace(/"/g, '""')}"`).join(','),
    ),
  ].join('\n')

  return new NextResponse('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(event.name)}_체크인.csv"`,
    },
  })
}
