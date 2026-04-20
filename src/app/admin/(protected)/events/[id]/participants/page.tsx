'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'

interface Registration {
  id: string
  name: string
  phone_last4: string
  email_masked: string | null
  organization: string | null
  is_checked_in: boolean
}

export default function ParticipantsPage() {
  const { id } = useParams<{ id: string }>()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)

  const loadData = useCallback(() => {
    fetch(`/api/admin/events/${id}/participants`)
      .then((r) => r.json())
      .then((d) => {
        setRegistrations(d.registrations ?? [])
        setLoading(false)
      })
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/admin/events/${id}/participants/import`, {
      method: 'POST',
      body: fd,
    })
    const data = await res.json()
    if (res.ok) {
      setImportResult(`✅ ${data.imported}명 등록 완료 (중복 제외: ${data.duplicates}명)`)
      loadData()
    } else {
      setImportResult(`❌ 오류: ${data.error}`)
    }
    setImporting(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">참석자 관리</h1>
        <label className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer">
          CSV 업로드
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importing} />
        </label>
      </div>

      {importResult && (
        <div className="bg-gray-100 rounded-lg p-3 mb-4 text-sm">{importResult}</div>
      )}

      <p className="text-sm text-gray-500 mb-3">총 {registrations.length}명</p>

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-8">불러오는 중...</p>
      ) : (
        <div className="grid gap-2">
          {registrations.map((r) => (
            <div key={r.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="font-medium text-sm">{r.name}</span>
                {r.organization && (
                  <span className="text-xs text-gray-400 ml-2">{r.organization}</span>
                )}
                <p className="text-xs text-gray-400">끝자리 {r.phone_last4}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_checked_in ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {r.is_checked_in ? '체크인' : '미입장'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
