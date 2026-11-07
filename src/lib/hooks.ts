import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from './api'
import { SalesType, type FilterOrderRequest, type Pagination } from './types'

export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

/**
 * Loads a paginated list with search + page. Used by Products and Expenses.
 * `scope` is any extra value the fetcher depends on (for example the sales type):
 * when it changes the list is loaded again.
 */
export function usePagedData<T>(
  fetcher: (f: FilterOrderRequest) => Promise<Pagination<T>>,
  pageSize = 10,
  scope: string | number = '',
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
  }, [debounced, page, pageSize, tick, scope])

  return { data, loading, search, setSearch, page, setPage, reload }
}

const SALES_TYPE_KEY = 'restaurant_sales_type'

export function parseSalesType(v: unknown): SalesType | null {
  const n = Number(v)
  return n === SalesType.Restaurant || n === SalesType.Delivery ? n : null
}

/**
 * The selected tab (Restaurant / Delivery). It is remembered in the browser,
 * so Dashboard, Orders, Products and New sale all open on the same tab.
 */
export function useSalesType(): [SalesType, (t: SalesType) => void] {
  const [type, setTypeState] = useState<SalesType>(
    () => parseSalesType(localStorage.getItem(SALES_TYPE_KEY)) ?? SalesType.Restaurant,
  )
  const setType = useCallback((t: SalesType) => {
    setTypeState(t)
    localStorage.setItem(SALES_TYPE_KEY, String(t))
  }, [])
  return [type, setType]
}
