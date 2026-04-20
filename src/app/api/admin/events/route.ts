import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/admin-auth'
import { createEventSchema } from '@/features/events/schemas'
import { createEvent } from '@/features/events/mutations'
import { listEvents } from '@/features/events/queries'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const events = await listEvents(createServiceClient())
  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = createEventSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', errors: parsed.error.flatten() }, { status: 400 })
  }

  const event = await createEvent(createServiceClient(), parsed.data, admin.id)
  return NextResponse.json({ event }, { status: 201 })
}
