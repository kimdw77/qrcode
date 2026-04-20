import { createServiceClient } from '@/lib/supabase/server'
import { getEventByToken } from '@/features/events/queries'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EventHomePage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = createServiceClient()
  const event = await getEventByToken(supabase, params.token)
  if (!event) notFound()

  const startDate = new Date(event.start_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <main className="flex min-h-screen flex-col items-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow p-6 mb-4">
          <h1 className="text-xl font-bold mb-1">{event.name}</h1>
          {event.location && (
            <p className="text-sm text-gray-500 mb-1">📍 {event.location}</p>
          )}
          <p className="text-sm text-gray-500">{startDate}</p>
          {event.description && (
            <p className="text-sm text-gray-700 mt-3">{event.description}</p>
          )}
        </div>

        <div className="grid gap-3">
          {event.status === 'checkin_open' && (
            <Link
              href={`/e/${params.token}/checkin`}
              className="block bg-brand-600 hover:bg-brand-700 text-white text-center font-semibold py-4 rounded-xl transition"
            >
              체크인하기
            </Link>
          )}
          {['checkin_open', 'checkin_closed'].includes(event.status) && (
            <Link
              href={`/e/${params.token}/qna`}
              className="block bg-white border border-gray-200 hover:bg-gray-50 text-center font-medium py-4 rounded-xl transition"
            >
              Q&amp;A 질문하기
            </Link>
          )}
          {['checkin_closed', 'survey_open'].includes(event.status) &&
            event.survey_mode !== 'none' && (
              <Link
                href={`/e/${params.token}/survey`}
                className="block bg-white border border-gray-200 hover:bg-gray-50 text-center font-medium py-4 rounded-xl transition"
              >
                설문 참여하기
              </Link>
            )}
        </div>
      </div>
    </main>
  )
}
