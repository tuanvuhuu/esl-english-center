import { useState, useCallback } from 'react'

interface UseBulkActionsOptions {
  onError?: (error: Error) => void
  onSuccess?: () => void
}

export function useBulkActions<T extends { id: string }>(
  items: T[],
  options?: UseBulkActionsOptions
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, setIsPending] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(item => item.id)))
    }
  }, [items, selectedIds.size])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const runBulk = useCallback(
    async (
      operation: (ids: string[]) => Promise<void>,
      _label: string,
      batchSize = 100
    ) => {
      if (selectedIds.size === 0) return

      const ids = Array.from(selectedIds)
      setIsPending(true)
      setError(null)
      setProgress({ current: 0, total: ids.length })

      try {
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize)
          await operation(batch)
          setProgress({ current: Math.min(i + batchSize, ids.length), total: ids.length })
        }
        options?.onSuccess?.()
        clearSelection()
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        options?.onError?.(error)
      } finally {
        setIsPending(false)
        setProgress(null)
      }
    },
    [selectedIds, options, clearSelection]
  )

  return {
    selectedIds,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    isPending,
    progress,
    error,
    runBulk,
  }
}
