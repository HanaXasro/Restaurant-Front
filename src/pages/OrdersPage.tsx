import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Pencil, Plus, Printer, RotateCcw, Search } from 'lucide-react'
import { toast } from 'sonner'
import { DateField } from '@/components/DateField'
import { PageHeader } from '@/components/PageHeader'
import { Pager } from '@/components/Pager'
import { SearchInput } from '@/components/SearchInput'
import { TableState } from '@/components/TableState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getErrorMessage, ordersApi, productsApi } from '@/lib/api'
import { invoiceFromOrder } from '@/lib/invoice'
import type { InvoiceData, OrderDto, Pagination } from '@/lib/types'
import { formatDateTime, formatIQD, isCurrentBusinessDay, orderNumber } from '@/lib/utils'

// the PDF library is big, so it loads only when needed
const InvoiceDialog = lazy(() => import('@/components/InvoiceDialog'))

const PAGE_SIZE = 10

interface Filters {
  search: string
  from: string
  to: string
}

const EMPTY: Filters = { search: '', from: '', to: '' }

export default function OrdersPage() {
  // what the user types
  const [draft, setDraft] = useState<Filters>(EMPTY)
  // what was applied with the "search" button
  const [applied, setApplied] = useState<Filters>(EMPTY)
  const [page, setPage] = useState(1)
  const [tick, setTick] = useState(0)

  const [data, setData] = useState<Pagination<OrderDto> | null>(null)
  const [loading, setLoading] = useState(true)

  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [printingId, setPrintingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ordersApi
      .list(
        { search: applied.search.trim() || undefined, page, pageSize: PAGE_SIZE },
        applied.from || undefined,
        applied.to || undefined,
      )
      .then((r) => !cancelled && setData(r))
      .catch((err) => !cancelled && toast.error(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [applied, page, tick])

  function runSearch() {
    let { from } = draft
    const { to } = draft
    if (to && !from) from = to // only "to" chosen -> that one day
    if (from && to && from > to) {
      toast.error('بەرواری «لە» نابێت لە بەرواری «تا» گەورەتر بێت')
      return
    }
    setDraft({ ...draft, from })
    setPage(1)
    setApplied({ ...draft, from })
    setTick((t) => t + 1)
  }

  function reset() {
    setDraft(EMPTY)
    setApplied(EMPTY)
    setPage(1)
  }

  async function openInvoice(o: OrderDto) {
    setPrintingId(o.id)
    try {
      const full = await ordersApi.get(o.id)
      let names: Map<string, string> | undefined
      if ((full.items ?? []).some((i) => !i.product)) {
        const products = await productsApi.all()
        names = new Map(products.map((p) => [p.id, p.name]))
      }
      setInvoice(invoiceFromOrder(full, names))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setPrintingId(null)
    }
  }

  async function toggle(o: OrderDto) {
    try {
      await ordersApi.toggle(o.id)
      toast.success(o.isEnable ? 'داواکارییەکە هەڵوەشێنرایەوە' : 'داواکارییەکە چالاک کرایەوە')
      setTick((t) => t + 1)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const items = data?.items ?? []

  return (
    <>
      <PageHeader
        title="داواکارییەکان"
        description="هەموو فرۆشتنەکان و چاپکردنی پسوولە"
        actions={
          <Button asChild size="lg">
            <Link to="/orders/new">
              <Plus />
              فرۆشتنی نوێ
            </Link>
          </Button>
        }
      />

      <Card>
        <form
          className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end"
          onSubmit={(e) => {
            e.preventDefault()
            runSearch()
          }}
        >
          <div className="space-y-1.5">
            <span className="block text-sm leading-none">گەڕان</span>
            <SearchInput value={draft.search} onChange={(v) => setDraft({ ...draft, search: v })} />
          </div>
          <DateField
            id="o-from"
            label="لە بەروار"
            value={draft.from}
            onChange={(v) => setDraft({ ...draft, from: v })}
          />
          <DateField
            id="o-to"
            label="تا بەروار"
            value={draft.to}
            onChange={(v) => setDraft({ ...draft, to: v })}
          />
          <Button type="submit" size="lg" disabled={loading}>
            <Search />
            گەڕان
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={reset}>
            <RotateCcw />
            پاککردنەوە
          </Button>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ژمارە</TableHead>
              <TableHead>بەروار</TableHead>
              <TableHead>کۆی گشتی</TableHead>
              <TableHead>دۆخ</TableHead>
              <TableHead className="w-32">کردار</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState loading={loading} empty={!loading && items.length === 0} colSpan={5} />
            {!loading &&
              items.map((o) => {
                // only orders of the current business day (starts 03:00 AM) can be edited
                const canEdit = isCurrentBusinessDay(o.createAt)
                return (
                  <TableRow key={o.id} className={o.isEnable ? '' : 'opacity-60'}>
                    <TableCell dir="ltr" className="text-end text-base">
                      {orderNumber(o.id)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDateTime(o.createAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatIQD(o.totalAmount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={o.isEnable}
                          onCheckedChange={() => toggle(o)}
                          aria-label="چالاککردن"
                        />
                        <Badge variant={o.isEnable ? 'success' : 'destructive'}>
                          {o.isEnable ? 'چالاک' : 'هەڵوەشاوە'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openInvoice(o)}
                          disabled={printingId === o.id}
                          aria-label="چاپکردنی پسوولە"
                        >
                          {printingId === o.id ? <Loader2 className="animate-spin" /> : <Printer />}
                        </Button>
                        {canEdit ? (
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/orders/${o.id}/edit`} aria-label="دەستکاریکردن">
                              <Pencil />
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            title="تەنها داواکارییەکانی ئەمڕۆ دەتوانرێت دەستکاری بکرێن"
                            aria-label="دەستکاریکردن ناکرێت"
                          >
                            <Pencil />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
          </TableBody>
        </Table>

        <Pager page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
      </Card>

      {invoice && (
        <Suspense fallback={null}>
          <InvoiceDialog data={invoice} onClose={() => setInvoice(null)} />
        </Suspense>
      )}
    </>
  )
}
