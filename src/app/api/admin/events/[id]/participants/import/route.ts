import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/supabase/admin-auth'
import { parseCsv } from '@/lib/csv'
import { encryptPhone, hashPhone, maskEmail } from '@/lib/crypto'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 })

  const content = await file.text()
  const { rows, errors, duplicates } = parseCsv(content)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'no_valid_rows', errors }, { status: 400 })
  }

  const supa = createServiceClient()
  const insertRows = rows.map((r) => ({
    event_id: id,
    name: r.name,
    phone_encrypted: encryptPhone(r.phone),
    phone_last4: r.phone.slice(-4),
    phone_hash: hashPhone(r.phone),
    email: r.email ?? null,
    email_masked: r.email ? maskEmail(r.email) : null,
    organization: r.organization ?? null,
    note: r.note ?? null,
  }))

  const { error } = await supa.from('registrations').insert(insertRows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ imported: rows.length, duplicates, parseErrors: errors })
}
