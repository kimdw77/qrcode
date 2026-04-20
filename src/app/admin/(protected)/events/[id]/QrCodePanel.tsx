'use client'

import { useState } from 'react'

export default function QrCodePanel({ eventId, checkinUrl }: { eventId: string; checkinUrl: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    const res = await fetch(`/api/admin/events/${eventId}/qr`)
    const data = await res.json()
    setQrDataUrl(data.qr_data_url)
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
      <p className="text-xs text-gray-500 mb-1">체크인 URL</p>
      <p className="text-sm font-mono break-all text-blue-600 mb-3">{checkinUrl}</p>

      {qrDataUrl ? (
        <div className="text-center">
          <img src={qrDataUrl} alt="체크인 QR코드" className="mx-auto w-48 h-48" />
          <a
            href={qrDataUrl}
            download="checkin-qr.png"
            className="inline-block mt-2 text-sm text-gray-600 underline"
          >
            QR 이미지 저장
          </a>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="text-sm text-gray-600 underline disabled:text-gray-300"
        >
          {loading ? '생성 중...' : 'QR 코드 생성'}
        </button>
      )}
    </div>
  )
}
