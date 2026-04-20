'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DbEvent, EventStatus } from '@/types/database'

const TRANSITIONS: Record<EventStatus, { next: EventStatus; label: string; color: string } | null> = {
  draft:          { next: 'published',      label: '공개하기',        color: 'bg-blue-600 hover:bg-blue-700' },
  published:      { next: 'checkin_open',   label: '체크인 시작',     color: 'bg-green-600 hover:bg-green-700' },
  checkin_open:   { next: 'checkin_closed', label: '체크인 종료',     color: 'bg-yellow-500 hover:bg-yellow-600' },
  checkin_closed: { next: 'survey_open',    label: '설문 시작',       color: 'bg-purple-600 hover:bg-purple-700' },
  survey_open:    { next: 'archived',       label: '행사 종료·보관',  color: 'bg-gray-600 hover:bg-gray-700' },
  archived:       null,
}

export default function EventActionPanel({ event }: { event: DbEvent }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const transition = TRANSITIONS[event.status]
  if (!transition) return null

  async function handleTransition() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/admin/events/${event.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: transition!.next }),
    })
    if (res.ok) {
      router.refresh()
    } else {
      const d = await res.json()
      setError(d.error ?? '상태 변경에 실패했습니다.')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <p className="text-xs text-gray-500 mb-2">행사 상태 전환</p>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <button
        onClick={handleTransition}
        disabled={loading}
        className={`w-full text-white font-semibold py-3 rounded-xl transition disabled:bg-gray-300 ${transition.color}`}
      >
        {loading ? '처리 중...' : transition.label}
      </button>
    </div>
  )
}
