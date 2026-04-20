import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { submitQuestionSchema } from '@/features/questions/schemas'
import { submitQuestion } from '@/features/questions/mutations'
import { listVisibleQuestions } from '@/features/questions/queries'
import { getEventByToken } from '@/features/events/queries'
import { makeSubmitterToken } from '@/lib/crypto'

function getOrCreateCookie(req: NextRequest): { cookie: string; isNew: boolean } {
  const existing = req.cookies.get('anon_id')?.value
  if (existing) return { cookie: existing, isNew: false }
  const newCookie = crypto.randomUUID()
  return { cookie: newCookie, isNew: true }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const supabase = createServiceClient()
  const { token } = await params
  const event = await getEventByToken(supabase, token)
  if (!event) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const questions = await listVisibleQuestions(supabase, event.id)
  return NextResponse.json({ questions })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const supabase = createServiceClient()
  const { token } = await params
  const event = await getEventByToken(supabase, token)
  if (!event) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  if (!['checkin_open', 'checkin_closed'].includes(event.status)) {
    return NextResponse.json({ error: 'event_closed' }, { status: 422 })
  }

  const parsed = submitQuestionSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', errors: parsed.error.flatten() }, { status: 400 })
  }

  const { cookie, isNew } = getOrCreateCookie(req)
  const submitterToken = makeSubmitterToken(event.id, cookie)

  await submitQuestion(supabase, event.id, parsed.data, submitterToken)

  const res = NextResponse.json({ status: 'ok' }, { status: 201 })
  if (isNew) {
    res.cookies.set('anon_id', cookie, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })
  }
  return res
}
