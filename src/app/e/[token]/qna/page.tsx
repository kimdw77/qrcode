'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Question {
  id: string
  body: string
  is_anonymous: boolean
  author_name: string | null
  created_at: string
}

export default function QnaPage() {
  const { token } = useParams<{ token: string }>()
  const [questions, setQuestions] = useState<Question[]>([])
  const [body, setBody] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [authorName, setAuthorName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/public/events/${token}/questions`)
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions ?? []))
  }, [token, submitted])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/public/events/${token}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: body.trim(),
          is_anonymous: isAnonymous,
          author_name: isAnonymous ? undefined : authorName.trim(),
        }),
      })
      if (res.status === 201) {
        setBody('')
        setAuthorName('')
        setSubmitted((s) => !s)
      } else {
        setError('질문 등록에 실패했습니다.')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Q&amp;A</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-4 mb-6 grid gap-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="질문을 입력하세요 (최대 1000자)"
          maxLength={1000}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
          required
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          익명으로 제출
        </label>
        {!isAnonymous && (
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="이름 (표시용)"
            maxLength={20}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        )}
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading || body.trim().length === 0}
          className="bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl text-sm transition"
        >
          {loading ? '등록 중...' : '질문 등록'}
        </button>
      </form>

      <div className="grid gap-3">
        {questions.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">아직 질문이 없습니다.</p>
        )}
        {questions.map((q) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{q.body}</p>
            <p className="text-xs text-gray-400 mt-2">
              {q.is_anonymous ? '익명' : q.author_name} ·{' '}
              {new Date(q.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}
