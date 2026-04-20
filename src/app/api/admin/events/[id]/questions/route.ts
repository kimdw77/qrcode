import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/admin-auth'
import { listAllQuestions } from '@/features/questions/queries'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const questions = await listAllQuestions(createServiceClient(), params.id)
  return NextResponse.json({ questions })
}
