'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Question {
  id: string
  body: string
  is_anonymous: boolean
  author_name: string | null
  status: string
  created_at: string
}

export default function QuestionsAdminPage() {
  const { id } = useParams<{ id: string }>()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  function reload() {
    fetch(`/api/admin/events/${id}/questions`)
      .then((r) => r.json())
      .then((d) => {
        setQuestions(d.questions ?? [])
        setLoading(false)
      })
  }

  useEffect(reload, [id])

  async function updateStatus(qId: string, status: string) {
    await fetch(`/api/admin/events/${id}/questions/${qId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    reload()
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Q&amp;A 관리</h1>
      {loading ? (
        <p className="text-gray-400 text-sm text-center py-8">불러오는 중...</p>
      ) : (
        <div className="grid gap-3">
          {questions.length === 0 && (
            <p className="text-center text-gray-400 py-8">질문이 없습니다.</p>
          )}
          {questions.map((q) => (
            <div key={q.id} className={`bg-white rounded-xl shadow-sm p-4 ${q.status !== 'visible' ? 'opacity-60' : ''}`}>
              <p className="text-sm text-gray-800 whitespace-pre-wrap mb-2">{q.body}</p>
              <p className="text-xs text-gray-400 mb-3">
                {q.is_anonymous ? '익명' : q.author_name} ·{' '}
                {new Date(q.created_at).toLocaleString('ko-KR')} ·{' '}
                <span className={`font-medium ${q.status === 'flagged' ? 'text-orange-500' : q.status === 'hidden' ? 'text-red-500' : 'text-green-600'}`}>
                  {q.status === 'visible' ? '공개' : q.status === 'hidden' ? '숨김' : '신고'}
                </span>
              </p>
              <div className="flex gap-2">
                {q.status !== 'visible' && (
                  <button onClick={() => updateStatus(q.id, 'visible')}
                    className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    공개
                  </button>
                )}
                {q.status !== 'hidden' && (
                  <button onClick={() => updateStatus(q.id, 'hidden')}
                    className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full">
                    숨기기
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
