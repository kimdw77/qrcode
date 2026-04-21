import { createServiceClient } from '@/lib/supabase/server'
import { getEventById } from '@/features/events/queries'
import { generateQRDataUrl, buildCheckinUrl } from '@/lib/qr'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function QrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getEventById(createServiceClient(), id)
  if (!event) notFound()

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') ?? 'http'
  const appUrl = `${proto}://${host}`
  const checkinUrl = buildCheckinUrl(appUrl, event.public_token)
  const qnaUrl = `${appUrl}/e/${event.public_token}/qna`
  const surveyUrl = event.survey_mode === 'self'
    ? `${appUrl}/e/${event.public_token}/survey`
    : event.survey_mode === 'google_forms'
    ? event.google_forms_url
    : null

  const [checkinQr, qnaQr, surveyQr] = await Promise.all([
    generateQRDataUrl(checkinUrl),
    generateQRDataUrl(qnaUrl),
    surveyUrl ? generateQRDataUrl(surveyUrl) : Promise.resolve(null),
  ])

  const qrItems = [
    { label: '체크인', url: checkinUrl, qr: checkinQr, color: 'text-blue-600' },
    { label: 'Q&A', url: qnaUrl, qr: qnaQr, color: 'text-green-600' },
    ...(surveyQr && surveyUrl ? [{ label: '설문조사', url: surveyUrl, qr: surveyQr, color: 'text-purple-600' }] : []),
  ]

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-lg font-bold mb-1 text-center">{event.name}</h1>
      <Link href={`/admin/events/${id}`} className="block text-center text-sm text-gray-400 mb-6">← 돌아가기</Link>
      <div className="grid gap-8">
        {qrItems.map((item) => (
          <div key={item.label} className="text-center">
            <p className={`font-bold text-base mb-2 ${item.color}`}>{item.label} QR 코드</p>
            <img src={item.qr} alt={`${item.label} QR코드`} className="mx-auto w-56 h-56 mb-2" />
            <p className="text-xs text-gray-400 break-all mb-3">{item.url}</p>
            <a
              href={item.qr}
              download={`${event.name}_${item.label}_QR.png`}
              className="inline-block bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              이미지 저장
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
