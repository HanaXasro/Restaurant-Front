import { useState, type FormEvent } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { MoneyInput } from '@/components/MoneyInput'
import { PageHeader } from '@/components/PageHeader'
import { Pager } from '@/components/Pager'
import { SearchInput } from '@/components/SearchInput'
import { SalesTypeTabs } from '@/components/SalesTypeTabs'
import { TableState } from '@/components/TableState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getErrorMessage, productsApi } from '@/lib/api'
import { usePagedData, useSalesType } from '@/lib/hooks'
import type { ProductDto } from '@/lib/types'
import { SALES_TYPE_LABEL } from '@/lib/config'
import { formatIQD } from '@/lib/utils'

export default function ProductsPage() {
  const [type, setType] = useSalesType()
  const { data, loading, search, setSearch, page, setPage, reload } = usePagedData<ProductDto>(
    (f) => productsApi.list(f, type),
    10,
    type,
  )

  function changeType(t: typeof type) {
    setType(t)
    setPage(1)
  }

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProductDto | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)

  const [toDelete, setToDelete] = useState<ProductDto | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openForm(p?: ProductDto) {
    setEditing(p ?? null)
    setName(p?.name ?? '')
    setPrice(p ? String(Math.round(p.price)) : '')
    setFormOpen(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    const v = Number(price)
    if (!n) return toast.error('ناوی بەرهەم بنووسە')
    if (!v || v <= 0) return toast.error('نرخێکی دروست بنووسە')

    setSaving(true)
    try {
      if (editing) await productsApi.update(editing.id, { name: n, price: v, type })
      else await productsApi.create({ name: n, price: v, type })
      toast.success('بە سەرکەوتوویی پاشەکەوتکرا')
      setFormOpen(false)
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function toggle(p: ProductDto) {
    try {
      await productsApi.toggle(p.id)
      toast.success(p.isEnable ? 'بەرهەمەکە ناچالاک کرا' : 'بەرهەمەکە چالاک کرا')
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await productsApi.remove(toDelete.id)
      toast.success('بەرهەمەکە سڕایەوە')
      setToDelete(null)
      // if this was the last item on the page, go back one page
      if (data && data.items.length === 1 && page > 1) setPage(page - 1)
      else reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const items = data?.items ?? []

  return (
    <>
      <PageHeader
        title="بەرهەمەکان"
        description="خواردن و خواردنەوەکانی چێشتخانە"
        actions={
          <Button size="lg" onClick={() => openForm()}>
            <Plus />
            بەرهەمی نوێ
          </Button>
        }
      />

      <SalesTypeTabs value={type} onChange={changeType} />

      <Card>
        <div className="p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="گەڕان بە ناوی بەرهەم..." />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ناو</TableHead>
              <TableHead>نرخ</TableHead>
              <TableHead>دۆخ</TableHead>
              <TableHead className="w-28">کردار</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableState loading={loading} empty={!loading && items.length === 0} colSpan={4} />
            {!loading &&
              items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-base">{p.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatIQD(p.price)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={p.isEnable}
                        onCheckedChange={() => toggle(p)}
                        aria-label="چالاککردن"
                      />
                      <Badge variant={p.isEnable ? 'success' : 'destructive'}>
                        {p.isEnable ? 'چالاک' : 'ناچالاک'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openForm(p)} aria-label="دەستکاریکردن">
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setToDelete(p)}
                        aria-label="سڕینەوە"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <Pager page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
      </Card>

      {/* Add / edit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'دەستکاریکردنی بەرهەم' : 'بەرهەمی نوێ'} — {SALES_TYPE_LABEL[type]}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="p-name">ناوی بەرهەم</Label>
              <Input id="p-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-price">نرخ</Label>
              <MoneyInput id="p-price" value={price} onChange={setPrice} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                پاشەکەوتکردن
              </Button>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                پاشگەزبوونەوە
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="سڕینەوەی بەرهەم"
        description={`ئایا دڵنیایت لە سڕینەوەی «${toDelete?.name ?? ''}»؟`}
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </>
  )
}
