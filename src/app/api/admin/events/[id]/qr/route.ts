import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/admin-auth'
import { generateQRDataUrl, buildCheckinUrl } from '@/lib/qr'
import { getEventById } from '@/features/events/queries'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  const event = await getEventById(createServiceClient(), id)
  if (!event) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const checkinUrl = buildCheckinUrl(appUrl, event.public_token)
  const qrDataUrl = await generateQRDataUrl(checkinUrl)

  return NextResponse.json({ qr_data_url: qrDataUrl, checkin_url: checkinUrl })
}
