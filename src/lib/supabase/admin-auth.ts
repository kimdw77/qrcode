import { createClient } from './server'
import type { User } from '@supabase/supabase-js'

/** 현재 세션 사용자가 admin_users 테이블에 존재하는지 확인 */
export async function requireAdmin(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single()
  return data ? user : null
}
