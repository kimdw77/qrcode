import { createServiceClient } from '@/lib/supabase/server'
import { listEvents } from '@/features/events/queries'
import Link from 'next/link'
import type { DbEvent } from '@/types/database'

const STATUS_LABEL: Record<string, string> = {
  draft: '초안',
  published: '공개',
  checkin_open: '체크인 진행중',
  checkin_closed: '체크인 종료',
  survey_open: '설문 진행중',
  archived: '보관',
}

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-blue-100 text-blue-700',
  checkin_open: 'bg-green-100 text-green-700',
  checkin_closed: 'bg-yellow-100 text-yellow-700',
  survey_open: 'bg-purple-100 text-purple-700',
  archived: 'bg-gray-100 text-gray-400',
}

export default async function EventsPage() {
  const supabase = createServiceClient()
  const events = await listEvents(supabase)

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">행사 목록</h1>
        <Link
          href="/admin/events/new"
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + 새 행사
        </Link>
      </div>

      {events.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-2">등록된 행사가 없습니다.</p>
          <Link href="/admin/events/new" className="text-brand-600 underline text-sm">
            첫 행사 만들기
          </Link>
        </div>
      )}

      <div className="grid gap-3">
        {events.map((event: DbEvent) => (
          <Link
            key={event.id}
            href={`/admin/events/${event.id}`}
            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition block"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold">{event.name}</h2>
                {event.location && (
                  <p className="text-sm text-gray-500">{event.location}</p>
                )}
                <p className="text-sm text-gray-400 mt-1">
                  {new Date(event.start_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[event.status]}`}>
                {STATUS_LABEL[event.status]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
