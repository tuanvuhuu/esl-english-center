import { supabase } from '../lib/supabase'
import type { DbNotification } from '../types/database'

export async function getNotifications(userId?: string) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  // lấy thông báo của user hoặc broadcast (user_id = null)
  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`)
  }

  const { data, error } = await query
  if (error) throw error
  return data as DbNotification[]
}

export async function markAsRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)

  if (error) throw error
}

export async function markAllAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq('is_read', false)

  if (error) throw error
}

export async function createNotification(payload: Partial<DbNotification>) {
  const { data, error } = await supabase
    .from('notifications')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as DbNotification
}

/**
 * Fire-and-forget notification — never throws, never blocks UI.
 * Use this from mutation handlers so a notification failure won't roll back the main action.
 */
export function notify(
  title: string,
  body: string,
  type: DbNotification['type'] = 'info',
  opts?: { entityType?: string; entityId?: string },
) {
  createNotification({
    title,
    body,
    type,
    entity_type: opts?.entityType ?? null,
    entity_id: opts?.entityId ?? null,
    is_read: false,
    is_deleted: false,
  }).catch((err) => console.warn('[notify] failed:', err))
}
