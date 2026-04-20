import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/admin-auth'
import { updateQuestionStatus } from '@/features/questions/mutations'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['visible', 'hidden', 'flagged']),
  hidden_reason: z.string().max(200).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; qid: string } },
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  await updateQuestionStatus(
    createServiceClient(),
    params.qid,
    parsed.data.status,
    parsed.data.hidden_reason,
  )
  return NextResponse.json({ ok: true })
}
