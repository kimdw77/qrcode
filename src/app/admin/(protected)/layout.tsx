import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('display_name')
    .eq('user_id', user.id)
    .single()

  if (!adminUser) redirect('/admin/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <Link href="/admin/events" className="font-bold text-brand-700">
          KITA 제주 관리자
        </Link>
        <span className="text-sm text-gray-500">{adminUser.display_name}</span>
      </header>
      <div className="max-w-4xl mx-auto">{children}</div>
    </div>
  )
}
