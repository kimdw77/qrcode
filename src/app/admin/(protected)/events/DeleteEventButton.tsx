'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteEventButton({ eventId, eventName }: { eventId: string; eventName: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      alert('삭제에 실패했습니다.')
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-2 items-center" onClick={(e) => e.preventDefault()}>
        <span className="text-xs text-gray-500">삭제할까요?</span>
        <button onClick={handleDelete} disabled={loading}
          className="text-xs bg-red-500 text-white px-2 py-1 rounded">
          {loading ? '...' : '확인'}
        </button>
        <button onClick={() => setConfirming(false)}
          className="text-xs text-gray-400 px-2 py-1 rounded border">
          취소
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); setConfirming(true) }}
      className="text-xs text-red-400 hover:text-red-600 px-2 py-1"
      title={`${eventName} 삭제`}
    >
      삭제
    </button>
  )
}
