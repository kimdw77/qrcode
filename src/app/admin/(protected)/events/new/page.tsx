'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SurveyMode } from '@/types/database'

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [surveyMode, setSurveyMode] = useState<SurveyMode>('none')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd = new FormData(e.currentTarget)
    const body = {
      name: fd.get('name'),
      description: fd.get('description') || undefined,
      location: fd.get('location') || undefined,
      start_at: new Date(fd.get('start_at') as string).toISOString(),
      end_at: new Date(fd.get('end_at') as string).toISOString(),
      survey_mode: surveyMode,
      google_forms_url: surveyMode === 'google_forms' ? fd.get('google_forms_url') : null,
    }

    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.status === 201) {
      const { event } = await res.json()
      router.push(`/admin/events/${event.id}`)
    } else {
      const d = await res.json()
      setError(d.errors?.formErrors?.[0] ?? d.error ?? '오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-lg">
      <h1 className="text-xl font-bold mb-6">새 행사 만들기</h1>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field label="행사명 *">
          <input name="name" type="text" required maxLength={100}
            className={inputCls} placeholder="2026년 1월 수출기업 세미나" />
        </Field>
        <Field label="장소">
          <input name="location" type="text" maxLength={200} className={inputCls} placeholder="제주상공회의소 3층" />
        </Field>
        <Field label="시작 일시 *">
          <input name="start_at" type="datetime-local" required step={600} className={inputCls} />
        </Field>
        <Field label="종료 일시 *">
          <input name="end_at" type="datetime-local" required step={600} className={inputCls} />
        </Field>
        <Field label="설명">
          <textarea name="description" maxLength={1000} rows={3}
            className={`${inputCls} resize-none`} placeholder="행사 안내 내용" />
        </Field>
        <Field label="설문 방식">
          <select
            value={surveyMode}
            onChange={(e) => setSurveyMode(e.target.value as SurveyMode)}
            className={inputCls}
          >
            <option value="none">설문 없음</option>
            <option value="self">자체 설문</option>
            <option value="google_forms">Google Forms 링크</option>
          </select>
        </Field>
        {surveyMode === 'google_forms' && (
          <Field label="Google Forms URL *">
            <input name="google_forms_url" type="url" required
              className={inputCls} placeholder="https://docs.google.com/forms/..." />
          </Field>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition"
        >
          {loading ? '생성 중...' : '행사 생성'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
