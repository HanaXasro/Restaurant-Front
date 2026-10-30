import axios from 'axios'
import type {
  DashboardDto,
  ExpenseDto,
  ExpenseRequest,
  FilterOrderRequest,
  OrderDto,
  OrderRequest,
  Pagination,
  ProductDto,
  ProductRequest,
} from './types'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://localhost:7001',
  headers: { 'Content-Type': 'application/json' },
})

/** Turns any error into a Kurdish message for the toast. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'نەتوانرا پەیوەندی بە سێرڤەرەوە بکرێت'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = error.response.data as any
    if (d?.errors && typeof d.errors === 'object') {
      const first = (Object.values(d.errors) as unknown[]).flat()[0]
      if (first) return String(first)
    }
    if (typeof d === 'string' && d) return d
    return d?.message ?? d?.detail ?? d?.title ?? 'هەڵەیەک ڕوویدا'
  }
  return 'هەڵەیەک ڕوویدا'
}

/**
 * Default sorting. Leave empty to use the backend default.
 * If your backend supports it you can use: { orderBy: 'createAt', isAscending: false }
 */
const DEFAULT_SORT: Pick<FilterOrderRequest, 'orderBy' | 'isAscending'> = {}

function clean(params: FilterOrderRequest) {
  const merged = { ...DEFAULT_SORT, ...params }
  return Object.fromEntries(
    Object.entries(merged).filter(([, v]) => v !== undefined && v !== ''),
  )
}

/**
 * Your C# `Pagination<T>` class was not in the files you sent, so this accepts the
 * most common property names. If yours is different, change it here (only one place).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize<T>(raw: any, f: FilterOrderRequest): Pagination<T> {
  const items: T[] = Array.isArray(raw)
    ? raw
    : (raw?.items ?? raw?.data ?? raw?.results ?? raw?.records ?? [])
  const totalCount: number =
    raw?.totalCount ?? raw?.total ?? raw?.totalItems ?? raw?.totalRecords ?? items.length
  const pageSize: number = raw?.pageSize ?? f.pageSize ?? (items.length || 10)
  const page: number = raw?.page ?? raw?.pageNumber ?? raw?.currentPage ?? f.page ?? 1
  const totalPages: number = raw?.totalPages ?? Math.max(1, Math.ceil(totalCount / pageSize))
  return { items, totalCount, page, pageSize, totalPages }
}

async function list<T>(
  url: string,
  f: FilterOrderRequest,
  extra: Record<string, string | undefined> = {},
): Promise<Pagination<T>> {
  const extraClean = Object.fromEntries(Object.entries(extra).filter(([, v]) => !!v))
  const { data } = await api.get(url, { params: { ...clean(f), ...extraClean } })
  return normalize<T>(data, f)
}

// ---------- Products ----------
export const productsApi = {
  list: (f: FilterOrderRequest) => list<ProductDto>('/api/product', f),
  /** GET /api/product/List?search=  -> plain list (used in the sales page) */
  all: async (search?: string) =>
    (
      await api.get<ProductDto[]>('/api/product/List', {
        params: search?.trim() ? { search: search.trim() } : undefined,
      })
    ).data,
  get: async (id: string) => (await api.get<ProductDto>(`/api/product/${id}`)).data,
  create: async (body: ProductRequest) => (await api.post<ProductDto>('/api/product', body)).data,
  update: async (id: string, body: ProductRequest) =>
    (await api.put<ProductDto>(`/api/product/${id}`, body)).data,
  toggle: async (id: string) =>
    (await api.patch<ProductDto>(`/api/product/${id}/toggle-activation`)).data,
  remove: async (id: string) => {
    await api.delete(`/api/product/${id}`)
  },
}

// ---------- Orders ----------
export const ordersApi = {
  /** fromDate / toDate are DateOnly: yyyy-MM-dd */
  list: (f: FilterOrderRequest, fromDate?: string, toDate?: string) =>
    list<OrderDto>('/api/order', f, { fromDate, toDate }),
  get: async (id: string) => (await api.get<OrderDto>(`/api/order/${id}`)).data,
  create: async (body: OrderRequest) => (await api.post<OrderDto>('/api/order', body)).data,
  update: async (id: string, body: OrderRequest) =>
    (await api.put<OrderDto>(`/api/order/${id}`, body)).data,
  toggle: async (id: string) =>
    (await api.patch<OrderDto>(`/api/order/${id}/toggle-activation`)).data,
}

// ---------- Dashboard ----------
export const dashboardApi = {
  /** Without dates the backend returns the current business day. */
  get: async (fromDate?: string, toDate?: string) =>
    (
      await api.get<DashboardDto>('/api/dashboard', {
        params: { fromDate: fromDate || undefined, toDate: toDate || undefined },
      })
    ).data,
}

// ---------- Expenses ----------
export const expensesApi = {
  list: (f: FilterOrderRequest) => list<ExpenseDto>('/api/expense', f),
  get: async (id: string) => (await api.get<ExpenseDto>(`/api/expense/${id}`)).data,
  create: async (body: ExpenseRequest) => (await api.post<ExpenseDto>('/api/expense', body)).data,
  update: async (id: string, body: ExpenseRequest) =>
    (await api.put<ExpenseDto>(`/api/expense/${id}`, body)).data,
  remove: async (id: string) => {
    await api.delete(`/api/expense/${id}`)
  },
}
