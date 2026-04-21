'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { SurveyMode } from '@/types/database'

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500'

function toLocalDatetime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EditEventPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [surveyMode, setSurveyMode] = useState<SurveyMode>('none')
  const [defaults, setDefaults] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/admin/events/${id}`)
      .then((r) => r.json())
      .then(({ event }) => {
        setDefaults({
          name: event.name ?? '',
          location: event.location ?? '',
          description: event.description ?? '',
          start_at: toLocalDatetime(event.start_at),
          end_at: toLocalDatetime(event.end_at),
          google_forms_url: event.google_forms_url ?? '',
        })
        setSurveyMode(event.survey_mode ?? 'none')
        setFetching(false)
      })
  }, [id])

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

    const res = await fetch(`/api/admin/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.push(`/admin/events/${id}`)
    } else {
      const d = await res.json()
      setError(d.errors?.formErrors?.[0] ?? d.error ?? '오류가 발생했습니다.')
      setLoading(false)
    }
  }

  if (fetching) return <div className="p-4 text-gray-400 text-sm">불러오는 중...</div>

  return (
    <div className="p-4 max-w-lg">
      <h1 className="text-xl font-bold mb-6">행사 수정</h1>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Field label="행사명 *">
          <input name="name" type="text" required maxLength={100}
            defaultValue={defaults.name} className={inputCls} />
        </Field>
        <Field label="장소">
          <input name="location" type="text" maxLength={200}
            defaultValue={defaults.location} className={inputCls} />
        </Field>
        <Field label="시작 일시 *">
          <input name="start_at" type="datetime-local" required
            defaultValue={defaults.start_at} className={inputCls} />
        </Field>
        <Field label="종료 일시 *">
          <input name="end_at" type="datetime-local" required
            defaultValue={defaults.end_at} className={inputCls} />
        </Field>
        <Field label="설명">
          <textarea name="description" maxLength={1000} rows={3}
            defaultValue={defaults.description}
            className={`${inputCls} resize-none`} />
        </Field>
        <Field label="설문 방식">
          <select value={surveyMode} onChange={(e) => setSurveyMode(e.target.value as SurveyMode)} className={inputCls}>
            <option value="none">설문 없음</option>
            <option value="self">자체 설문</option>
            <option value="google_forms">Google Forms 링크</option>
          </select>
        </Field>
        {surveyMode === 'google_forms' && (
          <Field label="Google Forms URL *">
            <input name="google_forms_url" type="url" required
              defaultValue={defaults.google_forms_url} className={inputCls} />
          </Field>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-xl">
            취소
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition">
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
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
