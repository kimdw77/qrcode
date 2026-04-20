'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

type Step = 'form' | 'multi_match' | 'success' | 'error'

interface Candidate {
  candidate_id: string
  email_masked: string | null
}

export default function CheckinPage() {
  const { token } = useParams<{ token: string }>()
  const [name, setName] = useState('')
  const [last4, setLast4] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/public/events/${token}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), last4 }),
      })
      const data = await res.json()

      switch (data.status) {
        case 'success':
          setStep('success')
          setMessage('체크인 완료!')
          break
        case 'multi_match':
          setCandidates(data.candidates)
          setStep('multi_match')
          break
        case 'already_checked_in':
          setStep('error')
          setMessage(`이미 체크인하셨습니다. (${new Date(data.checked_in_at).toLocaleTimeString('ko-KR')})`)
          break
        case 'not_found':
          setStep('error')
          setMessage('등록 정보를 찾을 수 없습니다. 이름과 휴대폰 번호 뒤 4자리를 다시 확인하세요.')
          break
        case 'event_closed':
          setStep('error')
          setMessage('현재 체크인 시간이 아닙니다.')
          break
        case 'rate_limited':
          setStep('error')
          setMessage('잠시 후 다시 시도해주세요.')
          break
        default:
          setStep('error')
          setMessage('오류가 발생했습니다. 다시 시도해주세요.')
      }
    } catch {
      setStep('error')
      setMessage('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">체크인 완료</h1>
          <p className="text-gray-600">{name}님, 참석해주셔서 감사합니다!</p>
        </div>
      </main>
    )
  }

  if (step === 'multi_match') {
    return (
      <main className="flex min-h-screen flex-col items-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-bold mb-4">본인을 선택해주세요</h1>
          <p className="text-sm text-gray-500 mb-4">동일한 이름이 여러 명 등록되어 있습니다.</p>
          <div className="grid gap-3">
            {candidates.map((c) => (
              <button
                key={c.candidate_id}
                onClick={async () => {
                  setLoading(true)
                  const res = await fetch(`/api/public/events/${token}/checkin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, last4, candidate_id: c.candidate_id }),
                  })
                  const data = await res.json()
                  if (data.status === 'success') {
                    setStep('success')
                  } else {
                    setStep('error')
                    setMessage('체크인 처리 중 오류가 발생했습니다.')
                  }
                  setLoading(false)
                }}
                className="bg-white border border-gray-200 rounded-xl py-4 px-5 text-left hover:bg-gray-50"
                disabled={loading}
              >
                {c.email_masked ?? (
                  <span className="text-gray-400 text-sm">이메일 정보가 없습니다. 운영자에게 문의하세요.</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (step === 'error') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">❗</div>
          <p className="text-gray-700 mb-6">{message}</p>
          <button
            onClick={() => setStep('form')}
            className="bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            다시 시도
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">체크인</h1>
        <p className="text-sm text-gray-500 mb-6">이름과 휴대폰 번호 뒤 4자리를 입력하세요.</p>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">이름</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="홍길동"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="last4">휴대폰 뒤 4자리</label>
            <input
              id="last4"
              type="text"
              inputMode="numeric"
              maxLength={4}
              pattern="[0-9]*"
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="1234"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || name.trim().length === 0 || last4.length !== 4}
            className="bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white font-semibold py-4 rounded-xl transition"
          >
            {loading ? '확인 중...' : '체크인'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-6 text-center">
          문제가 있으면 운영자에게 문의하세요.
        </p>
      </div>
    </main>
  )
}
