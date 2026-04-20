import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { submitSurveySchema } from '@/features/surveys/schemas'
import { submitSurveyResponse } from '@/features/surveys/mutations'
import { getSurveyByEventId } from '@/features/surveys/queries'
import { getEventByToken } from '@/features/events/queries'
import { makeSubmitterToken } from '@/lib/crypto'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const supabase = createServiceClient()
  const { token } = await params
  const event = await getEventByToken(supabase, token)
  if (!event) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const survey = await getSurveyByEventId(supabase, event.id)
  return NextResponse.json({ survey, survey_mode: event.survey_mode, google_forms_url: event.google_forms_url })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const supabase = createServiceClient()
  const { token } = await params
  const event = await getEventByToken(supabase, token)
  if (!event) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  if (!['checkin_closed', 'survey_open'].includes(event.status)) {
    return NextResponse.json({ error: 'survey_not_open' }, { status: 422 })
  }

  const parsed = submitSurveySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid', errors: parsed.error.flatten() }, { status: 400 })
  }

  const survey = await getSurveyByEventId(supabase, event.id)
  if (!survey) return NextResponse.json({ error: 'no_survey' }, { status: 404 })

  const cookie = req.cookies.get('anon_id')?.value ?? crypto.randomUUID()
  const submitterToken = makeSubmitterToken(event.id, cookie)

  try {
    await submitSurveyResponse(supabase, survey.id, parsed.data, submitterToken)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error'
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  return NextResponse.json({ status: 'ok' }, { status: 201 })
}
