import { useState, useCallback } from 'react'
import { useToast } from '../components'

interface UseEntityDeleteOptions<T> {
  /** Supabase soft-delete service function */
  deleteFn: (id: string) => Promise<void>
  /** Refetch list after successful deletion */
  refetch: () => void
  /** Vietnamese entity label shown in toast, e.g. "học viên" */
  entityLabel: string
  /** Extract display name from item for toast message */
  getName: (item: T) => string
  /** Called after successful delete (e.g. close dialogs) */
  onSuccess?: () => void
}

/**
 * Handles soft-delete with loading state, success/error toasts,
 * and an optional post-delete callback.
 */
export function useEntityDelete<T extends { id: string | number }>(
  options: UseEntityDeleteOptions<T>,
) {
  const toast = useToast()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = useCallback(async (item: T) => {
    setDeleting(true)
    try {
      await options.deleteFn(String(item.id))
      toast.success(`Đã xoá ${options.entityLabel} "${options.getName(item)}"`)
      options.onSuccess?.()
      options.refetch()
    } catch (e: any) {
      toast.error(e.message || 'Xoá thất bại')
    } finally {
      setDeleting(false)
    }
  }, [options, toast])

  return { handleDelete, deleting }
}
