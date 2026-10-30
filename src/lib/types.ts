// ---------- DTOs (same as the backend) ----------
export interface BaseDto {
  id: string
  isEnable: boolean
  createAt: string
}

export interface ProductDto extends BaseDto {
  name: string
  price: number
}

export interface ExpenseDto extends BaseDto {
  name: string
  amount: number
  description?: string | null
}

export interface OrderItemDto extends BaseDto {
  orderId: string
  productId: string
  product?: ProductDto | null
  quantity: number
  unitPrice: number
  subTotal: number
}

export interface OrderDto extends BaseDto {
  orderDate: string
  totalAmount: number
  items?: OrderItemDto[] | null
}

export interface DashboardDto {
  totalExpense: number
  totalIncome: number
  totalOrder: number
  orders?: OrderDto[] | null
}

// ---------- Requests ----------
export interface FilterOrderRequest {
  search?: string
  orderBy?: string
  isAscending?: boolean
  page?: number
  pageSize?: number
}

export interface ProductRequest {
  name: string
  price: number
}

export interface ExpenseRequest {
  name: string
  amount: number
  description?: string
}

export interface OrderItemRequest {
  id?: string
  productId: string
  quantity: number
  unitPrice: number
}

export interface OrderRequest {
  items: OrderItemRequest[]
}

// ---------- Pagination ----------
export interface Pagination<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// ---------- Invoice ----------
export interface InvoiceItem {
  name: string
  quantity: number
  unitPrice: number
}

export interface InvoiceData {
  number: string
  date: string
  items: InvoiceItem[]
  total: number
}
