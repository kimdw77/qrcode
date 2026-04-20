'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface SurveyQuestion {
  id: string
  type: string
  question_text: string
  options_json: string[] | null
  required: boolean
}

interface Survey {
  id: string
  title: string
  description: string | null
  questions: SurveyQuestion[]
}

export default function SurveyPage() {
  const { token } = useParams<{ token: string }>()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [surveyMode, setSurveyMode] = useState<string>('none')
  const [googleFormsUrl, setGoogleFormsUrl] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/public/events/${token}/survey`)
      .then((r) => r.json())
      .then((d) => {
        setSurveyMode(d.survey_mode)
        setGoogleFormsUrl(d.google_forms_url ?? null)
        setSurvey(d.survey)
      })
  }, [token])

  function setAnswer(qId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const answerList = survey!.questions.map((q) => ({
        question_id: q.id,
        value: answers[q.id] ?? null,
      }))
      const res = await fetch(`/api/public/events/${token}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answerList }),
      })
      if (res.status === 201) {
        setSubmitted(true)
      } else {
        const d = await res.json()
        setError(d.error ?? '오류가 발생했습니다.')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (surveyMode === 'google_forms' && googleFormsUrl) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-gray-600 mb-4">외부 사이트(Google Forms)로 이동합니다.</p>
          <a
            href={googleFormsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-brand-600 text-white font-semibold py-4 rounded-xl"
          >
            설문 참여하기 →
          </a>
        </div>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🙏</div>
          <h1 className="text-xl font-bold mb-2">설문 완료</h1>
          <p className="text-gray-500">소중한 의견 감사합니다!</p>
        </div>
      </main>
    )
  }

  if (!survey) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">설문을 불러오는 중...</p>
      </main>
    )
  }

  return (
    <main className="flex flex-col min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-1">{survey.title}</h1>
      {survey.description && <p className="text-sm text-gray-500 mb-4">{survey.description}</p>}

      <form onSubmit={handleSubmit} className="grid gap-5">
        {survey.questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm font-medium mb-3">
              {idx + 1}. {q.question_text}
              {q.required && <span className="text-red-500 ml-1">*</span>}
            </p>

            {q.type === 'single_choice' && q.options_json && (
              <div className="grid gap-2">
                {q.options_json.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswer(q.id, opt)}
                      required={q.required}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {q.type === 'multi_choice' && q.options_json && (
              <div className="grid gap-2">
                {q.options_json.map((opt) => {
                  const arr = (answers[q.id] as string[]) ?? []
                  return (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={arr.includes(opt)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...arr, opt]
                            : arr.filter((v) => v !== opt)
                          setAnswer(q.id, next)
                        }}
                      />
                      {opt}
                    </label>
                  )
                })}
              </div>
            )}

            {(q.type === 'text_short' || q.type === 'text_long') && (
              q.type === 'text_short' ? (
                <input
                  type="text"
                  maxLength={100}
                  value={(answers[q.id] as string) ?? ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  required={q.required}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <textarea
                  maxLength={1000}
                  rows={3}
                  value={(answers[q.id] as string) ?? ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  required={q.required}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              )
            )}
          </div>
        ))}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white font-semibold py-4 rounded-xl transition"
        >
          {loading ? '제출 중...' : '설문 제출'}
        </button>
      </form>
    </main>
  )
}
