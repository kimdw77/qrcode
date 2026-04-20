import Papa from 'papaparse'
import { normalizePhone } from './crypto'

export interface CsvRow {
  name: string
  phone: string
  email?: string
  organization?: string
  note?: string
}

export interface ParseResult {
  rows: CsvRow[]
  errors: string[]
  duplicates: number
}

const NAME_ALIASES = ['이름', 'name']
const PHONE_ALIASES = ['휴대폰', '전화', '연락처', 'phone', 'mobile']
const EMAIL_ALIASES = ['이메일', 'email']
const ORG_ALIASES = ['소속', '회사', 'organization', 'company']
const NOTE_ALIASES = ['비고', '메모', 'note']

function findCol(headers: string[], aliases: string[]): number {
  return headers.findIndex((h) => aliases.includes(h.trim().toLowerCase()))
}

export function parseCsv(fileContent: string): ParseResult {
  const { data, errors: parseErrors } = Papa.parse<string[]>(fileContent, {
    skipEmptyLines: true,
  })

  if (parseErrors.length > 0 || data.length < 2) {
    return { rows: [], errors: ['CSV 파싱 실패: 헤더와 데이터 행이 필요합니다.'], duplicates: 0 }
  }

  const headers = (data[0] as string[]).map((h) => h.toLowerCase().trim())
  const nameIdx = findCol(headers, NAME_ALIASES)
  const phoneIdx = findCol(headers, PHONE_ALIASES)

  if (nameIdx === -1 || phoneIdx === -1) {
    return {
      rows: [],
      errors: ['필수 컬럼이 없습니다. "이름"과 "휴대폰" 컬럼이 필요합니다.'],
      duplicates: 0,
    }
  }

  const emailIdx = findCol(headers, EMAIL_ALIASES)
  const orgIdx = findCol(headers, ORG_ALIASES)
  const noteIdx = findCol(headers, NOTE_ALIASES)

  const seen = new Set<string>()
  const rows: CsvRow[] = []
  const errors: string[] = []
  let duplicates = 0

  for (let i = 1; i < data.length; i++) {
    const row = data[i] as string[]
    const name = row[nameIdx]?.trim()
    const rawPhone = row[phoneIdx]?.trim()

    if (!name || !rawPhone) {
      errors.push(`${i + 1}행: 이름 또는 휴대폰 번호 누락`)
      continue
    }

    const phone = normalizePhone(rawPhone)
    if (!/^\d{10,11}$/.test(phone)) {
      errors.push(`${i + 1}행: 휴대폰 번호 형식 오류 (${rawPhone})`)
      continue
    }

    const key = `${name}|${phone}`
    if (seen.has(key)) {
      duplicates++
      continue
    }
    seen.add(key)

    rows.push({
      name,
      phone,
      email: emailIdx !== -1 ? row[emailIdx]?.trim() || undefined : undefined,
      organization: orgIdx !== -1 ? row[orgIdx]?.trim() || undefined : undefined,
      note: noteIdx !== -1 ? row[noteIdx]?.trim() || undefined : undefined,
    })
  }

  return { rows, errors, duplicates }
}
