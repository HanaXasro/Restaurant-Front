import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarSearch,
  PlusCircle,
  ReceiptText,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { DateField } from '@/components/DateField'
import { PageHeader } from '@/components/PageHeader'
import { SalesTypeTabs } from '@/components/SalesTypeTabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { dashboardApi, getErrorMessage } from '@/lib/api'
import { useSalesType } from '@/lib/hooks'
import type { DashboardDto } from '@/lib/types'
import { businessDateString, cn, formatIQD, formatNumber } from '@/lib/utils'

function StatCard({
  title,
  value,
  icon: Icon,
  tone,
  loading,
}: {
  title: string
  value: string
  icon: LucideIcon
  tone: string
  loading: boolean
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', tone)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-28" />
          ) : (
            <p className="truncate font-title text-xl">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface Range {
  from: string
  to: string
}

export default function DashboardPage() {
  const [type, setType] = useSalesType()
  // what the user types
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  // what was applied with the "show" button (empty = today)
  const [applied, setApplied] = useState<Range>({ from: '', to: '' })

  const [data, setData] = useState<DashboardDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    dashboardApi
      .get(type, applied.from, applied.to)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && toast.error(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [applied, type])

  function show() {
    let f = from
    const t = to
    if (t && !f) f = t // only "to" chosen -> show that one day
    if (f && t && f > t) {
      toast.error('بەرواری «لە» نابێت لە بەرواری «تا» گەورەتر بێت')
      return
    }
    setFrom(f)
    setApplied({ from: f, to: t })
  }

  function quick(offsetDays: number) {
    if (offsetDays === 0) {
      setFrom('')
      setTo('')
      setApplied({ from: '', to: '' })
      return
    }
    const d = businessDateString(offsetDays)
    setFrom(d)
    setTo(d)
    setApplied({ from: d, to: d })
  }

  const periodLabel = useMemo(() => {
    if (!applied.from && !applied.to) return 'ئەمڕۆ'
    if (applied.from && (!applied.to || applied.to === applied.from)) return applied.from
    return `${applied.from} — ${applied.to}`
  }, [applied, type])

  const income = data?.totalIncome ?? 0
  const expense = data?.totalExpense ?? 0

  // every product that was sold in this period (all items, nothing is cut)
  const soldItems = data?.orders ?? []

  return (
    <>
      <PageHeader
        title="داشبۆرد"
        description={`کورتەی کارەکان: ${periodLabel}`}
        actions={
          <Button asChild size="lg">
            <Link to="/orders/new">
              <PlusCircle />
              فرۆشتنی نوێ
            </Link>
          </Button>
        }
      />

      <SalesTypeTabs value={type} onChange={setType} />

      {/* Date filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
            onSubmit={(e) => {
              e.preventDefault()
              show()
            }}
          >
            <DateField id="d-from" label="لە بەروار" value={from} onChange={setFrom} />
            <DateField id="d-to" label="تا بەروار" value={to} onChange={setTo} />
            <Button type="submit" size="lg" disabled={loading}>
              <CalendarSearch />
              پیشاندان
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => quick(-1)}>
              دوێنێ
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => quick(0)}>
              <RotateCcw />
              ئەمڕۆ
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="کۆی فرۆشتن"
          value={formatIQD(income)}
          icon={TrendingUp}
          tone="bg-emerald-100 text-emerald-700"
          loading={loading}
        />
        <StatCard
          title="ژمارەی داواکارییەکان"
          value={String(data?.totalOrder ?? 0)}
          icon={ReceiptText}
          tone="bg-orange-100 text-orange-700"
          loading={loading}
        />
        <StatCard
          title="کۆی خەرجی"
          value={formatIQD(expense)}
          icon={TrendingDown}
          tone="bg-red-100 text-red-700"
          loading={loading}
        />
        <StatCard
          title="قازانج"
          value={formatIQD(income - expense)}
          icon={Wallet}
          tone="bg-sky-100 text-sky-700"
          loading={loading}
        />
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>بەرهەمە فرۆشراوەکان</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/orders">داواکارییەکان</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ناوی بەرهەم</TableHead>
                <TableHead>ژمارە</TableHead>
                <TableHead>کۆی نرخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [0, 1, 2].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={3}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : soldItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                    هیچ فرۆشتنێک نییە
                  </TableCell>
                </TableRow>
              ) : (
                soldItems.map((p, i) => (
                  <TableRow key={`${p.name}-${i}`}>
                    <TableCell className="text-base">{p.name}</TableCell>
                    <TableCell dir="ltr" className="text-end">
                      {formatNumber(p.totalQuantity)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatIQD(p.totalPrice)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
