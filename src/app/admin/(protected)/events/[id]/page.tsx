import { createServiceClient } from '@/lib/supabase/server'
import { getEventById, getEventDashboard } from '@/features/events/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EventActionPanel from './EventActionPanel'

const STATUS_LABEL: Record<string, string> = {
  draft: '초안',
  published: '공개',
  checkin_open: '체크인 진행중',
  checkin_closed: '체크인 종료',
  survey_open: '설문 진행중',
  archived: '보관',
}

export default async function EventDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServiceClient()
  const [event, stats] = await Promise.all([
    getEventById(supabase, params.id),
    getEventDashboard(supabase, params.id),
  ])

  if (!event) notFound()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const checkinUrl = `${appUrl}/e/${event.public_token}/checkin`

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">{event.name}</h1>
          {event.location && <p className="text-sm text-gray-500">{event.location}</p>}
          <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {STATUS_LABEL[event.status]}
          </span>
        </div>
        <Link href="/admin/events" className="text-sm text-gray-400">← 목록</Link>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: '등록자', value: stats.registrationCount },
          { label: '체크인', value: stats.checkinCount },
          { label: 'Q&A', value: stats.questionCount },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-brand-700">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 체크인 URL */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <p className="text-xs text-gray-500 mb-1">체크인 URL</p>
        <p className="text-sm font-mono break-all text-brand-600">{checkinUrl}</p>
        <Link
          href={`/api/admin/events/${event.id}/qr`}
          target="_blank"
          className="inline-block mt-2 text-sm text-gray-600 underline"
        >
          QR 코드 생성
        </Link>
      </div>

      {/* 액션 패널 */}
      <EventActionPanel event={event} />

      {/* 참석자 / 내보내기 */}
      <div className="grid gap-3 mt-4">
        <Link
          href={`/admin/events/${params.id}/participants`}
          className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition"
        >
          참석자 관리 →
        </Link>
        <Link
          href={`/admin/events/${params.id}/questions`}
          className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition"
        >
          Q&amp;A 관리 →
        </Link>
        <a
          href={`/api/admin/events/${params.id}/export`}
          className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition"
        >
          체크인 결과 CSV 다운로드 →
        </a>
      </div>
    </div>
  )
}
