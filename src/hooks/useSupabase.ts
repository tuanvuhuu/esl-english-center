import { useState, useEffect, useCallback } from 'react'

// Generic hook để fetch dữ liệu từ bất kỳ service nào
export function useQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (e) {
      setError(e as Error)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}

// Hook dùng cho mutation (insert/update/delete)
export function useMutation<TInput, TResult>(
  mutator: (input: TInput) => Promise<TResult>
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(async (input: TInput): Promise<TResult | null> => {
    setLoading(true)
    setError(null)
    try {
      const result = await mutator(input)
      return result
    } catch (e) {
      setError(e as Error)
      return null
    } finally {
      setLoading(false)
    }
  }, [mutator])

  return { mutate, loading, error }
}
