import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/admin-auth'
import { updateEventStatus } from '@/features/events/mutations'
import type { EventStatus } from '@/types/database'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['draft', 'published', 'checkin_open', 'checkin_closed', 'survey_open', 'archived']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  await updateEventStatus(createServiceClient(), params.id, parsed.data.status as EventStatus)
  return NextResponse.json({ ok: true })
}
