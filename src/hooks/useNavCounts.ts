import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface NavCounts {
  students?: number
  finance?: number
  notifications?: number
}

export function useNavCounts() {
  const [counts, setCounts] = useState<NavCounts>({})

  useEffect(() => {
    async function fetch() {
      const [s, f, n] = await Promise.all([
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('is_deleted', false)
          .eq('status', 'active'),
        supabase
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('is_deleted', false)
          .in('status', ['pending', 'overdue']),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_deleted', false)
          .eq('is_read', false),
      ])

      setCounts({
        students:      s.count ?? undefined,
        finance:       (f.count ?? 0) > 0 ? f.count! : undefined,
        notifications: (n.count ?? 0) > 0 ? n.count! : undefined,
      })
    }

    fetch()
  }, [])

  return counts
}
