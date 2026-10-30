import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, Minus, Plus, Printer, Save, ShoppingCart, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/PageHeader'
import { SearchInput } from '@/components/SearchInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage, ordersApi, productsApi } from '@/lib/api'
import type { InvoiceData, ProductDto } from '@/lib/types'
import { useDebounce } from '@/lib/hooks'
import {
  cn,
  formatDateTime,
  formatIQD,
  isCurrentBusinessDay,
  onlyDigits,
  orderNumber,
} from '@/lib/utils'

const InvoiceDialog = lazy(() => import('@/components/InvoiceDialog'))

interface CartItem {
  key: string
  id?: string // id of the order item (only when editing)
  productId: string
  name: string
  quantity: number
  unitPrice: number
}

let keySeed = 0
const nextKey = () => `k${++keySeed}`

export default function OrderFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const [products, setProducts] = useState<ProductDto[]>([])
  const [loading, setLoading] = useState(!!id) // loading the order (edit mode only)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [cart, setCart] = useState<CartItem[]>([])
  const [saving, setSaving] = useState<'save' | 'print' | null>(null)
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const cartRef = useRef<HTMLDivElement>(null)

  // load the order when editing (only orders of the current business day can be edited)
  useEffect(() => {
    let cancelled = false
    if (!id) {
      setCart([])
      return
    }
    ;(async () => {
      try {
        const [order, all] = await Promise.all([ordersApi.get(id), productsApi.all()])
        if (cancelled) return
        if (!isCurrentBusinessDay(order.createAt)) {
          toast.error('تەنها داواکارییەکانی ئەمڕۆ دەتوانرێت دەستکاری بکرێن')
          navigate('/orders', { replace: true })
          return
        }
        const names = new Map(all.map((p) => [p.id, p.name]))
        setCart(
          (order.items ?? []).map((i) => ({
            key: nextKey(),
            id: i.id,
            productId: i.productId,
            name: i.product?.name ?? names.get(i.productId) ?? '—',
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        )
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // load products from GET /api/product/List?search=...
  useEffect(() => {
    let cancelled = false
    setLoadingProducts(true)
    productsApi
      .all(debouncedSearch)
      .then((list) => !cancelled && setProducts(list))
      .catch((err) => !cancelled && toast.error(getErrorMessage(err)))
      .finally(() => !cancelled && setLoadingProducts(false))
    return () => {
      cancelled = true
    }
  }, [debouncedSearch])


  const qtyOf = (productId: string) =>
    cart.filter((c) => c.productId === productId).reduce((s, c) => s + c.quantity, 0)

  const total = cart.reduce((s, c) => s + c.quantity * c.unitPrice, 0)
  const count = cart.reduce((s, c) => s + c.quantity, 0)

  function addProduct(p: ProductDto) {
    setCart((prev) => {
      const exists = prev.find((c) => c.productId === p.id)
      if (exists) {
        return prev.map((c) => (c === exists ? { ...c, quantity: c.quantity + 1 } : c))
      }
      return [
        ...prev,
        { key: nextKey(), productId: p.id, name: p.name, quantity: 1, unitPrice: p.price },
      ]
    })
  }

  function setQuantity(key: string, quantity: number) {
    setCart((prev) =>
      prev.map((c) => (c.key === key ? { ...c, quantity: Math.min(Math.max(1, quantity), 9999) } : c)),
    )
  }

  function removeItem(key: string) {
    setCart((prev) => prev.filter((c) => c.key !== key))
  }

  async function save(print: boolean) {
    if (cart.length === 0) {
      toast.error('تکایە بەلایەنی کەمەوە یەک بەرهەم زیاد بکە')
      return
    }
    setSaving(print ? 'print' : 'save')
    try {
      const body = {
        items: cart.map((c) => ({
          id: c.id,
          productId: c.productId,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
        })),
      }
      const order = isEdit ? await ordersApi.update(id!, body) : await ordersApi.create(body)
      toast.success('بە سەرکەوتوویی پاشەکەوتکرا')

      if (print) {
        setInvoice({
          number: orderNumber(order.id),
          date: formatDateTime(order.createAt ?? new Date()),
          items: cart.map((c) => ({ name: c.name, quantity: c.quantity, unitPrice: c.unitPrice })),
          total,
        })
      } else {
        finish()
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(null)
    }
  }

  // after saving: new sale -> empty cart for the next customer, edit -> back to the list
  function finish() {
    if (isEdit) navigate('/orders')
    else setCart([])
  }

  return (
    <>
      <PageHeader
        title={isEdit ? 'دەستکاریکردنی داواکاری' : 'فرۆشتنی نوێ'}
        description={isEdit ? `ژمارە: ${orderNumber(id!)}` : 'بەرهەم هەڵبژێرە بۆ زیادکردن بۆ لیستی فرۆشتن'}
      />

      <div className="grid gap-6 pb-24 lg:grid-cols-[1fr_380px] lg:pb-0">
        {/* Products */}
        <section>
          <div className="mb-4">
            <SearchInput value={search} onChange={setSearch} placeholder="گەڕان بە ناوی بەرهەم..." />
          </div>

          {loadingProducts || loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                {debouncedSearch.trim() ? 'هیچ بەرهەمێک نەدۆزرایەوە' : 'هێشتا هیچ بەرهەمێک زیاد نەکراوە'}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => {
                const q = qtyOf(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className={cn(
                      'relative flex min-h-24 flex-col items-start justify-between gap-2 rounded-xl border bg-card p-4 text-start shadow-sm transition active:scale-95 hover:border-primary hover:shadow-md',
                      q > 0 && 'border-primary bg-accent',
                    )}
                  >
                    {q > 0 && (
                      <span className="absolute end-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                        {q}
                      </span>
                    )}
                    <span className="pe-6 text-base leading-snug">{p.name}</span>
                    <span className="text-sm text-primary">{formatIQD(p.price)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Cart */}
        <aside ref={cartRef} className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                لیستی فرۆشتن
              </CardTitle>
              <Badge>{count} دانە</Badge>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  لیستەکە بەتاڵە. بەرهەمێک هەڵبژێرە.
                </p>
              ) : (
                <ul className="max-h-[45vh] divide-y overflow-y-auto">
                  {cart.map((c) => (
                    <li key={c.key} className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-base">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{formatIQD(c.unitPrice)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-mt-1 h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeItem(c.key)}
                          aria-label="سڕینەوە"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => setQuantity(c.key, c.quantity - 1)}
                            disabled={c.quantity <= 1}
                            aria-label="کەمکردنەوە"
                          >
                            <Minus />
                          </Button>
                          <input
                            inputMode="numeric"
                            dir="ltr"
                            value={c.quantity}
                            onChange={(e) => setQuantity(c.key, Number(onlyDigits(e.target.value)) || 1)}
                            className="h-9 w-12 rounded-md border bg-background text-center text-base"
                            aria-label="ژمارە"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => setQuantity(c.key, c.quantity + 1)}
                            aria-label="زیادکردن"
                          >
                            <Plus />
                          </Button>
                        </div>
                        <span className="text-sm">{formatIQD(c.quantity * c.unitPrice)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="text-muted-foreground">کۆی گشتی</span>
                <span className="font-title text-2xl text-primary">{formatIQD(total)}</span>
              </div>

              <div className="mt-4 grid gap-2">
                <Button size="lg" onClick={() => save(true)} disabled={saving !== null || cart.length === 0}>
                  {saving === 'print' ? <Loader2 className="animate-spin" /> : <Printer />}
                  پاشەکەوتکردن و چاپکردن
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => save(false)}
                  disabled={saving !== null || cart.length === 0}
                >
                  {saving === 'save' ? <Loader2 className="animate-spin" /> : <Save />}
                  تەنها پاشەکەوتکردن
                </Button>
                {cart.length > 0 && !isEdit && (
                  <Button variant="ghost" onClick={() => setCart([])} disabled={saving !== null}>
                    پاککردنەوەی لیست
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Phone: floating total bar */}
      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t bg-card p-3 shadow-lg lg:hidden">
          <div>
            <p className="text-xs text-muted-foreground">{count} دانە</p>
            <p className="font-title text-lg text-primary">{formatIQD(total)}</p>
          </div>
          <Button onClick={() => cartRef.current?.scrollIntoView({ behavior: 'smooth' })}>
            <ShoppingCart />
            بینینی لیست
          </Button>
        </div>
      )}

      {invoice && (
        <Suspense fallback={null}>
          <InvoiceDialog
            data={invoice}
            onClose={() => {
              setInvoice(null)
              finish()
            }}
          />
        </Suspense>
      )}
    </>
  )
}
