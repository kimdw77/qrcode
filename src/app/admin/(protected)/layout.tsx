import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

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
        <Link href="/admin/events" className="flex items-center gap-2">
          <Image src="/kitalogo.png" alt="KITA" width={80} height={24} className="object-contain" />
          <span className="text-sm font-semibold text-brand-700">제주지부 관리자</span>
        </Link>
        <span className="text-sm text-gray-500">{adminUser.display_name}</span>
      </header>
      <div className="max-w-4xl mx-auto">{children}</div>
    </div>
  )
}
