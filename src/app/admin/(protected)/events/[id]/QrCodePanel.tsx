import Link from 'next/link'

export default function QrCodePanel({ eventId, checkinUrl }: { eventId: string; checkinUrl: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
      <p className="text-xs text-gray-500 mb-1">체크인 URL</p>
      <p className="text-sm font-mono break-all text-blue-600 mb-3">{checkinUrl}</p>
      <Link
        href={`/admin/events/${eventId}/qr`}
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
      >
        QR 코드 생성
      </Link>
    </div>
  )
}
