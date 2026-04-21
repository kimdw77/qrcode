import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/admin-auth'
import { eventBaseSchema as updateEventSchema } from '@/features/events/schemas'
import { updateEvent } from '@/features/events/mutations'
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
  return NextResponse.json({ event })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await createServiceClient().from('events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  const parsed = updateEventSchema.partial().safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', errors: parsed.error.flatten() }, { status: 400 })
  }

  await updateEvent(createServiceClient(), id, parsed.data)
  return NextResponse.json({ ok: true })
}
