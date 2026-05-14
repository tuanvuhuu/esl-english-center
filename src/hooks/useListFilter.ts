import { useMemo } from 'react'

type Accessor<T> = keyof T | ((item: T) => string)

function getValue<T>(item: T, accessor: Accessor<T>): string {
  return typeof accessor === 'function'
    ? accessor(item)
    : String((item as any)[accessor] ?? '')
}

export interface ListFilterConfig<T> {
  /** Fields (or functions) to search across — all joined with OR */
  searchKeys: Accessor<T>[]
  /** Maps each filter key to the item field it compares against */
  filterMap?: Record<string, Accessor<T>>
}

/**
 * Generic filter hook. Returns the filtered subset of `items` based on
 * a free-text `search` and a `filters` map where value 'all' means no filter.
 */
export function useListFilter<T>(
  items: T[],
  search: string,
  filters: Record<string, string>,
  config: ListFilterConfig<T>,
): T[] {
  return useMemo(() => {
    const q = search.trim().toLowerCase()

    return items.filter(item => {
      // free-text search (OR across searchKeys)
      if (q) {
        const hit = config.searchKeys.some(k =>
          getValue(item, k).toLowerCase().includes(q)
        )
        if (!hit) return false
      }

      // per-filter exact match
      for (const [fk, fv] of Object.entries(filters)) {
        if (fv === 'all') continue
        const accessor = config.filterMap?.[fk]
        if (!accessor) continue
        if (getValue(item, accessor) !== fv) return false
      }

      return true
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, filters])
}
