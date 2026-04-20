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
  const qrDataUrl = await generateQRDataUrl(checkinUrl)

  return (
    <div className="p-6 max-w-sm mx-auto text-center">
      <h1 className="text-lg font-bold mb-1">{event.name}</h1>
      <p className="text-xs text-gray-500 mb-4">체크인 QR 코드</p>
      <img src={qrDataUrl} alt="체크인 QR코드" className="mx-auto w-64 h-64 mb-4" />
      <p className="text-xs text-gray-400 break-all mb-4">{checkinUrl}</p>
      <div className="flex gap-3 justify-center">
        <a
          href={qrDataUrl}
          download={`${event.name}_QR.png`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          이미지 저장
        </a>
        <Link href={`/admin/events/${id}`} className="border px-4 py-2 rounded-lg text-sm text-gray-600">
          돌아가기
        </Link>
      </div>
    </div>
  )
}
