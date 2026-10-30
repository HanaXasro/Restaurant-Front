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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { dashboardApi, getErrorMessage } from '@/lib/api'
import type { DashboardDto } from '@/lib/types'
import {
  businessDateString,
  cn,
  formatDateTime,
  formatIQD,
  orderNumber,
  parseDate,
} from '@/lib/utils'

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
      .get(applied.from, applied.to)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && toast.error(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [applied])

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
  }, [applied])

  const income = data?.totalIncome ?? 0
  const expense = data?.totalExpense ?? 0

  const recent = useMemo(
    () =>
      [...(data?.orders ?? [])].sort(
        (a, b) => parseDate(b.createAt).getTime() - parseDate(a.createAt).getTime(),
      ),
    [data],
  )

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
          <CardTitle>دوایین داواکارییەکان</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/orders">هەموو</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ژمارە</TableHead>
                <TableHead>بەروار</TableHead>
                <TableHead>کۆی گشتی</TableHead>
                <TableHead>دۆخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [0, 1, 2].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : recent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    هیچ داواکارییەک نییە
                  </TableCell>
                </TableRow>
              ) : (
                recent.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell dir="ltr" className="text-end">
                      {orderNumber(o.id)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDateTime(o.createAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatIQD(o.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={o.isEnable ? 'success' : 'destructive'}>
                        {o.isEnable ? 'چالاک' : 'هەڵوەشاوە'}
                      </Badge>
                    </TableCell>
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
