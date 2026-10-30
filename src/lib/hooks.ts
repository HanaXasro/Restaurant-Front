import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from './api'
import type { FilterOrderRequest, Pagination } from './types'

export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

/** Loads a paginated list with search + page. Used by Products, Orders and Expenses. */
export function usePagedData<T>(
  fetcher: (f: FilterOrderRequest) => Promise<Pagination<T>>,
  pageSize = 10,
) {
  const [search, setSearchState] = useState('')
  const debounced = useDebounce(search)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Pagination<T> | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const setSearch = useCallback((v: string) => {
    setSearchState(v)
    setPage(1)
  }, [])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetcher({ search: debounced.trim() || undefined, page, pageSize })
      .then((r) => {
        if (!cancelled) setData(r)
      })
      .catch((e) => {
        if (!cancelled) toast.error(getErrorMessage(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, page, pageSize, tick])

  return { data, loading, search, setSearch, page, setPage, reload }
}
