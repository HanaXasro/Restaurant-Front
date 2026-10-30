import { formatDateTime, orderNumber } from './utils'
import type { InvoiceData, OrderDto } from './types'

/** Builds the invoice data from a full order (with items). */
export function invoiceFromOrder(order: OrderDto, names?: Map<string, string>): InvoiceData {
  const items = (order.items ?? []).map((i) => ({
    name: i.product?.name ?? names?.get(i.productId) ?? '—',
    quantity: i.quantity,
    unitPrice: i.unitPrice,
  }))
  const computed = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  return {
    number: orderNumber(order.id),
    date: formatDateTime(order.createAt ?? order.orderDate),
    items,
    total: order.totalAmount || computed,
  }
}
